import os
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from pydantic import EmailStr

conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME", "dummy@example.com"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD", "dummy_password"),
    MAIL_FROM=os.getenv("MAIL_FROM", "dummy@example.com"),
    MAIL_PORT=int(os.getenv("MAIL_PORT", 587)),
    MAIL_SERVER=os.getenv("MAIL_SERVER", "smtp.example.com"),
    MAIL_FROM_NAME=os.getenv("MAIL_FROM_NAME", "Horiba Care"),
    MAIL_STARTTLS=os.getenv("MAIL_STARTTLS", "True").lower() == "true",
    MAIL_SSL_TLS=os.getenv("MAIL_SSL_TLS", "False").lower() == "true",
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)

async def send_welcome_email(email: EmailStr, temp_password: str, fname: str, lname: str):
    html = f"""
    <h1>Welcome to Horiba Care, {fname} {lname}!</h1>
    <p>Your account has been created.</p>
    <p>Here is your temporary password: <strong>{temp_password}</strong></p>
    <p>Please log in and change your password immediately.</p>
    """
    
    message = MessageSchema(
        subject="Welcome to Horiba Care",
        recipients=[email],
        body=html,
        subtype=MessageType.html
    )
    
    fm = FastMail(conf)
    await fm.send_message(message)


async def send_otp_email(email: EmailStr, otp_code: str):
    html = f"""
    <h2>Your Verification Code</h2>
    <p>Your OTP code is: <strong style="font-size: 24px;">{otp_code}</strong></p>
    <p>This code will expire in 10 minutes.</p>
    <p>If you didn't request this, please ignore this email.</p>
    """
    
    message = MessageSchema(
        subject="Your OTP Code - Horiba Care",
        recipients=[email],
        body=html,
        subtype=MessageType.html
    )
    
    fm = FastMail(conf)
    await fm.send_message(message)