import secrets
import string
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from app.database import get_db
from app import models
from app.schemas.users import UserRegisterRequest
from app.core.security import create_access_token
from app.schemas.users import UserLoginRequest, TokenResponse
from app.api.deps import get_current_user
# from app.utils.email import send_welcome_email  # We will create this next

router = APIRouter()

# Laravel 7 uses $2y$ bcrypt hashes
pwd_context = CryptContext(schemes=["bcrypt"], bcrypt__ident="2y", deprecated="auto")

def get_random_password(length=10):
    # Excluding ambiguous characters (I, l, O, 0, 1) like your Laravel code
    alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
    return ''.join(secrets.choice(alphabet) for _ in range(length))

@router.post("/register")
def register_user(
    user_in: UserRegisterRequest, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    # 1. Handle 'unique' validation (Laravel's unique:users)
    if db.query(models.Users).filter(models.Users.email == user_in.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    if db.query(models.Users).filter(models.Users.hin_id == user_in.hin_id).first():
        raise HTTPException(status_code=400, detail="HIN ID already registered")

    try:
        # 2. Generate random password
        temp_password = get_random_password()
        
        # 3. Hash password
        hashed_password = pwd_context.hash(temp_password)

        # 4. Create the user in DB
        new_user = models.Users(
            fname=user_in.fname,
            lname=user_in.lname,
            hin_id=user_in.hin_id,
            email=user_in.email,
            group_field_id=user_in.group_field_id,
            user_role=user_in.user_role,
            df=0, # From your Laravel code
            password=hashed_password,
            phone_no=user_in.phone_no,
            doj=user_in.doj,
            cm_segment_id=user_in.cm_segment_id,
            cm_costcentr_id=user_in.cm_costcentr_id,
            level=user_in.level,
            loctn=user_in.loctn,
            user_role_dc=user_in.user_role_dc,
            created_by=1, # TODO: Replace with `current_user.id` when we set up JWT auth
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        # 5. Send email in the background (so it doesn't block the API response)
        # background_tasks.add_task(send_welcome_email, email=user_in.email, temp_password=temp_password, name=user_in.fname)

        return {"message": "User Registered Successfully."}

    except Exception as e:
        db.rollback() # Undo the transaction if anything fails
        print(f"Registration Error: {e}") # Replace with a proper logger later
        raise HTTPException(status_code=500, detail="Registration failed. Please try again.")
    
@router.post("/login", response_model=TokenResponse)
def login(user_in: UserLoginRequest, db: Session = Depends(get_db)):
    # 1. Find user by email
    user = db.query(models.Users).filter(models.Users.email == user_in.email).first()
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password"
        )
    
    # Existing records may store Laravel's bcrypt hash in either column.
    password_hashes = (user.password, user.pass_)
    password_matches = any(
        stored_hash
        and pwd_context.identify(stored_hash) == "bcrypt"
        and pwd_context.verify(user_in.password, stored_hash)
        for stored_hash in password_hashes
    )
    if not password_matches:
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password"
        )
    
    # 3. Generate JWT Token (using user ID as the subject)
    access_token = create_access_token(data={"sub": str(user.id)})
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me")
def get_my_profile(current_user: models.Users = Depends(get_current_user)):
    # This returns the logged-in user's data
    return {
        "id": current_user.id, 
        "email": current_user.email, 
        "fname":current_user.fname,
        "lname": current_user.lname,
        "group_field": current_user.group_field_id,
        "user_role": current_user.user_role,          # <-- ADD THIS
        "department_head": current_user.department_head # <-- ADD THIS
    }