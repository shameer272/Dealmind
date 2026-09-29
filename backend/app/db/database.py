import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from app.core.config import settings

# Normalize sqlite URL for async
db_url = settings.DATABASE_URL
if db_url.startswith("sqlite:///"):
    db_url = db_url.replace("sqlite:///", "sqlite+aiosqlite:///")
elif db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://")

connect_args = {"check_same_thread": False} if "sqlite" in db_url else {}

engine = create_async_engine(
    db_url,
    echo=False,
    connect_args=connect_args,
    future=True
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

        # Ensure SQLite migrations for new columns if tables already existed
        from sqlalchemy import text
        for col, col_type in [
            ("users.password_hash", "VARCHAR(255)"),
            ("users.organization_id", "VARCHAR(255)"),
            ("users.is_active", "INTEGER DEFAULT 1"),
            ("deals.organization_id", "VARCHAR(255)"),
            ("companies.organization_id", "VARCHAR(255)")
        ]:
            tbl, col_name = col.split(".")
            try:
                await conn.execute(text(f"ALTER TABLE {tbl} ADD COLUMN {col_name} {col_type};"))
            except Exception:
                pass  # column already exists or table freshly created
