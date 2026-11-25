import os
import random
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.schemas.users import OtpRequest, OtpVerifyRequest
from app.utils.email import send_otp_email
from app.core.security import create_access_token

router = APIRouter()

@router.post("/send-otp")
def send_otp(
    request: OtpRequest, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    # 1. Find the user
    user = db.query(models.Users).filter(models.Users.email == request.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User with this email not found")

    # 2. Generate a 6-digit OTP
    otp_code = str(random.randint(100000, 999999))

    # 3. Save it directly to the user's row
    user.otp = otp_code
    db.commit()

    # 4. Send email in the background ONLY if EMAIL_INTEGRATION is true
    if os.getenv("EMAIL_INTEGRATION", "false").lower() == "true":
        background_tasks.add_task(send_otp_email, email=request.email, otp_code=otp_code)
        print(f"DEBUG: Email integration is ON. Sent OTP to {request.email}")
    else:
        print(f"DEBUG: EMAIL_INTEGRATION is OFF. OTP for {request.email} is {otp_code}")

    return {"message": "OTP sent successfully to your email."}


@router.post("/verify-otp")
def verify_otp(
    otp_request: OtpVerifyRequest,
    http_request: Request,
    db: Session = Depends(get_db),
):
    # Find and lock the active user so an OTP cannot be consumed twice concurrently.
    user = db.query(models.Users).filter(
        models.Users.email == otp_request.email,
        models.Users.otp == otp_request.otp_code,
        models.Users.df == 0,
    ).with_for_update().first()

    if not user:
        raise HTTPException(status_code=400, detail="Invalid OTP code")

    try:
        user_role = int(user.user_role)
    except (TypeError, ValueError) as error:
        raise HTTPException(status_code=403, detail="Unauthorized role") from error

    logged_in_at = datetime.now(timezone.utc).replace(tzinfo=None)
    session_id = uuid4().hex

    db.query(models.UserLoginLogs).filter(
        models.UserLoginLogs.userId == user.id,
        models.UserLoginLogs.loggedOutAt.is_(None),
    ).update(
        {
            models.UserLoginLogs.loggedOutAt: logged_in_at,
            models.UserLoginLogs.autoLoggedOut: "Auto",
        },
        synchronize_session=False,
    )

    user.otp = None
    access_token = create_access_token(
        data={"sub": str(user.id), "jti": session_id}
    )
    db.add(
        models.UserLoginLogs(
            userId=user.id,
            name=" ".join(name for name in (user.fname, user.lname) if name),
            hin_id=user.hin_id,
            role=user_role,
            ip_address=http_request.client.host if http_request.client else None,
            email=user.email,
            loggedInAt=logged_in_at,
            session_id=session_id,
        )
    )
    db.commit()

    return {
        "message": "OTP verified successfully.",
        "access_token": access_token,
        "token_type": "bearer",
    }