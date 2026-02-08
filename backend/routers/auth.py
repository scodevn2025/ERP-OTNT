from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from typing import Literal, Optional
from pydantic import BaseModel, EmailStr, ConfigDict
import jwt
from datetime import datetime, timedelta, timezone
import bcrypt
import os

from database import get_session
from sql_models import User
from dependencies import get_current_user, JWT_SECRET, JWT_ALGORITHM

router = APIRouter()

JWT_EXPIRATION_HOURS = 24

# ==================== DTOs ====================

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: Optional[str] = None
    role: Literal['admin', 'manager', 'staff', 'technician'] = 'staff'

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    full_name: str
    phone: Optional[str] = None
    role: str
    branch_id: Optional[str] = None
    is_active: bool = True
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# ==================== HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str, role: str) -> str:
    payload = {
        'sub': user_id,
        'email': email,
        'role': role,
        'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

# ==================== ROUTES ====================

@router.post("/auth/register", response_model=TokenResponse)
async def register(data: UserCreate, session: AsyncSession = Depends(get_session)):
    statement = select(User).where(User.email == data.email)
    existing = (await session.exec(statement)).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        full_name=data.full_name,
        phone=data.phone,
        role=data.role
    )
    session.add(new_user)
    await session.commit()
    await session.refresh(new_user)
    
    token = create_token(new_user.id, new_user.email, new_user.role)
    return TokenResponse(access_token=token, user=UserResponse(**new_user.model_dump()))

@router.post("/auth/login", response_model=TokenResponse)
async def login(data: UserLogin, session: AsyncSession = Depends(get_session)):
    statement = select(User).where(User.email == data.email)
    user = (await session.exec(statement)).first()
    
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user.is_active:
        raise HTTPException(status_code=401, detail="Account is disabled")
    
    token = create_token(user.id, user.email, user.role)
    return TokenResponse(access_token=token, user=UserResponse(**user.model_dump()))

@router.get("/auth/me", response_model=UserResponse)
async def get_profile(user: User = Depends(get_current_user)):
    return UserResponse(**user.model_dump())
