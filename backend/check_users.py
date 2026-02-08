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

# Import models
from sql_models import User

# Load Env
load_dotenv()
DATABASE_URL = os.environ.get("DATABASE_URL")
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")

engine = create_async_engine(DATABASE_URL)

async def check_users():
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        stmt = select(User)
        result = await session.exec(stmt)
        users = result.all()
        
        print(f"Total users found: {len(users)}")
        for user in users:
            print(f"ID: {user.id} | Email: {user.email} | Role: {user.role} | Active: {user.is_active}")

if __name__ == "__main__":
    import typing
    if not hasattr(typing, "_orig_eval_type"):
        typing._orig_eval_type = typing._eval_type
    def _eval_type_patched(*args, **kwargs):
        kwargs.pop("prefer_fwd_module", None)
        return typing._orig_eval_type(*args, **kwargs)
    typing._eval_type = _eval_type_patched

    asyncio.run(check_users())
