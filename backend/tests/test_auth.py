import pytest
import pytest_asyncio
import uuid
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.db.database import AsyncSessionLocal, init_db
from app.models.models import Organization, User, Company, Deal
from app.core.security import hash_password, verify_password

@pytest_asyncio.fixture(autouse=True)
async def prepare_db():
    await init_db()

@pytest.mark.asyncio
async def test_password_hashing():
    pwd = "SecurePassword@123"
    hashed = hash_password(pwd)
    assert hashed != pwd
    assert verify_password(pwd, hashed) is True
    assert verify_password("WrongPassword", hashed) is False

@pytest.mark.asyncio
async def test_user_registration_and_login_flow():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        unique_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        company_name = f"Test Corp {uuid.uuid4().hex[:6]}"

        # 1. Password mismatch validation
        bad_reg = await client.post("/api/auth/register", json={
            "name": "Jane Doe",
            "email": unique_email,
            "password": "Password123",
            "confirm_password": "MismatchPassword",
            "company_name": company_name,
            "role": "sales_rep"
        })
        assert bad_reg.status_code == 400
        assert "Passwords do not match" in bad_reg.json()["detail"]

        # 2. Short password validation
        short_reg = await client.post("/api/auth/register", json={
            "name": "Jane Doe",
            "email": unique_email,
            "password": "123",
            "confirm_password": "123",
            "company_name": company_name,
            "role": "sales_rep"
        })
        assert short_reg.status_code == 400

        # 3. Successful real registration
        reg_res = await client.post("/api/auth/register", json={
            "name": "Jane Doe",
            "email": unique_email,
            "password": "Password123!",
            "confirm_password": "Password123!",
            "company_name": company_name,
            "role": "sales_rep"
        })
        assert reg_res.status_code == 201
        data = reg_res.json()
        assert data["user"]["email"] == unique_email
        assert data["user"]["organization_name"] == company_name

        # 4. Duplicate email rejection
        dup_res = await client.post("/api/auth/register", json={
            "name": "Jane Doe Duplicate",
            "email": unique_email,
            "password": "Password123!",
            "confirm_password": "Password123!",
            "company_name": company_name,
            "role": "sales_rep"
        })
        assert dup_res.status_code == 409
        assert "already exists" in dup_res.json()["detail"]

        # 5. Invalid password login
        bad_login = await client.post("/api/auth/login", json={
            "email": unique_email,
            "password": "WrongPassword!"
        })
        assert bad_login.status_code == 401
        assert "Invalid email or password." in bad_login.json()["detail"]

        # 6. Unknown email login
        unknown_login = await client.post("/api/auth/login", json={
            "email": "nonexistent_email_12345@example.com",
            "password": "Password123!"
        })
        assert unknown_login.status_code == 401
        assert "Invalid email or password." in unknown_login.json()["detail"]

        # 7. Successful real authentication
        login_res = await client.post("/api/auth/login", json={
            "email": unique_email,
            "password": "Password123!"
        })
        assert login_res.status_code == 200
        auth_data = login_res.json()
        token = auth_data["access_token"]
        assert token is not None
        assert auth_data["user"]["email"] == unique_email

        # 8. Access /auth/me with Bearer token
        me_res = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert me_res.status_code == 200
        assert me_res.json()["email"] == unique_email
        assert me_res.json()["organization_name"] == company_name

        # 9. Access /auth/me without token -> 401
        unauth_res = await client.get("/api/auth/me")
        assert unauth_res.status_code == 401

@pytest.mark.asyncio
async def test_organization_multi_tenant_authorization():
    """
    Test that User A from Company A cannot access Company B's deals or memories.
    Strict 403 Forbidden enforcement.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Register User A in Org Alpha
        email_a = f"alice_{uuid.uuid4().hex[:6]}@alpha.com"
        await client.post("/api/auth/register", json={
            "name": "Alice Alpha",
            "email": email_a,
            "password": "AlphaPassword123!",
            "confirm_password": "AlphaPassword123!",
            "company_name": f"Alpha Dynamics {uuid.uuid4().hex[:4]}",
            "role": "sales_rep"
        })
        login_a = await client.post("/api/auth/login", json={"email": email_a, "password": "AlphaPassword123!"})
        token_a = login_a.json()["access_token"]
        org_a_id = login_a.json()["user"]["organization_id"]

        # Register User B in Org Beta
        email_b = f"bob_{uuid.uuid4().hex[:6]}@beta.com"
        await client.post("/api/auth/register", json={
            "name": "Bob Beta",
            "email": email_b,
            "password": "BetaPassword123!",
            "confirm_password": "BetaPassword123!",
            "company_name": f"Beta Innovations {uuid.uuid4().hex[:4]}",
            "role": "sales_rep"
        })
        login_b = await client.post("/api/auth/login", json={"email": email_b, "password": "BetaPassword123!"})
        token_b = login_b.json()["access_token"]
        org_b_id = login_b.json()["user"]["organization_id"]

        assert org_a_id != org_b_id

        # Insert Deal for Org Alpha in DB
        deal_alpha_id = f"deal_alpha_{uuid.uuid4().hex[:6]}"
        deal_beta_id = f"deal_beta_{uuid.uuid4().hex[:6]}"
        async with AsyncSessionLocal() as session:
            comp_a = Company(id=f"comp_a_{uuid.uuid4().hex[:6]}", name="Alpha Client", organization_id=org_a_id)
            comp_b = Company(id=f"comp_b_{uuid.uuid4().hex[:6]}", name="Beta Client", organization_id=org_b_id)
            session.add_all([comp_a, comp_b])
            await session.commit()

            deal_a = Deal(id=deal_alpha_id, company_id=comp_a.id, organization_id=org_a_id, name="Alpha Enterprise Contract", value=500000.0)
            deal_b = Deal(id=deal_beta_id, company_id=comp_b.id, organization_id=org_b_id, name="Beta Cloud Contract", value=700000.0)
            session.add_all([deal_a, deal_b])
            await session.commit()

        # 1. User A accesses Org Alpha deal -> 200 OK
        res_a_a = await client.get(f"/api/deals/{deal_alpha_id}", headers={"Authorization": f"Bearer {token_a}"})
        assert res_a_a.status_code == 200
        assert res_a_a.json()["id"] == deal_alpha_id

        # 2. User A attempts to access Org Beta deal -> 403 FORBIDDEN
        res_a_b = await client.get(f"/api/deals/{deal_beta_id}", headers={"Authorization": f"Bearer {token_a}"})
        assert res_a_b.status_code == 403
        assert "Access forbidden" in res_a_b.json()["detail"]

        # 3. User B accesses Org Beta deal -> 200 OK
        res_b_b = await client.get(f"/api/deals/{deal_beta_id}", headers={"Authorization": f"Bearer {token_b}"})
        assert res_b_b.status_code == 200
        assert res_b_b.json()["id"] == deal_beta_id

        # 4. User B attempts to access Org Alpha deal -> 403 FORBIDDEN
        res_b_a = await client.get(f"/api/deals/{deal_alpha_id}", headers={"Authorization": f"Bearer {token_b}"})
        assert res_b_a.status_code == 403
        assert "Access forbidden" in res_b_a.json()["detail"]

        # 5. User B attempts to retrieve memories of Org Alpha deal -> 403 FORBIDDEN
        res_b_mem = await client.get(f"/api/deals/{deal_alpha_id}/memory", headers={"Authorization": f"Bearer {token_b}"})
        assert res_b_mem.status_code == 403

        # 6. User B attempts AI meeting brief on Org Alpha deal -> 403 FORBIDDEN
        res_b_ai = await client.post("/api/ai/meeting-brief", headers={"Authorization": f"Bearer {token_b}"}, json={
            "deal_id": deal_alpha_id,
            "meeting_objective": "Hacking competitor"
        })
        assert res_b_ai.status_code == 403
