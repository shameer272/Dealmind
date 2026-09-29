import urllib.request
import urllib.error
import json
import uuid
import sqlite3

BASE_URL = "http://localhost:8000/api"

def make_req(method, endpoint, data=None, token=None):
    url = f"{BASE_URL}{endpoint}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req_body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=req_body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            body = resp.read().decode("utf-8")
            return resp.status, json.loads(body) if body else {}
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(body)
        except:
            return e.code, {"detail": body}

def test_tenant_isolation_and_empty_state():
    print("============================================================")
    print("TESTING TENANT ISOLATION, EMPTY STATE & ACME ACCESS")
    print("============================================================")

    # 1. Register a fresh new company with 0 deals
    fresh_id = uuid.uuid4().hex[:6]
    fresh_user_email = f"user_{fresh_id}@freshcorp.io"
    fresh_user_pass = "Password123!"
    reg_status, reg_data = make_req("POST", "/auth/register", {
        "name": "Fresh User",
        "email": fresh_user_email,
        "password": fresh_user_pass,
        "confirm_password": fresh_user_pass,
        "company_name": f"Fresh Corp {fresh_id}",
        "role": "sales_rep"
    })
    assert reg_status == 201, f"Failed registration: {reg_status}, {reg_data}"
    
    # Login to obtain JWT
    login_status, login_res = make_req("POST", "/auth/login", {
        "email": fresh_user_email,
        "password": fresh_user_pass
    })
    assert login_status == 200, f"Login failed: {login_status}, {login_res}"
    token_fresh = login_res["access_token"]
    org_fresh = login_res["user"]["organization_id"]
    print(f"1. Registered and logged in fresh user {fresh_user_email}, org_id={org_fresh}")

    # 2. Check /api/dashboard for Fresh Corp
    d_status, d_data = make_req("GET", "/dashboard", token=token_fresh)
    assert d_status == 200, f"Failed dashboard: {d_status}, {d_data}"
    print(f"2. Fresh Corp Dashboard: {d_data}")
    assert d_data["total_pipeline_value"] == 0, f"Expected 0 pipeline value, got {d_data['total_pipeline_value']}"
    assert d_data["active_deals_count"] == 0, f"Expected 0 active deals, got {d_data['active_deals_count']}"
    assert d_data["meetings_today_count"] == 0, f"Expected 0 meetings, got {d_data['meetings_today_count']}"
    assert d_data["follow_ups_due_count"] == 0, f"Expected 0 follow ups, got {d_data['follow_ups_due_count']}"
    assert d_data["high_risk_deals_count"] == 0, f"Expected 0 high risk deals, got {d_data['high_risk_deals_count']}"
    assert len(d_data["deals"]) == 0, f"Expected 0 deals in dashboard, got {len(d_data['deals'])}"
    assert len(d_data["meetings_today"]) == 0, f"Expected 0 meetings in dashboard, got {len(d_data['meetings_today'])}"
    assert len(d_data["recent_insights"]) == 0, f"Expected 0 insights in dashboard, got {len(d_data['recent_insights'])}"
    print("PASS: Fresh Corp receives 0 metrics and EMPTY deal/meeting/insight arrays - zero Acme data leakage!")

    # 3. Check /api/deals for Fresh Corp
    deals_status, deals_data = make_req("GET", "/deals", token=token_fresh)
    assert deals_status == 200
    assert len(deals_data) == 0, f"Expected 0 deals, got {len(deals_data)}"
    print("PASS: /api/deals returns empty list [] for new organization")

    # 4. Attempt to access Acme Flagship Deal directly
    acme_status, acme_err = make_req("GET", "/deals/deal_acme_flagship", token=token_fresh)
    assert acme_status == 403, f"Expected 403, got {acme_status}"
    print(f"PASS: Direct access to deal_acme_flagship by fresh user returns HTTP 403: {acme_err['detail']}")

    # 4a. Cross-org AI Deal Health check
    dh_status, dh_err = make_req("POST", "/ai/deal-health?deal_id=deal_acme_flagship", token=token_fresh)
    assert dh_status == 403, f"Expected 403, got {dh_status}"
    print(f"PASS: AI Deal Health returns HTTP 403 across tenant boundary: {dh_err['detail']}")

    # 4b. Cross-org AI Objection Analysis check
    oa_status, oa_err = make_req("POST", "/ai/objection-analysis?deal_id=deal_acme_flagship", token=token_fresh)
    assert oa_status == 403, f"Expected 403, got {oa_status}"
    print(f"PASS: AI Objection Analysis returns HTTP 403 across tenant boundary: {oa_err['detail']}")

    # 4c. Cross-org AI Meeting Brief check
    mb_status, mb_err = make_req("POST", "/ai/meeting-brief", {"deal_id": "deal_acme_flagship", "meeting_objective": "test"}, token=token_fresh)
    assert mb_status == 403, f"Expected 403, got {mb_status}"
    print(f"PASS: AI Meeting Brief returns HTTP 403 across tenant boundary: {mb_err['detail']}")

    # 4d. Cross-org Customer Memory check
    mem_status, mem_err = make_req("GET", "/deals/deal_acme_flagship/memory", token=token_fresh)
    assert mem_status == 403, f"Expected 403, got {mem_status}"
    print(f"PASS: Customer Memory returns HTTP 403 across tenant boundary: {mem_err['detail']}")

    # 5. Create an authorized user for org_acme to verify Acme user access
    conn = sqlite3.connect("dealmind.db")
    cursor = conn.cursor()
    acme_user_id = f"user_acme_auditor_{fresh_id}"
    import bcrypt
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(b"AcmePassword123!", salt).decode("utf-8")
    import datetime
    now_str = datetime.datetime.utcnow().isoformat()
    cursor.execute("""
        INSERT INTO users (id, email, password_hash, name, role, organization_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (acme_user_id, f"auditor_{fresh_id}@acme.com", hashed, "Acme Auditor", "sales_rep", "org_acme", now_str))
    conn.commit()
    conn.close()

    # 6. Login as org_acme user
    l_status, l_data = make_req("POST", "/auth/login", {
        "email": f"auditor_{fresh_id}@acme.com",
        "password": "AcmePassword123!"
    })
    assert l_status == 200, f"Login failed: {l_status}, {l_data}"
    token_acme = l_data["access_token"]
    assert l_data["user"]["organization_id"] == "org_acme"
    print(f"3. Logged in as org_acme user: {l_data['user']['email']}")

    # 7. Check org_acme access to deal_acme_flagship
    acme_deal_status, acme_deal_data = make_req("GET", "/deals/deal_acme_flagship", token=token_acme)
    assert acme_deal_status == 200, f"Acme user could not access deal_acme_flagship: {acme_deal_status}"
    deal_name = acme_deal_data["name"]
    print(f"Acme Deal Name: {deal_name}")
    assert len(deal_name) > 0
    print(f"PASS: org_acme user successfully retrieved flagship deal: {deal_name}")

    # 8. Check org_acme dashboard
    acme_dash_status, acme_dash_data = make_req("GET", "/dashboard", token=token_acme)
    assert acme_dash_status == 200
    assert acme_dash_data["total_pipeline_value"] > 0
    assert len(acme_dash_data["deals"]) > 0
    print(f"PASS: org_acme dashboard correctly loads pipeline: ${acme_dash_data['total_pipeline_value']:,.2f} with {len(acme_dash_data['deals'])} deals")

    print("\nALL TENANT AND EMPTY-STATE CHECKS PASSED PERFECTLY!")

if __name__ == "__main__":
    test_tenant_isolation_and_empty_state()
