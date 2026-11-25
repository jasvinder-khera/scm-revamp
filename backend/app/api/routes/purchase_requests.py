from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_, cast, or_, String
from sqlalchemy.orm import Session, aliased

from app import models
from app.api.deps import get_current_user
from app.database import get_db

router = APIRouter()

REQUESTOR_IDS = (379, 489, 332, 453, 490, 473)
SPECIAL_REQUESTOR_IDS = (489, 379, 490, 332, 645)
VB_ADMIN_IDS = (385, 336, 653)


def _full_name(first_name: Optional[str], last_name: Optional[str]) -> str:
    return " ".join(name for name in (first_name, last_name) if name)


def _buyer_id(bid: str) -> int:
    try:
        return int(bid)
    except ValueError as error:
        raise HTTPException(status_code=400, detail="bid must be 'all' or a buyer ID") from error


@router.get("/purchase-requests/{bid}")
def get_all_purchase_requests(
    bid: str,
    start: int = Query(0, ge=0),
    length: int = Query(5, ge=1, le=500),
    draw: int = Query(0, ge=0),
    search_value: str = Query("", alias="search[value]", max_length=100),
    current_user: models.Users = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        user_role = int(current_user.user_role)
    except (TypeError, ValueError) as error:
        raise HTTPException(status_code=403, detail="Unauthorized role") from error

    pr = models.PurReqHdrNew
    buyer_user = aliased(models.Users)
    requestor_user = aliased(models.Users)
    approver_user = aliased(models.Users)
    cc_user = aliased(models.Users)
    group_field = aliased(models.GroupField)
    sub_group_field = aliased(models.SubGroupField)
    approval_status = aliased(models.CmApprovalStatus)
    pr_status = aliased(models.CmPrStatus)

    query = (
        db.query(
            pr,
            buyer_user.fname.label("buyer_fname"),
            buyer_user.lname.label("buyer_lname"),
            requestor_user.fname.label("requestor_fname"),
            requestor_user.lname.label("requestor_lname"),
            approver_user.fname.label("approver_fname"),
            approver_user.lname.label("approver_lname"),
            cc_user.fname.label("cc_fname"),
            cc_user.lname.label("cc_lname"),
            group_field.descptn.label("group_field_name"),
            sub_group_field.descptn.label("sub_group_field_name"),
            approval_status.apr_stat_descrip.label("approval_status_name"),
            pr_status.pr_stat_descrip.label("pr_status_name"),
        )
        .outerjoin(
            buyer_user,
            and_(buyer_user.id == pr.pr_buyer, buyer_user.df == 0),
        )
        .outerjoin(requestor_user, requestor_user.id == pr.id)
        .outerjoin(approver_user, approver_user.id == pr.pr_approver_id)
        .outerjoin(cc_user, cc_user.id == cast(pr.cc2, models.Integer))
        .outerjoin(
            group_field,
            and_(group_field.group_field_id == pr.group_field_id, group_field.df == 0),
        )
        .outerjoin(
            sub_group_field,
            and_(
                sub_group_field.sub_group_field_id == pr.sub_group_field_id,
                sub_group_field.df == 0,
            ),
        )
        .outerjoin(approval_status, approval_status.approval_status_id == pr.approval_status_id)
        .outerjoin(pr_status, pr_status.pr_status_id == pr.pr_status_id)
        .filter(
            pr.df == 0,
            pr.pr_date >= date(2023, 1, 1),
            pr.pr_buyer != 9,
        )
    )

    if user_role == 0 and bid == "req":
        if current_user.id in SPECIAL_REQUESTOR_IDS:
            query = query.filter(pr.id.in_(REQUESTOR_IDS))
        else:
            query = query.filter(pr.id == current_user.id)
    elif user_role == 1 and bid == "apr":
        approver_requests = (
            db.query(models.ApprovalStat.pur_req_hdr_id)
            .filter(models.ApprovalStat.modifier_id == current_user.id)
            .subquery()
        )
        query = query.filter(pr.pur_req_hdr_id.in_(approver_requests))
    elif current_user.id in VB_ADMIN_IDS:
        if bid != "all":
            query = query.filter(pr.pr_buyer == _buyer_id(bid))
    elif user_role == 2:
        if bid != "all":
            query = query.filter(pr.pr_buyer == _buyer_id(bid))
    elif user_role == 3 or current_user.department_head == 1:
        if bid != "all":
            raise HTTPException(status_code=400, detail="This role must request bid='all'")
    else:
        raise HTTPException(status_code=403, detail="Unauthorized role or bid")

    records_total = query.count()
    if search_value.strip():
        pattern = f"%{search_value.strip()}%"
        query = query.filter(
            or_(
                pr.prno.ilike(pattern),
                pr.pr_subject.ilike(pattern),
                pr.po_num.ilike(pattern),
                cast(pr.pr_date, String).ilike(pattern),
            )
        )

    records_filtered = query.count()
    results = (
        query.order_by(pr.pur_req_hdr_id.desc())
        .offset(start)
        .limit(length)
        .all()
    )

    data = []
    for index, row in enumerate(results):
        request = row[0]
        data.append(
            {
                "s_no": start + index + 1,
                "pur_req_hdr_id": request.pur_req_hdr_id,
                "group_field": row.group_field_name or "",
                "sub_group_field": row.sub_group_field_name or "",
                "pr_no": request.prno or "",
                "approval_status": row.approval_status_name or "",
                "req_name": _full_name(row.requestor_fname, row.requestor_lname),
                "date": request.pr_date.isoformat() if request.pr_date else None,
                "pr_subject": request.pr_subject or "",
                "pr_status": row.pr_status_name or "",
                "pr_approve_date": (
                    request.approve_date.isoformat() if request.approve_date else None
                ),
                "resale_cus_name": request.resale_cus_name or "",
                "po_num": request.po_num or "",
                "Approver": _full_name(row.approver_fname, row.approver_lname),
                "pr_priority": request.pr_priority,
                "pr_buyer": _full_name(row.buyer_fname, row.buyer_lname),
                "buyer_remark": "",
                "cc_user": _full_name(row.cc_fname, row.cc_lname) or request.cc2 or "",
            }
        )

    return {
        "draw": draw,
        "recordsTotal": records_total,
        "recordsFiltered": records_filtered,
        "data": data,
    }


@router.get("/purchase-requests/{bid}/line-items")
def get_purchase_request_line_items(
    bid: str,
    start: int = Query(0, ge=0),
    length: int = Query(5, ge=1, le=500),
    draw: int = Query(0, ge=0),
    search_value: str = Query("", alias="search[value]", max_length=100),
    status_filter: Optional[str] = Query(None, max_length=50),
    po_no_filter: Optional[str] = Query(None, max_length=20),
    current_user: models.Users = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        user_role = int(current_user.user_role)
    except (TypeError, ValueError) as error:
        raise HTTPException(status_code=403, detail="Unauthorized role") from error

    pr = models.PurReqHdrNew
    line = models.PurReqLine
    line_user = aliased(models.Users)
    buyer_user = aliased(models.Users)
    cc_user = aliased(models.Users)
    group_field = aliased(models.GroupField)
    sub_group_field = aliased(models.SubGroupField)
    approval_status = aliased(models.CmApprovalStatus)
    pr_status = aliased(models.CmPrStatus)
    plant = aliased(models.CmPlant)

    query = (
        db.query(
            pr,
            line,
            line_user.fname.label("line_user_fname"),
            line_user.lname.label("line_user_lname"),
            buyer_user.fname.label("buyer_fname"),
            buyer_user.lname.label("buyer_lname"),
            cc_user.fname.label("cc_fname"),
            cc_user.lname.label("cc_lname"),
            group_field.descptn.label("group_field_name"),
            sub_group_field.descptn.label("sub_group_field_name"),
            approval_status.apr_stat_descrip.label("approval_status_name"),
            pr_status.pr_stat_descrip.label("pr_status_name"),
            plant.plnt_code.label("plant_code"),
        )
        .join(line, line.pur_req_hdr_id == pr.pur_req_hdr_id)
        .join(
            line_user,
            and_(line_user.id == line.created_by, line_user.df == 0),
        )
        .outerjoin(buyer_user, and_(buyer_user.id == pr.pr_buyer, buyer_user.df == 0))
        .outerjoin(cc_user, and_(cc_user.id == cast(pr.cc2, models.Integer), cc_user.df == 0))
        .outerjoin(
            group_field,
            and_(group_field.group_field_id == pr.group_field_id, group_field.df == 0),
        )
        .outerjoin(
            sub_group_field,
            and_(
                sub_group_field.sub_group_field_id == pr.sub_group_field_id,
                sub_group_field.df == 0,
            ),
        )
        .outerjoin(approval_status, approval_status.approval_status_id == pr.approval_status_id)
        .outerjoin(pr_status, pr_status.pr_status_id == pr.pr_status_id)
        .outerjoin(plant, and_(plant.cm_plnt_id == line.cm_plnt_id, plant.df == 0))
        .filter(
            pr.df == 0,
            line.df == 0,
            pr.pr_date >= date(2023, 1, 1),
            line_user.id != 9,
            or_(pr.pr_status_id != 2, pr.pr_status_id.is_(None)),
        )
    )

    if user_role == 0 and bid == "req":
        if current_user.id in SPECIAL_REQUESTOR_IDS:
            query = query.filter(pr.id.in_(REQUESTOR_IDS))
        else:
            query = query.filter(pr.id == current_user.id)
    elif user_role == 1 and bid == "apr":
        approver_requests = (
            db.query(models.ApprovalStat.pur_req_hdr_id)
            .filter(models.ApprovalStat.modifier_id == current_user.id)
            .subquery()
        )
        query = query.filter(pr.pur_req_hdr_id.in_(approver_requests))
    elif current_user.id in VB_ADMIN_IDS:
        if bid != "all":
            query = query.filter(pr.pr_buyer == _buyer_id(bid))
    elif user_role == 2:
        if bid != "all":
            query = query.filter(pr.pr_buyer == _buyer_id(bid))
    elif user_role == 3 or current_user.department_head == 1:
        if bid != "all":
            raise HTTPException(status_code=400, detail="This role must request bid='all'")
    else:
        raise HTTPException(status_code=403, detail="Unauthorized role or bid")

    records_total = query.count()

    if status_filter == "PO Released":
        query = query.filter(line.po_action == "PO Released")
    elif status_filter == "PR Closed":
        query = query.filter(pr.pr_status_id == 7)
    elif status_filter == "Open PR":
        query = query.filter(or_(line.po_status == "Open", line.po_status.is_(None)))
    elif status_filter == "PO No. Present":
        query = query.filter(line.po_no.is_not(None), line.po_no != "")
    elif status_filter == "PO No. Empty":
        query = query.filter(or_(line.po_no.is_(None), line.po_no == ""))
    elif status_filter == "po_no_empty_approve_pr":
        query = query.filter(
            pr.approval_status_id == 3,
            or_(line.po_no.is_(None), line.po_no == ""),
        )
    elif status_filter == "Approved PR":
        query = query.filter(pr.approval_status_id == 3)
    elif status_filter == "Non-Approved PR":
        query = query.filter(
            or_(pr.approval_status_id != 3, pr.approval_status_id.is_(None))
        )

    if po_no_filter == "present":
        query = query.filter(line.po_no.is_not(None), line.po_no != "")
    elif po_no_filter == "empty":
        query = query.filter(
            or_(
                and_(line.po_no.is_(None), pr.approve_by.is_not(None)),
                line.po_no == "",
            )
        )

    if search_value.strip():
        pattern = f"%{search_value.strip()}%"
        query = query.filter(
            or_(
                pr.prno.ilike(pattern),
                cast(pr.pr_date, String).ilike(pattern),
                line.cm_mat_id.ilike(pattern),
                pr.pr_subject.ilike(pattern),
            )
        )

    records_filtered = query.count()
    results = (
        query.order_by(pr.pur_req_hdr_id.desc(), line.pur_req_line_id.asc())
        .offset(start)
        .limit(length)
        .all()
    )

    data = []
    today = date.today()
    for row in results:
        request, request_line = row[0], row[1]
        data.append(
            {
                "group_field": row.group_field_name or "",
                "sub_group_field": row.sub_group_field_name or "",
                "Pr_no": request.prno or "",
                "pr_date": request.pr_date.isoformat() if request.pr_date else "",
                "material_desc": request_line.cm_mat_id or "N/A",
                "requestor": _full_name(row.line_user_fname, row.line_user_lname) or "N/A",
                "approval_status": row.approval_status_name or "",
                "pr_stat": row.pr_status_name or "",
                "pr_Approved_date": (
                    request.approve_date.isoformat() if request.approve_date else ""
                ),
                "customer_name": request.resale_cus_name or "",
                "customer_po_no": request.po_num or "",
                "buyer": _full_name(row.buyer_fname, row.buyer_lname),
                "item_type": request_line.item_type or "",
                "plant_code": row.plant_code or "",
                "mat_detail": request_line.mat_detail or "",
                "mc_ph_cc": request_line.part_no or "N/A",
                "quantity": request_line.item_quan or 0,
                "received_qty": request_line.received_qty,
                "po_no": request_line.po_no or "",
                "po_creation_date": (
                    request_line.po_creation_date.isoformat()
                    if request_line.po_creation_date
                    else ""
                ),
                "po_rls_date": (
                    request_line.po_rls_date.isoformat() if request_line.po_rls_date else ""
                ),
                "po_action": request_line.po_action or "",
                "status": (
                    "PR Closed"
                    if request_line.po_status == "Open"
                    else "PO Closed"
                    if request_line.po_status == "Close"
                    else request_line.po_status or ""
                ),
                "pr_ageing": (
                    max((today - request.pr_date).days, 0) if request.pr_date else None
                ),
                "cc_user": _full_name(row.cc_fname, row.cc_lname) or request.cc2 or "",
                "id": request.pur_req_hdr_id,
            }
        )

    return {
        "draw": draw,
        "recordsTotal": records_total,
        "recordsFiltered": records_filtered,
        "data": data,
    }
    
@router.get("/deleted-purchase-requests")
def get_deleted_purchase_requests(
    start: int = Query(0, ge=0),
    length: int = Query(5, ge=1, le=500),
    draw: int = Query(0, ge=0),
    search_value: str = Query("", alias="search[value]", max_length=100),
    current_user: models.Users = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        user_role = int(current_user.user_role)
    except (TypeError, ValueError) as error:
        raise HTTPException(status_code=403, detail="Unauthorized role") from error

    pr = models.PurReqHdrNew
    buyer_user = aliased(models.Users)
    requestor_user = aliased(models.Users)
    approver_user = aliased(models.Users)
    cc_user = aliased(models.Users)
    group_field = aliased(models.GroupField)
    sub_group_field = aliased(models.SubGroupField)
    pr_status = aliased(models.CmPrStatus)

    query = (
        db.query(
            pr,
            buyer_user.fname.label("buyer_fname"),
            buyer_user.lname.label("buyer_lname"),
            requestor_user.fname.label("requestor_fname"),
            requestor_user.lname.label("requestor_lname"),
            approver_user.fname.label("approver_fname"),
            approver_user.lname.label("approver_lname"),
            cc_user.fname.label("cc_fname"),
            cc_user.lname.label("cc_lname"),
            group_field.descptn.label("group_field_name"),
            sub_group_field.descptn.label("sub_group_field_name"),
            pr_status.pr_stat_descrip.label("pr_status_name"),
        )
        .outerjoin(
            buyer_user,
            and_(buyer_user.id == pr.pr_buyer, buyer_user.df == 1),   # df=1, not 0
        )
        .outerjoin(requestor_user, requestor_user.id == pr.id)        # pr.id == requestor user id
        .outerjoin(approver_user, approver_user.id == pr.pr_approver_id)
        .outerjoin(cc_user, cc_user.id == cast(pr.cc2, models.Integer))
        .outerjoin(
            group_field,
            and_(group_field.group_field_id == pr.group_field_id, group_field.df == 0),
        )
        .outerjoin(
            sub_group_field,
            and_(
                sub_group_field.sub_group_field_id == pr.sub_group_field_id,
                sub_group_field.df == 0,
            ),
        )
        .outerjoin(pr_status, pr_status.pr_status_id == pr.pr_status_id)
        .filter(
            pr.df == 1,
            pr.pr_date >= date(2023, 1, 1),
            # NO pr_buyer != 9 — Laravel doesn't filter this in the deleted view
        )
    )

    # ---- Role filter (order matters) ----
    if current_user.department_head == 1 or user_role == 3:
        pass
    elif user_role == 1:
        query = query.filter(pr.pr_approver_id == current_user.id)
    elif user_role == 2:
        query = query.filter(pr.pr_buyer == current_user.id)
    elif user_role == 0:
        query = query.filter(pr.created_by == current_user.id)
    else:
        raise HTTPException(status_code=403, detail="Unauthorized role")

    # ---- Search ----
    if search_value.strip():
        pattern = f"%{search_value.strip()}%"
        query = query.filter(
            or_(
                pr.prno.ilike(pattern),
                pr.pr_subject.ilike(pattern),
                pr.po_num.ilike(pattern),
                cast(pr.pr_date, String).ilike(pattern),
            )
        )

    total_records = query.count()

    results = (
        query.order_by(pr.pur_req_hdr_id.desc())
        .offset(start)
        .limit(length)
        .all()
    )

    data = []
    for index, row in enumerate(results):
        request = row[0]
        data.append({
            "s_no": start + index + 1,
            "group_field": row.group_field_name or " ",
            "sub_group_field": row.sub_group_field_name or "",
            "pr_no": request.prno or "",
            "req_name": _full_name(row.requestor_fname, row.requestor_lname),
            "date": request.pr_date.isoformat() if request.pr_date else None,
            "pr_subject": request.pr_subject or "",
            "pr_status": row.pr_status_name or "",
            "pr_approve_date": (
                request.approve_date.isoformat() if request.approve_date else None
            ),
            "resale_cus_name": request.resale_cus_name or "",
            "po_num": request.po_num or "",
            "Approver": _full_name(row.approver_fname, row.approver_lname),
            "pr_priority": request.pr_priority,
            "pr_buyer": _full_name(row.buyer_fname, row.buyer_lname),
            "buyer_remark": "",
            "cc_user": _full_name(row.cc_fname, row.cc_lname) or request.cc2 or "",
        })

    return {
        "draw": draw,
        "recordsTotal": total_records,
        "recordsFiltered": total_records,
        "data": data,
    } 