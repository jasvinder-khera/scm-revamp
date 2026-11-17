from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, case, and_, literal_column
from datetime import datetime
from typing import Optional

from app.database import get_db
from app import models
from app.api.deps import get_current_user
from app.schemas.dashboard import DashboardRequest

router = APIRouter()

def get_dates(startdate: str, enddate: str):
    # Helper to convert string to date (similar to strtotime)
    try:
        start = datetime.strptime(startdate, "%Y-%m-%d").date()
        end = datetime.strptime(enddate, "%Y-%m-%d").date()
        return start, end
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

def get_user_role(current_user: models.Users) -> Optional[int]:
    try:
        return int(current_user.user_role)
    except (TypeError, ValueError):
        if current_user.department_head == 1:
            return None
        raise HTTPException(status_code=403, detail="Unauthorized role")

# ==========================================
# 1. DASHBOARD INDEX (Counters)
# ==========================================
@router.get("/dashboard")
def get_dashboard(
    startdate: str, 
    enddate: str, 
    current_user: models.Users = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    start, end = get_dates(startdate, enddate)
    user_role = get_user_role(current_user)
    
    # Base query for PR Headers
    query = db.query(models.PurReqHdrNew).filter(
        models.PurReqHdrNew.df == 0,
        models.PurReqHdrNew.pr_date.between(start, end)
    )

    # Role-based filtering
    if current_user.department_head == 1 or user_role == 3:
        pass # No extra filter
    elif user_role == 0:
        query = query.filter(models.PurReqHdrNew.created_by == current_user.id)
    elif user_role == 2:
        query = query.filter(models.PurReqHdrNew.pr_buyer == current_user.id)
    elif user_role == 1:
        query = query.filter(models.PurReqHdrNew.pr_approver_id == current_user.id)
    else:
        raise HTTPException(status_code=403, detail="Unauthorized role")

    # 1. Aggregate Counts (totalPr, openPr, pendingPr, rejected, closedPr)
    stats = query.with_entities(
        func.count(models.PurReqHdrNew.pur_req_hdr_id).label("totalPr"),
        func.sum(case(
            (and_(models.PurReqHdrNew.approval_status_id != 2, models.PurReqHdrNew.pr_status_id.in_([1,3,4,5,6])), 1),
            else_=0
        )).label("openPr"),
        func.sum(case((models.PurReqHdrNew.approval_status_id == 2, 1), else_=0)).label("pendingPr"),
        func.sum(case((models.PurReqHdrNew.pr_status_id == 2, 1), else_=0)).label("rejected"),
        func.sum(case((models.PurReqHdrNew.pr_status_id == 7, 1), else_=0)).label("closedPr")
    ).first()

    # 2. Total PO Released (Complex Join & Having)
    # SQLAlchemy equivalent of the DB::table(...)->havingRaw(...)
    subquery = db.query(
        models.PurReqHdrNew.pur_req_hdr_id
    ).join(
        models.PurReqLine, 
        models.PurReqLine.pur_req_hdr_id == models.PurReqHdrNew.pur_req_hdr_id
    ).filter(
        models.PurReqHdrNew.df == 0,
        models.PurReqLine.df == 0,
        models.PurReqHdrNew.pr_date.between(start, end)
    )
    
    # Apply role filters to subquery
    if user_role == 0:
        subquery = subquery.filter(models.PurReqHdrNew.created_by == current_user.id)
    elif user_role == 2:
        subquery = subquery.filter(models.PurReqHdrNew.pr_buyer == current_user.id)
    elif user_role == 1:
        subquery = subquery.filter(models.PurReqHdrNew.pr_approver_id == current_user.id)

    subquery = subquery.group_by(
        models.PurReqHdrNew.pur_req_hdr_id
    ).having(
        func.count(models.PurReqLine.pur_req_hdr_id) == func.sum(
            case((models.PurReqLine.po_action == "PO Released", 1), else_=0)
        )
    )
    
    total_po_released = subquery.count()

    # Build response
    open_pr = max(0, (stats.openPr or 0) - total_po_released)
    
    return {
        "status": True,
        "message": "dashboard data",
        "data": {
            "totalPr": stats.totalPr or 0,
            "openPr": open_pr,
            "pendingPr": stats.pendingPr or 0,
            "rejected": stats.rejected or 0,
            "closedPr": stats.closedPr or 0,
            "totalPoReleased": total_po_released
        }
    }

# ==========================================
# 2. BAR GRAPH
# ==========================================
@router.get("/dashboard/bar-graph")
def get_bar_graph(
    startdate: str, 
    enddate: str, 
    current_user: models.Users = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    start, end = get_dates(startdate, enddate)
    user_role = get_user_role(current_user)
    
    query = db.query(
        models.PurReqHdrNew.pr_buyer,
        func.concat(models.Users.fname, " ", models.Users.lname).label("buyer_name"),
        func.count(models.PurReqHdrNew.pur_req_hdr_id).label("total")
    ).join(
        models.Users, models.Users.id == models.PurReqHdrNew.pr_buyer
    ).filter(
        models.PurReqHdrNew.df == 0,
        models.PurReqHdrNew.pr_date.between(start, end)
    )

    if current_user.department_head == 1:
        pass
    elif user_role == 0:
        query = query.filter(models.PurReqHdrNew.created_by == current_user.id)
    elif user_role == 1:
        query = query.filter(
            models.PurReqHdrNew.pr_buyer != 500,
            models.PurReqHdrNew.pr_approver_id == current_user.id
        )
    else:
        query = query.filter(models.PurReqHdrNew.pr_buyer != 500)

    results = query.group_by(
        models.PurReqHdrNew.pr_buyer, models.Users.fname, models.Users.lname
    ).all()

    labels = [r.buyer_name for r in results]
    counts = [r.total for r in results]

    return {
        "status": True,
        "message": "PR month-wise analytics",
        "data": {"months": labels, "counts": counts}
    }

# ==========================================
# 3. SEGMENT GRAPH
# ==========================================
@router.get("/dashboard/segment-graph")
def get_segment_graph(
    startdate: str, 
    enddate: str, 
    current_user: models.Users = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    start, end = get_dates(startdate, enddate)
    user_role = get_user_role(current_user)

    query = db.query(
        models.SubGroupField.descptn.label("label"),
        func.count(models.PurReqHdrNew.pur_req_hdr_id).label("total")
    ).outerjoin(
        models.SubGroupField, models.SubGroupField.sub_group_field_id == models.PurReqHdrNew.sub_group_field_id
    ).filter(
        models.PurReqHdrNew.df == 0,
        models.PurReqHdrNew.pr_date.between(start, end)
    )

    if current_user.department_head == 1:
        pass
    elif user_role == 0:
        query = query.filter(models.PurReqHdrNew.created_by == current_user.id)
    elif user_role == 2:
        query = query.filter(models.PurReqHdrNew.pr_buyer == current_user.id)
    elif user_role == 1:
        query = query.filter(models.PurReqHdrNew.pr_approver_id == current_user.id)

    results = query.group_by(models.SubGroupField.descptn).order_by(func.count(models.PurReqHdrNew.pur_req_hdr_id).desc()).all()

    labels = [r.label or "Others" for r in results]
    counts = [r.total for r in results]

    return {
        "status": True,
        "message": "PR month-wise analytics",
        "data": {"labels": labels, "counts": counts}
    }

# ==========================================
# 4. FUNCTION GRAPH
# ==========================================
@router.get("/dashboard/function-graph")
def get_function_graph(
    startdate: str, 
    enddate: str, 
    current_user: models.Users = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    start, end = get_dates(startdate, enddate)
    user_role = get_user_role(current_user)

    query = db.query(
        models.Func.descptn.label("label"),
        func.count(models.PurReqHdrNew.pur_req_hdr_id).label("total")
    ).outerjoin(
        models.Func, models.Func.function_id == models.PurReqHdrNew.functn
    ).filter(
        models.PurReqHdrNew.df == 0,
        models.PurReqHdrNew.pr_date.between(start, end)
    )

    if current_user.department_head == 1:
        pass
    elif user_role == 0:
        query = query.filter(models.PurReqHdrNew.created_by == current_user.id)
    elif user_role == 2:
        query = query.filter(models.PurReqHdrNew.pr_buyer == current_user.id)
    elif user_role == 1:
        query = query.filter(models.PurReqHdrNew.pr_approver_id == current_user.id)

    results = query.group_by(models.Func.descptn).order_by(func.count(models.PurReqHdrNew.pur_req_hdr_id).desc()).all()

    labels = [r.label or "Others" for r in results]
    counts = [r.total for r in results]

    return {
        "status": True,
        "message": "PR month-wise analytics",
        "data": {"labels": labels, "counts": counts}
    }

# ==========================================
# 5. LINE GRAPH
# ==========================================
@router.get("/dashboard/line-graph")
def get_line_graph(
    startdate: str, 
    enddate: str, 
    current_user: models.Users = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    start, end = get_dates(startdate, enddate)
    user_role = get_user_role(current_user)

    query = db.query(
        func.date(models.PurReqHdrNew.pr_date).label("pr_date"),
        func.count(models.PurReqHdrNew.pur_req_hdr_id).label("total")
    ).filter(
        models.PurReqHdrNew.df == 0,
        models.PurReqHdrNew.pr_date.between(start, end)
    )

    if current_user.department_head == 1 or user_role == 3:
        pass
    elif user_role == 0:
        query = query.filter(models.PurReqHdrNew.created_by == current_user.id)
    elif user_role == 2:
        query = query.filter(models.PurReqHdrNew.pr_buyer == current_user.id)
    elif user_role == 1:
        query = query.filter(models.PurReqHdrNew.pr_approver_id == current_user.id)
    else:
        raise HTTPException(status_code=403, detail="Unauthorized role")

    results = query.group_by(func.date(models.PurReqHdrNew.pr_date)).order_by(func.date(models.PurReqHdrNew.pr_date).asc()).all()

    dates = [r.pr_date.strftime("%d-%m-%Y") for r in results]
    pr_requests = [r.total for r in results]

    return {
        "status": True,
        "message": "PR date-wise analytics",
        "data": {"dates": dates, "prRequests": pr_requests}
    }

# ==========================================
# 6. LATEST PR
# ==========================================
@router.get("/dashboard/latest-pr")
def get_latest_pr(
    current_user: models.Users = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    user_role = get_user_role(current_user)
    query = db.query(
        models.PurReqHdrNew,
        models.CmPrStatus.pr_stat_descrip.label("prStatusName"),
        func.concat(models.Users.fname, " ", models.Users.lname).label("creator_name")
    ).join(
        models.Users, models.Users.id == models.PurReqHdrNew.pr_approver_id
    ).join(
        models.CmPrStatus, models.CmPrStatus.pr_status_id == models.PurReqHdrNew.pr_status_id
    ).filter(models.PurReqHdrNew.df == 0)

    if current_user.department_head == 1:
        pass
    elif user_role == 0:
        query = query.filter(models.PurReqHdrNew.created_by == current_user.id)
    elif user_role == 2:
        query = query.filter(models.PurReqHdrNew.pr_buyer == current_user.id)
    elif user_role == 1:
        query = query.filter(models.PurReqHdrNew.pr_approver_id == current_user.id)

    results = query.order_by(models.PurReqHdrNew.pur_req_hdr_id.desc()).limit(10).all()

    # Serialize data (SQLAlchemy models to dict)
    data = []
    for r in results:
        pr_dict = {c.name: getattr(r.PurReqHdrNew, c.name) for c in r.PurReqHdrNew.__table__.columns}
        pr_dict["prStatusName"] = r.prStatusName
        pr_dict["creator_name"] = r.creator_name
        data.append(pr_dict)

    return {
        "status": True,
        "message": "latest 10 records",
        "data": data
    }