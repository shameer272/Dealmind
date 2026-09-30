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


@pytest.mark.asyncio
async def test_create_and_update_deal_timezone_aware_expected_close_date():
    import uuid
    from httpx import AsyncClient, ASGITransport
    from sqlalchemy import select
    from app.main import app
    from app.db.database import AsyncSessionLocal, init_db
    from app.models.models import Deal

    await init_db()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Register user & company
        unique_email = f"tz_test_{uuid.uuid4().hex[:8]}@example.com"
        reg_res = await client.post("/api/auth/register", json={
            "name": "TZ Tester",
            "email": unique_email,
            "password": "Password123!",
            "confirm_password": "Password123!",
            "company_name": f"TZ Corp {uuid.uuid4().hex[:6]}",
            "role": "sales_rep"
        })
        assert reg_res.status_code == 201

        login_res = await client.post("/api/auth/login", json={
            "email": unique_email,
            "password": "Password123!"
        })
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Create deal with timezone-aware expected_close_date (UTC +05:30)
        aware_dt_str = "2026-10-30T15:30:00+05:30"
        deal_res = await client.post("/api/deals", json={
            "name": "Timezone Aware Deal",
            "value": 50000.0,
            "stage": "Discovery",
            "expected_close_date": aware_dt_str
        }, headers=headers)

        assert deal_res.status_code == 200
        deal_data = deal_res.json()
        deal_id = deal_data["id"]

        # Verify in database that expected_close_date is stored as offset-naive
        async with AsyncSessionLocal() as session:
            db_deal = (await session.execute(select(Deal).where(Deal.id == deal_id))).scalars().first()
            assert db_deal is not None
            assert db_deal.expected_close_date is not None
            assert db_deal.expected_close_date.tzinfo is None
            # 15:30 in +05:30 is 10:00 UTC
            assert db_deal.expected_close_date.hour == 10
            assert db_deal.expected_close_date.minute == 0

        # Update deal with another timezone-aware date (UTC +00:00)
        update_aware_dt_str = "2026-11-15T08:00:00Z"
        update_res = await client.put(f"/api/deals/{deal_id}", json={
            "expected_close_date": update_aware_dt_str
        }, headers=headers)
        assert update_res.status_code == 200

        # Verify updated date in database is offset-naive
        async with AsyncSessionLocal() as session:
            db_deal_updated = (await session.execute(select(Deal).where(Deal.id == deal_id))).scalars().first()
            assert db_deal_updated.expected_close_date.tzinfo is None
            assert db_deal_updated.expected_close_date.hour == 8
            assert db_deal_updated.expected_close_date.day == 15
