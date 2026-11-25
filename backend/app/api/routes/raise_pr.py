from datetime import date, datetime
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import List, Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel, Field, ValidationError
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app import models
from app.api.deps import get_current_user
from app.database import get_db
import os
import smtplib
import logging
from email.message import EmailMessage

logger = logging.getLogger(__name__)


def _email_integration_enabled() -> bool:
    return os.getenv("EMAIL_INTEGRATION", "false").lower() == "true"


def _smtp_config() -> dict:
    return {
        "host": os.getenv("SMTP_HOST", "localhost"),
        "port": int(os.getenv("SMTP_PORT", "25")),
        "user": os.getenv("SMTP_USER"),
        "password": os.getenv("SMTP_PASSWORD"),
        "use_tls": os.getenv("SMTP_USE_TLS", "false").lower() == "true",
        "from_addr": os.getenv("SMTP_FROM", "no-reply@horiba.local"),
    }


def _send_email(*, to, subject, html_body, cc=None) -> None:
    if not to:
        return
    cfg = _smtp_config()
    msg = EmailMessage()
    msg["From"] = cfg["from_addr"]
    msg["To"] = to
    msg["Subject"] = subject
    cc_list = [a for a in (cc or []) if a]
    if cc_list:
        msg["Cc"] = ", ".join(cc_list)
    msg.set_content(html_body, subtype="html")

    with smtplib.SMTP(cfg["host"], cfg["port"], timeout=10) as smtp:
        if cfg["use_tls"]:
            smtp.starttls()
        if cfg["user"]:
            smtp.login(cfg["user"], cfg["password"] or "")
        smtp.send_message(msg, to_addrs=[to, *cc_list])


def _user_email(db: Session, user_id):
    if not user_id:
        return None
    row = db.query(models.Users.email).filter(models.Users.id == user_id).first()
    return row[0] if row else None


def _user_display_name(db: Session, user_id):
    if not user_id:
        return ""
    row = (
        db.query(models.Users.fname, models.Users.lname)
        .filter(models.Users.id == user_id)
        .first()
    )
    return " ".join(n for n in (row.fname, row.lname) if n) if row else ""


def _render_requester_email(*, requester_name, prno, header_id, pr_subject, line_items):
    rows = "".join(
        f"<tr><td>{li.item_type}</td><td>{li.mat_detail}</td>"
        f"<td>{li.item_quan}</td><td>{li.item_unitp}</td>"
        f"<td>{li.item_row_total}</td></tr>"
        for li in line_items
    )
    return f"""
    <p>Hi {requester_name},</p>
    <p>Your Purchase Request <b>{prno}</b> has been submitted successfully.</p>
    <p><b>Subject:</b> {pr_subject}</p>
    <table border="1" cellpadding="4" cellspacing="0">
      <tr><th>Type</th><th>Material</th><th>Qty</th><th>Unit</th><th>Total</th></tr>
      {rows}
    </table>
    <p>PR ID: {header_id}</p>
    """


def _render_approver_email(*, approver_name, requester_name, prno, header_id, pr_subject, line_items):
    rows = "".join(
        f"<tr><td>{li.item_type}</td><td>{li.mat_detail}</td>"
        f"<td>{li.item_quan}</td><td>{li.item_unitp}</td>"
        f"<td>{li.item_row_total}</td></tr>"
        for li in line_items
    )
    return f"""
    <p>Hi {approver_name},</p>
    <p>A purchase request from <b>{requester_name}</b> needs your approval.</p>
    <p><b>PR:</b> {prno} &nbsp; <b>Subject:</b> {pr_subject}</p>
    <table border="1" cellpadding="4" cellspacing="0">
      <tr><th>Type</th><th>Material</th><th>Qty</th><th>Unit</th><th>Total</th></tr>
      {rows}
    </table>
    <p>PR ID: {header_id}</p>
    """

router = APIRouter()
ITEM_TYPES = {
    "Stock(Inventory)",
    "Non-Stock(Consumables)",
    "Asset/CapitalGoods",
    "Promotional",
    "Services",
}
DELIVERY_ADDRESSES = {"del", "pun", "chn", "bng", "hdw", "ngp", "oth"}
AUTO_APPROVED_FUNCTION_IDS = {5, 10, 15, 20, 25}


class PurchaseRequestLineInput(BaseModel):
    item_type: str = Field(min_length=1, max_length=50)
    plant_id: int
    material_detail: str = Field(min_length=1, max_length=100)
    part_no: Optional[str] = Field(default=None, max_length=30)
    material_description: str = Field(min_length=1, max_length=200)
    uom_id: int
    quantity: int = Field(gt=0)
    unit_value: Decimal = Field(ge=0)
    expected_delivery: date
    remarks: Optional[str] = None


class PurchaseRequestInput(BaseModel):
    sub_group_field_id: int
    function_id: Optional[int] = None
    company_type: str = Field(min_length=1, max_length=100)
    buyer_id: int
    priority: int = Field(ge=1, le=3)
    resale: str = Field(pattern="^(Yes|No)$")
    customer_name: Optional[str] = Field(default=None, max_length=50)
    customer_po_number: Optional[str] = Field(default=None, max_length=100)
    hin_use: str = Field(pattern="^(Yes|No)$")
    hin_use_clarify: Optional[str] = None
    back_charge: Optional[str] = Field(default=None, max_length=10)
    delivery_address: str = Field(min_length=1)
    other_delivery_address: Optional[str] = None
    subject: str = Field(min_length=1)
    project_number: Optional[str] = Field(default=None, max_length=200)
    purpose: str = Field(min_length=1, max_length=255)
    cc_user_id: Optional[int] = None
    remarks: Optional[str] = None
    lines: List[PurchaseRequestLineInput] = Field(min_length=1, max_length=300)


def _active_filter(column):
    return or_(column == 0, column.is_(None))


def _generate_pr_number(db: Session, delivery_address: str) -> str:
    plant = (
        db.query(models.CmPlant)
        .filter(
            models.CmPlant.plant_short_code == delivery_address,
            _active_filter(models.CmPlant.df),
        )
        .first()
    )
    plant_code = plant.plnt_code if plant and plant.plnt_code else "0000"

    latest_request = (
        db.query(models.PurReqHdrNew)
        .order_by(models.PurReqHdrNew.pur_req_hdr_id.desc())
        .with_for_update()
        .first()
    )
    last_sequence = 0
    if latest_request:
        suffix = (latest_request.prno or "")[-5:]
        if not suffix.isdigit():
            raise HTTPException(
                status_code=500,
                detail="Unable to determine the next PR number from the latest request.",
            )
        last_sequence = int(suffix)

    today = date.today().strftime("%y%m%d")
    while last_sequence < 99999:
        last_sequence += 1
        prno = f"PR{plant_code}{today}{last_sequence:05d}"
        exists = (
            db.query(models.PurReqHdrNew.pur_req_hdr_id)
            .filter(models.PurReqHdrNew.prno == prno)
            .first()
        )
        if not exists:
            return prno

    raise HTTPException(status_code=409, detail="The PR number sequence is exhausted.")


@router.get("/raise-pr/options")
def get_raise_pr_options(
    current_user: models.Users = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    group_id = current_user.group_field_id
    group = (
        db.query(models.GroupField)
        .filter(
            models.GroupField.group_field_id == group_id,
            _active_filter(models.GroupField.df),
        )
        .first()
    )
    if not group:
        raise HTTPException(status_code=404, detail="Your group field is not available.")

    sub_groups = (
        db.query(models.SubGroupField)
        .filter(
            models.SubGroupField.group_field_id == group_id,
            _active_filter(models.SubGroupField.df),
        )
        .order_by(models.SubGroupField.descptn)
        .all()
    )
    functions = (
        db.query(models.Func)
        .filter(
            models.Func.group_field_id == group_id,
            _active_filter(models.Func.df),
        )
        .order_by(models.Func.descptn)
        .all()
    )
    buyers = (
        db.query(models.Users)
        .filter(
            models.Users.user_role == "2",
            _active_filter(models.Users.df),
        )
        .order_by(models.Users.fname, models.Users.lname)
        .all()
    )
    cc_users = (
        db.query(models.Users)
        .filter(_active_filter(models.Users.df))
        .order_by(models.Users.fname, models.Users.lname)
        .all()
    )
    plants = (
        db.query(models.CmPlant)
        .filter(_active_filter(models.CmPlant.df))
        .order_by(models.CmPlant.plnt_details)
        .all()
    )
    uoms = (
        db.query(models.CmUom)
        .filter(_active_filter(models.CmUom.df))
        .order_by(models.CmUom.uom, models.CmUom.uom_text)
        .all()
    )

    return {
        "requester": {
            "id": current_user.id,
            "name": " ".join(
                name for name in (current_user.fname, current_user.lname) if name
            ),
            "email": current_user.email,
            "group_field_id": group_id,
            "group_field": group.descptn or "",
        },
        "sub_groups": [
            {"id": row.sub_group_field_id, "name": row.descptn}
            for row in sub_groups
        ],
        "functions": [
            {
                "id": row.function_id,
                "sub_group_field_id": row.sub_group_field_id,
                "name": row.descptn,
            }
            for row in functions
        ],
        "buyers": [
            {
                "id": row.id,
                "name": " ".join(name for name in (row.fname, row.lname) if name),
            }
            for row in buyers
        ],
        "cc_users": [
            {
                "id": row.id,
                "name": " ".join(name for name in (row.fname, row.lname) if name),
            }
            for row in cc_users
        ],
        "plants": [
            {
                "id": row.cm_plnt_id,
                "name": row.plnt_details,
                "code": row.plnt_code,
            }
            for row in plants
        ],
        "uom_source": [
            {
                "id": row.cm_uom_id,
                "code": row.uom,
                "text": row.uom_text,
                "name": f"{row.uom}-{row.uom_text}",
            }
            for row in uoms
        ],
    }


@router.post("/purchase-requests")
async def create_purchase_request(
    request_data: str = Form(...),
    attachment: Optional[UploadFile] = File(None),
    current_user: models.Users = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        request = PurchaseRequestInput.model_validate_json(request_data)
    except ValidationError as error:
        raise RequestValidationError(error.errors()) from error

    group_id = current_user.group_field_id
    subgroup = (
        db.query(models.SubGroupField)
        .filter(
            models.SubGroupField.sub_group_field_id == request.sub_group_field_id,
            models.SubGroupField.group_field_id == group_id,
            _active_filter(models.SubGroupField.df),
        )
        .first()
    )
    if not subgroup:
        raise HTTPException(status_code=422, detail="Select a valid subgroup.")

    function_id = request.function_id
    if group_id == 4:
        function_id = None
    elif function_id is None or not db.query(models.Func).filter(
        models.Func.function_id == function_id,
        models.Func.group_field_id == group_id,
        models.Func.sub_group_field_id == request.sub_group_field_id,
        _active_filter(models.Func.df),
    ).first():
        raise HTTPException(status_code=422, detail="Select a valid function.")

    buyer = (
        db.query(models.Users)
        .filter(
            models.Users.id == request.buyer_id,
            models.Users.user_role == "2",
            _active_filter(models.Users.df),
        )
        .first()
    )
    if not buyer:
        raise HTTPException(status_code=422, detail="Select a valid buyer.")

    if request.cc_user_id is not None and not db.query(models.Users).filter(
        models.Users.id == request.cc_user_id,
        _active_filter(models.Users.df),
    ).first():
        raise HTTPException(status_code=422, detail="Select a valid CC user.")

    approver_query = db.query(models.ApprovalMatrix).filter(
        models.ApprovalMatrix.group_field_id == group_id,
        models.ApprovalMatrix.sub_group_field_id == request.sub_group_field_id,
        _active_filter(models.ApprovalMatrix.df),
    )
    if group_id in {4, 6}:
        approver_query = approver_query.filter(
            models.ApprovalMatrix.function_id.is_(None)
        )
    else:
        approver_query = approver_query.filter(
            models.ApprovalMatrix.function_id == function_id
        )
    approver_assignment = (
        approver_query.order_by(models.ApprovalMatrix.approval_matrix_id).first()
    )
    if not approver_assignment:
        raise HTTPException(
            status_code=422,
            detail="No approver is configured for this group, subgroup, and function.",
        )

    approver = (
        db.query(models.Users)
        .filter(
            models.Users.id == approver_assignment.approver_id,
            _active_filter(models.Users.df),
        )
        .first()
    )
    if not approver:
        raise HTTPException(
            status_code=422,
            detail="The configured approver is not an active user.",
        )

    plant_ids = {line.plant_id for line in request.lines}
    uom_ids = {line.uom_id for line in request.lines}
    valid_plant_ids = {
        row.cm_plnt_id
        for row in db.query(models.CmPlant.cm_plnt_id).filter(
            models.CmPlant.cm_plnt_id.in_(plant_ids),
            _active_filter(models.CmPlant.df),
        )
    }
    valid_uom_ids = {
        row.cm_uom_id
        for row in db.query(models.CmUom.cm_uom_id).filter(
            models.CmUom.cm_uom_id.in_(uom_ids),
            _active_filter(models.CmUom.df),
        )
    }
    if valid_plant_ids != plant_ids:
        raise HTTPException(status_code=422, detail="One or more plants are invalid.")
    if valid_uom_ids != uom_ids:
        raise HTTPException(status_code=422, detail="One or more units of measure are invalid.")

    if request.delivery_address not in DELIVERY_ADDRESSES:
        raise HTTPException(status_code=422, detail="Select a valid delivery address.")
    if request.delivery_address == "oth" and not request.other_delivery_address:
        raise HTTPException(status_code=422, detail="Provide the other delivery address.")
    if not request.subject.strip() or not request.purpose.strip():
        raise HTTPException(status_code=422, detail="Subject and purchase purpose are required.")
    if request.resale == "Yes" and (
        not request.customer_name or not request.customer_name.strip()
        or not request.customer_po_number or not request.customer_po_number.strip()
    ):
        raise HTTPException(
            status_code=422,
            detail="Customer name and customer PO number are required for resale requests.",
        )
    if request.hin_use == "Yes" and (
        not request.hin_use_clarify or not request.hin_use_clarify.strip()
    ):
        raise HTTPException(
            status_code=422,
            detail="Clarification is required when the request is for HIN own use.",
        )
    for line in request.lines:
        if line.item_type not in ITEM_TYPES:
            raise HTTPException(status_code=422, detail="Select a valid item type.")
        if not line.material_detail.strip() or not line.material_description.strip():
            raise HTTPException(
                status_code=422,
                detail="Material details and descriptions cannot be blank.",
            )
        if (
            line.item_type == "Stock(Inventory)"
            and (not line.part_no or not line.part_no.strip())
        ):
            raise HTTPException(
                status_code=422,
                detail="A material code/reference is required for stock items.",
            )
        if not line.unit_value.is_finite():
            raise HTTPException(status_code=422, detail="Unit values must be finite.")

    total = sum(
        (Decimal(line.quantity) * line.unit_value for line in request.lines),
        Decimal("0"),
    )
    if not total.is_finite():
        raise HTTPException(status_code=422, detail="The request total is invalid.")

    now = datetime.now()
    obj_id = uuid4().hex[:20]
    prno = _generate_pr_number(db, request.delivery_address)
    auto_approved = function_id in AUTO_APPROVED_FUNCTION_IDS
    approval_status_id = 3 if auto_approved else 2
    attachment_path = None
    attachment_name = None
    content = b""
    if attachment:
        extension = Path(attachment.filename or "").suffix.lower()
        if extension not in {".pdf", ".zip"}:
            raise HTTPException(
                status_code=422, detail="Attachments must be a PDF or ZIP file."
            )
        content = await attachment.read(8 * 1024 * 1024 + 1)
        if len(content) > 8 * 1024 * 1024:
            raise HTTPException(
                status_code=413, detail="Attachments cannot exceed 8 MB."
            )
        attachment_name = f"{uuid4().hex}{extension}"
        attachment_path = (
            Path(__file__).resolve().parents[3]
            / "storage"
            / "pr_attachments"
            / attachment_name
        )

    header = models.PurReqHdrNew(
        company_type=request.company_type,
        id=current_user.id,
        prno=prno,
        pr_date=date.today(),
        extra_col=9999,
        group_field_id=group_id,
        sub_group_field_id=request.sub_group_field_id,
        functn=function_id,
        pr_approver_id=approver.id,
        pr_buyer=buyer.id,
        cc2=str(request.cc_user_id) if request.cc_user_id else None,
        pr_subject=request.subject.strip(),
        pr_purpose=request.purpose.strip(),
        pr_priority=request.priority,
        pr_rem=request.remarks,
        pr_total=str(total.quantize(Decimal("0.01"))),
        hin_use=request.hin_use,
        hin_use_clarify=request.hin_use_clarify,
        resale=request.resale,
        resale_cus_name=request.customer_name,
        po_num=request.customer_po_number,
        back_char=request.back_charge,
        deliv_adrc=request.delivery_address,
        othr_adrc=request.other_delivery_address,
        project_no=request.project_number,
        obj_id=obj_id,
        created_at=now,
        created_by=current_user.id,
        df=0,
        approval_status_id=approval_status_id,
        pr_status_id=1,
        approve_date=now.date() if auto_approved else None,
        approve_by=current_user.id if auto_approved else None,
        attch_doc=str(attachment_path) if attachment_path else "",
    )

    try:
        if attachment_path:
            attachment_path.parent.mkdir(parents=True, exist_ok=True)
            with attachment_path.open("xb") as file:
                file.write(content)

        db.add(header)
        db.flush()
        for index, line in enumerate(request.lines, start=1):
            db.add(
                models.PurReqLine(
                    pur_req_hdr_id=header.pur_req_hdr_id,
                    line_item=index * 10,
                    item_type=line.item_type,
                    cm_plnt_id=line.plant_id,
                    mat_detail=line.material_detail,
                    part_no=line.part_no,
                    cm_uom_id=line.uom_id,
                    cm_mat_id=line.material_description,
                    item_quan=line.quantity,
                    item_unitp=float(line.unit_value),
                    item_row_total=float(
                        (Decimal(line.quantity) * line.unit_value).quantize(
                            Decimal("0.01")
                        )
                    ),
                    exp_deliv=line.expected_delivery.isoformat(),
                    item_remarks=line.remarks,
                    obj_id=obj_id,
                    created_at=date.today(),
                    created_by=current_user.id,
                    df=0,
                    pr_df=0,
                )
            )

        if attachment_name:
            db.add(
                models.Attachments(
                    name=attachment_name,
                    pur_req_hdr_id=header.pur_req_hdr_id,
                    obj_id=uuid4().hex[:20],
                    created_at=now,
                    created_by=current_user.id,
                    df=0,
                )
            )

        db.add(
            models.ApprovalStat(
                pur_req_hdr_id=header.pur_req_hdr_id,
                prno=header.prno,
                id=current_user.id,
                modifier_id=approver.id,
                approval_status_id=approval_status_id,
                pr_status_id=1,
                flag=0,
                pr_df=0,
                obj_id=obj_id,
                created_at=date.today(),
                created_by=current_user.id,
            )
        )
        db.commit()
        db.refresh(header)
    except (InvalidOperation, ValueError):
        db.rollback()
        if attachment_path and attachment_path.exists():
            attachment_path.unlink()
        raise HTTPException(status_code=422, detail="The purchase request contains invalid values.")
    except Exception:
        db.rollback()
        if attachment_path and attachment_path.exists():
            attachment_path.unlink()
        raise
    
    if _email_integration_enabled():
        try:
            line_items = (
                db.query(models.PurReqLine)
                .filter(
                    models.PurReqLine.pur_req_hdr_id == header.pur_req_hdr_id,
                    models.PurReqLine.df == 0,
                )
                .order_by(models.PurReqLine.pur_req_line_id)
                .all()
            )

            requester_email = _user_email(db, current_user.id)
            requester_name = _user_display_name(db, current_user.id) or "there"

            # mail 1: to requester
            _send_email(
                to=requester_email,
                subject=f"New PR Raised {header.prno}",
                html_body=_render_requester_email(
                    requester_name=requester_name,
                    prno=header.prno,
                    header_id=header.pur_req_hdr_id,
                    pr_subject=header.pr_subject,
                    line_items=line_items,
                ),
            )

            # mail 2: to approver, CC = cc1 (matrix) + cc2 (form)
            approver_email = _user_email(db, approver.id)
            approver_name = _user_display_name(db, approver.id) or "Approver"
            cc_emails = [
                _user_email(db, approver_assignment.cc1),
                _user_email(db, request.cc_user_id),
            ]
            _send_email(
                to=approver_email,
                subject=f"Purchase Request - Approval required {header.prno}",
                html_body=_render_approver_email(
                    approver_name=approver_name,
                    requester_name=requester_name,
                    prno=header.prno,
                    header_id=header.pur_req_hdr_id,
                    pr_subject=header.pr_subject,
                    line_items=line_items,
                ),
                cc=cc_emails,
            )
        except Exception:
            # log but never fail the request — the PR is already saved
            logger.exception("PR email integration failed for %s", header.prno)

    return {
        "response": "success",
        "message": (
            "Purchase request created as an approved draft."
            if auto_approved
            else "Purchase request submitted for approval."
        ),
        "pur_req_hdr_id": header.pur_req_hdr_id,
        "prno": header.prno,
    }
