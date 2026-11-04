from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class UserRegisterRequest(BaseModel):
    fname: str = Field(..., max_length=40)
    lname: str = Field(..., max_length=40)
    hin_id: str = Field(..., max_length=10)
    # Enforce @horiba.com email
    email: EmailStr = Field(..., pattern=r"^[a-zA-Z0-9._%+-]+@horiba\.com$")
    group_field_id: int
    user_role: int
    phone_no: str
    cm_segment_id: int
    loctn: str
    
    # Optional fields
    doj: Optional[str] = None
    cm_costcentr_id: Optional[int] = None
    level: Optional[int] = None
    user_role_dc: Optional[int] = None
    
class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    
class OtpRequest(BaseModel):
    email: EmailStr

class OtpVerifyRequest(BaseModel):
    email: EmailStr
    otp_code: str = Field(..., min_length=6, max_length=6)