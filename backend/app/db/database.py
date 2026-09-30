from urllib.parse import urlsplit, urlunsplit, parse_qsl, urlencode
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from app.core.config import settings


def normalize_database_url(raw_url: str) -> tuple[str, dict]:
    """
    Normalizes database connection URL and returns (normalized_url, connect_args).
    - Preserves SQLite support for local development.
    - Robustly handles PostgreSQL (including Neon) for production:
      * Converts postgresql:// or postgres:// to postgresql+asyncpg://
      * Removes unsupported asyncpg query parameters: channel_binding and sslmode
      * Preserves SSL connectivity by passing ssl='require' via connect_args
    """
    url = (raw_url or "").strip()
    connect_args = {}

    if url.startswith("sqlite:///"):
        url = url.replace("sqlite:///", "sqlite+aiosqlite:///", 1)

    if "sqlite" in url:
        connect_args["check_same_thread"] = False
        return url, connect_args

    is_postgres = (
        url.startswith("postgres://")
        or url.startswith("postgresql://")
        or url.startswith("postgresql+")
    )

    if is_postgres:
        if url.startswith("postgres://"):
            url = "postgresql+asyncpg://" + url[len("postgres://"):]
        elif url.startswith("postgresql://"):
            url = "postgresql+asyncpg://" + url[len("postgresql://"):]

        parsed = urlsplit(url)
        query_params = parse_qsl(parsed.query, keep_blank_values=True)

        filtered_query = []
        enable_ssl = False

        for k, v in query_params:
            k_lower = k.lower()
            if k_lower == "channel_binding":
                # asyncpg does not accept channel_binding
                continue
            elif k_lower == "sslmode":
                # asyncpg does not accept sslmode as a connect kwarg;
                # map require/verify/prefer semantics to asyncpg ssl='require'
                if v.lower() not in ("disable", "false", "0", "no"):
                    enable_ssl = True
                continue
            elif k_lower == "ssl":
                if v.lower() in ("require", "prefer", "allow", "verify-ca", "verify-full", "true", "1"):
                    enable_ssl = True
                elif v.lower() in ("disable", "false", "0", "no"):
                    enable_ssl = False
                continue
            else:
                filtered_query.append((k, v))

        hostname = (parsed.hostname or "").lower()
        if "neon.tech" in hostname:
            enable_ssl = True

        if enable_ssl:
            connect_args["ssl"] = "require"

        new_query = urlencode(filtered_query)
        url = urlunsplit((
            parsed.scheme,
            parsed.netloc,
            parsed.path,
            new_query,
            parsed.fragment
        ))

    return url, connect_args


db_url, connect_args = normalize_database_url(settings.DATABASE_URL)

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

        # Ensure migrations for new columns if tables already existed
        from sqlalchemy import text
        is_pg = engine.dialect.name == "postgresql"
        for col, col_type in [
            ("users.password_hash", "VARCHAR(255)"),
            ("users.organization_id", "VARCHAR(255)"),
            ("users.is_active", "INTEGER DEFAULT 1"),
            ("deals.organization_id", "VARCHAR(255)"),
            ("companies.organization_id", "VARCHAR(255)")
        ]:
            tbl, col_name = col.split(".")
            try:
                if is_pg:
                    await conn.execute(text(f"ALTER TABLE {tbl} ADD COLUMN IF NOT EXISTS {col_name} {col_type};"))
                else:
                    await conn.execute(text(f"ALTER TABLE {tbl} ADD COLUMN {col_name} {col_type};"))
            except Exception:
                pass  # column already exists or table freshly created
