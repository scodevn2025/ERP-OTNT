import typing

# Python 3.14 Compatibility Monkeypatch
if not hasattr(typing, "_orig_eval_type"):
    typing._orig_eval_type = typing._eval_type

def _eval_type_patched(t, globalns=None, localns=None, type_params=None, **kwargs):
    kwargs.pop("prefer_fwd_module", None)
    return typing._orig_eval_type(t, globalns, localns, type_params, **kwargs)

typing._eval_type = _eval_type_patched

import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL")
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")

async def inspect():
    engine = create_async_engine(DATABASE_URL)
    async with engine.connect() as conn:
        print(f"Connected to: {DATABASE_URL.split('@')[1]}")
        
        # 1. Check Current User and Schema
        user_res = await conn.execute(text("SELECT current_user, current_schema()"))
        user_info = user_res.fetchone()
        print(f"Current User: {user_info[0]}")
        print(f"Current Schema: {user_info[1]}")

        # 2. List All Schemas
        print("\n--- Available Schemas ---")
        schemas_res = await conn.execute(text("SELECT schema_name FROM information_schema.schemata"))
        schemas = [r[0] for r in schemas_res.fetchall()]
        print(schemas)

        # 3. Check for existing tables in all schemas
        print("\n--- Existing Tables ---")
        tables_res = await conn.execute(text("SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema NOT IN ('information_schema', 'pg_catalog')"))
        tables = tables_res.fetchall()
        if not tables:
            print("No tables found in user schemas.")
        else:
            for t in tables:
                print(f"{t[0]}.{t[1]}")

        # 4. Try Create Table Permission
        print("\n--- Permission Check: CREATE TABLE in 'public' ---")
        try:
            await conn.execute(text("CREATE TABLE IF NOT EXISTS permission_check (id serial PRIMARY KEY)"))
            print("SUCCESS: Permissions OK. Table 'permission_check' created.")
            await conn.execute(text("DROP TABLE permission_check"))
            print("SUCCESS: Table dropped.")
        except Exception as e:
            print(f"FAILED: {e}")

if __name__ == "__main__":
    asyncio.run(inspect())
