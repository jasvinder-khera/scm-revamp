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
