import pytest
from unittest.mock import patch, MagicMock
from sqlalchemy.ext.asyncio import create_async_engine
from app.db.database import normalize_database_url


def test_sqlite_url_normalization():
    # standard sqlite:///
    url, cargs = normalize_database_url("sqlite:///./dealmind.db")
    assert url == "sqlite+aiosqlite:///./dealmind.db"
    assert cargs == {"check_same_thread": False}

    # already sqlite+aiosqlite:///
    url2, cargs2 = normalize_database_url("sqlite+aiosqlite:///./dealmind.db")
    assert url2 == "sqlite+aiosqlite:///./dealmind.db"
    assert cargs2 == {"check_same_thread": False}


def test_neon_postgresql_url_normalization():
    # Neon URL with channel_binding=require & sslmode=require
    raw = (
        "postgresql://neondb_owner:secretpass@"
        "ep-example-pooler.us-east-2.aws.neon.tech/neondb"
        "?sslmode=require&channel_binding=require"
    )
    url, cargs = normalize_database_url(raw)

    assert url.startswith("postgresql+asyncpg://")
    assert "channel_binding" not in url
    assert "sslmode" not in url
    assert cargs == {"ssl": "require"}


def test_postgres_scheme_and_custom_params():
    # postgres:// scheme and additional query parameters
    raw = (
        "postgres://user:pass@ep-test.neon.tech/mydb"
        "?channel_binding=require&sslmode=require&target_session_attrs=read-write"
    )
    url, cargs = normalize_database_url(raw)

    assert url.startswith("postgresql+asyncpg://")
    assert "channel_binding" not in url
    assert "sslmode" not in url
    assert "target_session_attrs=read-write" in url
    assert cargs == {"ssl": "require"}


def test_local_docker_postgresql():
    # Local postgres without sslmode
    raw = "postgresql+asyncpg://postgres:postgrespassword@localhost:5432/dealmind"
    url, cargs = normalize_database_url(raw)

    assert url == "postgresql+asyncpg://postgres:postgrespassword@localhost:5432/dealmind"
    assert cargs == {}


@pytest.mark.asyncio
async def test_asyncpg_connection_parameters():
    # Verify that asyncpg.connect receives ssl='require' and neither channel_binding nor sslmode
    raw = (
        "postgresql://user:pass@ep-cool.us-east-2.aws.neon.tech/neondb"
        "?sslmode=require&channel_binding=require"
    )
    clean_url, connect_args = normalize_database_url(raw)
    test_engine = create_async_engine(clean_url, connect_args=connect_args)

    with patch("asyncpg.connect") as mock_connect:
        try:
            async with test_engine.connect():
                pass
        except Exception:
            pass

        assert mock_connect.called
        call_kwargs = mock_connect.call_args.kwargs
        assert "channel_binding" not in call_kwargs
        assert "sslmode" not in call_kwargs
        assert call_kwargs.get("ssl") == "require"
        assert call_kwargs.get("host") == "ep-cool.us-east-2.aws.neon.tech"
        assert call_kwargs.get("database") == "neondb"

    await test_engine.dispose()
