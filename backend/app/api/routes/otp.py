import os
import random
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.schemas.users import OtpRequest, OtpVerifyRequest
from app.utils.email import send_otp_email

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
    request: OtpVerifyRequest,
    db: Session = Depends(get_db)
):
    # 1. Find the user with the matching email AND OTP code
    user = db.query(models.Users).filter(
        models.Users.email == request.email,
        models.Users.otp == request.otp_code
    ).first()

    if not user:
        raise HTTPException(status_code=400, detail="Invalid OTP code")

    # 2. Clear the OTP so it can't be reused
    user.otp = None
    
    # Optional: If your Laravel app uses 'email_verified_at', you can set it here
    # user.email_verified_at = datetime.now() 

    db.commit()

    return {"message": "OTP verified successfully. You can now reset your password."}