import typing

# Python 3.14 Compatibility Monkeypatch
if not hasattr(typing, "_orig_eval_type"):
    typing._orig_eval_type = typing._eval_type

def _eval_type_patched(t, globalns=None, localns=None, type_params=None, **kwargs):
    kwargs.pop("prefer_fwd_module", None)
    return typing._orig_eval_type(t, globalns, localns, type_params, **kwargs)

typing._eval_type = _eval_type_patched

import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from dotenv import load_dotenv

load_dotenv()

async def verify():
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        print("DATABASE_URL not found")
        return
        
    if db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://")
        
    print(f"Connecting to: {db_url.split('@')[1]}")
    engine = create_async_engine(db_url)
    
    async with engine.connect() as conn:
        # Check current user and schema
        res = await conn.execute(text("SELECT current_user, current_schema()"))
        user, schema = res.fetchone()
        print(f"User: {user}, Current Schema: {schema}")
        
        # Check CREATE privilege on all schemas
        print("\n--- Schema Privileges ---")
        res = await conn.execute(text("SELECT nspname, has_schema_privilege(current_user, nspname, 'CREATE') FROM pg_namespace"))
        for row in res.fetchall():
            print(f"Schema: {row[0]}, Can Create: {row[1]}")
            
        # Try to create a dummy table to be 100% sure
        print("\n--- Testing table creation in 'public' ---")
        try:
            await conn.execute(text("CREATE TABLE IF NOT EXISTS test_permissions (id serial PRIMARY KEY)"))
            print("SUCCESS: Created table 'test_permissions'")
            await conn.execute(text("DROP TABLE test_permissions"))
            print("SUCCESS: Dropped table 'test_permissions'")
        except Exception as e:
            print(f"FAILED: {e}")

if __name__ == "__main__":
    asyncio.run(verify())
