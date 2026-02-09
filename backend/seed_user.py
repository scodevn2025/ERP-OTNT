import typing

# Python 3.14 Compatibility Monkeypatch
if not hasattr(typing, "_orig_eval_type"):
    typing._orig_eval_type = typing._eval_type

def _eval_type_patched(t, globalns=None, localns=None, type_params=None, **kwargs):
    kwargs.pop("prefer_fwd_module", None)
    return typing._orig_eval_type(t, globalns, localns, type_params, **kwargs)

typing._eval_type = _eval_type_patched

import asyncio
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel import select
import os
from dotenv import load_dotenv
import bcrypt

# Import models
from sql_models import User

# Load Env
load_dotenv()
# Force override for debug if needed, but let's see what it gets
DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    print("ERROR: DATABASE_URL not found in environment!")
    exit(1)

if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")

print(f"DEBUG: Using DATABASE_URL={DATABASE_URL}")
engine = create_async_engine(DATABASE_URL)

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

async def seed_admin():
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        # Check if admin exists
        stmt = select(User).where(User.email == "admin@otnt.vn")
        existing = (await session.exec(stmt)).first()
        
        if existing:
            print("Admin user already exists.")
            return

        print("Creating Admin user...")
        admin = User(
            email="admin@otnt.vn",
            hashed_password=hash_password("Admin@123"), # Default Password
            full_name="Administrator",
            role="admin",
            phone="0909000000"
        )
        session.add(admin)
        await session.commit()
        print("Admin user created successfully!")
        print("Email: admin@otnt.vn")
        print("Password: Admin@123")

if __name__ == "__main__":
    asyncio.run(seed_admin())
