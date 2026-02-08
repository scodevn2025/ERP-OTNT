from sqlmodel import SQLModel, create_engine
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Parse DB URL from env or use the one provided by user
# User provided: postgresql://otnt_user:11012019%40Scode@91.99.161.14:5432/erpotnt2026?schema=public
# We need to convert it to asyncpg format: postgresql+asyncpg://...
DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://otnt_user:11012019%40Scode@91.99.161.14:5432/erpotnt2026?schema=public")

if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")

print(f"DEBUG: DATABASE_URL={DATABASE_URL}")
try:
    engine = create_async_engine(DATABASE_URL, echo=True, future=True)
except Exception as e:
    print(f"ERROR creating engine: {e}")
    raise


async def get_session() -> AsyncSession:
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    async with async_session() as session:
        yield session

async def init_db():
    async with engine.begin() as conn:
        # await conn.run_sync(SQLModel.metadata.drop_all) # WARNING: DEV ONLY
        await conn.run_sync(SQLModel.metadata.create_all)

    # Run migrations for columns added after initial table creation
    from sqlalchemy import text
    migrations = [
        ("account", "balance", "ALTER TABLE account ADD COLUMN balance FLOAT DEFAULT 0"),
        ("customer", "total_orders", "ALTER TABLE customer ADD COLUMN total_orders INTEGER DEFAULT 0"),
        ("customer", "total_spent", "ALTER TABLE customer ADD COLUMN total_spent FLOAT DEFAULT 0"),
        ("salesorder", "total_items", "ALTER TABLE salesorder ADD COLUMN total_items INTEGER DEFAULT 0"),
        ("inventorydoc", "total_value", "ALTER TABLE inventorydoc ADD COLUMN total_value FLOAT DEFAULT 0"),
    ]
    async with engine.begin() as conn:
        for table, column, sql in migrations:
            try:
                result = await conn.execute(
                    text(f"SELECT column_name FROM information_schema.columns WHERE table_name='{table}' AND column_name='{column}'")
                )
                if not result.first():
                    await conn.execute(text(sql))
                    print(f"MIGRATION: Added {table}.{column}")
            except Exception as e:
                print(f"MIGRATION WARNING: {table}.{column} - {e}")
