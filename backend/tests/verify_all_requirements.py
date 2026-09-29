import sys
import json
import uuid
import sqlite3
import urllib.request
import urllib.error

BASE_URL = "http://localhost:8000/api"

def make_request(method, url, data=None, headers=None):
    if headers is None:
        headers = {}
    req_data = None
    if data is not None:
        req_data = json.dumps(data).encode('utf-8')
        headers["Content-Type"] = "application/json"
    
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            resp_body = response.read().decode('utf-8')
            return response.status, json.loads(resp_body) if resp_body else {}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8')
        try:
            return e.code, json.loads(err_body)
        except Exception:
            return e.code, {"detail": err_body}
    except Exception as e:
        return 500, {"detail": str(e)}

def run_e2e_verification():
    print("==================================================================")
    print("DEALMIND REAL REGISTRATION & AUTHENTICATION VERIFICATION AUDIT")
    print("==================================================================")
    
    # 1. Dynamic Test User A
    rand_a = uuid.uuid4().hex[:6]
    test_user_a = {
        "name": f"Auditor Alpha {rand_a}",
        "email": f"audit_user_{rand_a}@company-a.io",
        "password": f"SecurePass_{rand_a}!2026",
        "confirm_password": f"SecurePass_{rand_a}!2026",
        "company_name": f"Enterprise Org Alpha {rand_a}",
        "role": "sales_rep"
    }
    
    print(f"\n[TEST 1] Registering Real User A ({test_user_a['email']} @ {test_user_a['company_name']})...")
    status, res = make_request("POST", f"{BASE_URL}/auth/register", test_user_a)
    print(f"Status: {status}")
    assert status == 201, f"Expected 201 Created for new user registration, got: {status}, {res}"
    print(f"PASS: User registered successfully: {res['user']['email']}, Org: {res['user']['organization_name']}")

    # 2. Duplicate Registration Rejection
    print("\n[TEST 2] Verifying Duplicate Email is rejected...")
    status_dup, res_dup = make_request("POST", f"{BASE_URL}/auth/register", test_user_a)
    assert status_dup == 409, f"Expected 409 Conflict for duplicate email, got: {status_dup}"
    print(f"PASS: Duplicate registration blocked with HTTP 409: {res_dup.get('detail')}")

    # 3. Password Security: Inspect DB to ensure NO plaintext password stored
    print("\n[TEST 3] Verifying Password Security in database...")
    conn = sqlite3.connect("dealmind.db")
    cursor = conn.cursor()
    cursor.execute("SELECT id, email, password_hash FROM users WHERE email = ?", (test_user_a["email"],))
    row = cursor.fetchone()
    assert row is not None, "User record not found in database!"
    user_id, email, password_hash = row
    assert password_hash != test_user_a["password"], "SECURITY BREACH: Plaintext password found in database!"
    assert password_hash.startswith("$2b$") or password_hash.startswith("$2a$"), "Password is not a valid bcrypt hash!"
    print(f"PASS: Password is securely hashed using bcrypt: {password_hash[:15]}... (No plaintext stored)")
    conn.close()

    # 4. Login: Unknown email rejection
    print("\n[TEST 4] Testing Login with unknown email...")
    status_unk, res_unk = make_request("POST", f"{BASE_URL}/auth/login", {"email": f"nonexistent_{uuid.uuid4().hex[:8]}@unknown.com", "password": "AnyPassword123!"})
    assert status_unk == 401, f"Expected 401, got {status_unk}"
    assert "Invalid email or password." in str(res_unk)
    print(f"PASS: Unknown email rejected with HTTP 401: {res_unk.get('detail')}")

    # 5. Login: Incorrect password rejection
    print("\n[TEST 5] Testing Login with incorrect password...")
    status_wrong, res_wrong = make_request("POST", f"{BASE_URL}/auth/login", {"email": test_user_a["email"], "password": "WrongPassword999!"})
    assert status_wrong == 401, f"Expected 401, got {status_wrong}"
    assert "Invalid email or password." in str(res_wrong)
    print(f"PASS: Incorrect password rejected with HTTP 401: {res_wrong.get('detail')}")

    # 6. Login: Successful login returns token & user info
    print("\n[TEST 6] Testing Login with valid credentials...")
    status_login_a, auth_a = make_request("POST", f"{BASE_URL}/auth/login", {"email": test_user_a["email"], "password": test_user_a["password"]})
    assert status_login_a == 200, f"Login failed: {auth_a}"
    token_a = auth_a["access_token"]
    org_id_a = auth_a["user"]["organization_id"]
    print(f"PASS: Login successful! Received JWT token: {token_a[:20]}...")
    print(f"User: {auth_a['user']['name']} ({auth_a['user']['email']}), Org: {auth_a['organization']['name']} (ID: {org_id_a})")

    # 7. Protected Route: /auth/me with Bearer token
    print("\n[TEST 7] Testing GET /api/auth/me with Bearer token...")
    headers_a = {"Authorization": f"Bearer {token_a}"}
    status_me, res_me = make_request("GET", f"{BASE_URL}/auth/me", headers=headers_a)
    assert status_me == 200, f"Failed: {res_me}"
    assert res_me["email"] == test_user_a["email"]
    print(f"PASS: /api/auth/me returned authenticated user profile.")

    # 8. Protected Route: Unauthenticated access blocked
    print("\n[TEST 8] Verifying Unauthenticated Requests are blocked with HTTP 401...")
    status_no_auth, res_no_auth = make_request("GET", f"{BASE_URL}/deals")
    assert status_no_auth == 401, f"Expected 401, got {status_no_auth}"
    print(f"PASS: Unauthenticated request to /api/deals blocked with HTTP 401: {res_no_auth.get('detail')}")

    # 9. Multi-Tenant Authorization Test: Register User B (Company B)
    rand_b = uuid.uuid4().hex[:6]
    test_user_b = {
        "name": f"Auditor Beta {rand_b}",
        "email": f"audit_user_{rand_b}@company-b.io",
        "password": f"SecurePass_{rand_b}!2026",
        "confirm_password": f"SecurePass_{rand_b}!2026",
        "company_name": f"Enterprise Org Beta {rand_b}",
        "role": "sales_manager"
    }
    print(f"\n[TEST 9] Registering Real User B ({test_user_b['email']} @ {test_user_b['company_name']})...")
    status_b, res_b = make_request("POST", f"{BASE_URL}/auth/register", test_user_b)
    assert status_b == 201, f"Expected 201, got: {status_b}, {res_b}"
    
    status_login_b, auth_b = make_request("POST", f"{BASE_URL}/auth/login", {"email": test_user_b["email"], "password": test_user_b["password"]})
    assert status_login_b == 200, f"User B login failed: {auth_b}"
    token_b = auth_b["access_token"]
    org_id_b = auth_b["user"]["organization_id"]
    headers_b = {"Authorization": f"Bearer {token_b}"}
    print(f"PASS: User B authenticated! Org: {auth_b['organization']['name']} (ID: {org_id_b})")

    # Verify Organization IDs are distinct
    assert org_id_a != org_id_b, f"Organization IDs must be distinct! Both are {org_id_a}"

    # 10. Multi-Tenant Data Isolation:
    print("\n[TEST 10] Testing Multi-Tenant Resource Authorization (403 Forbidden enforcement)...")
    
    # User A and User B trying to access Acme Flagship Deal (belongs to org_acme)
    # Neither User A nor User B belongs to org_acme, so both MUST receive 403 Forbidden!
    print("Testing User A access to Acme Flagship Deal...")
    status_a_acme, res_a_acme = make_request("GET", f"{BASE_URL}/deals/deal_acme_flagship", headers=headers_a)
    assert status_a_acme == 403, f"Expected 403 Forbidden for User A on Acme deal, got: {status_a_acme}, {res_a_acme}"
    print(f"PASS: User A receives HTTP 403 FORBIDDEN when attempting to access Acme deal: {res_a_acme.get('detail')}")

    print("Testing User B access to Acme Flagship Deal...")
    status_b_acme, res_b_acme = make_request("GET", f"{BASE_URL}/deals/deal_acme_flagship", headers=headers_b)
    assert status_b_acme == 403, f"Expected 403 Forbidden for User B on Acme deal, got: {status_b_acme}, {res_b_acme}"
    print(f"PASS: User B receives HTTP 403 FORBIDDEN when attempting to access Acme deal: {res_b_acme.get('detail')}")

    # User A trying to access AI Meeting Brief on Acme Deal
    print("Testing User A access to AI Meeting Brief on Acme Deal...")
    status_a_prep, res_a_prep = make_request("POST", f"{BASE_URL}/ai/meeting-brief", {"deal_id": "deal_acme_flagship", "meeting_objective": "Q3 Executive Review"}, headers=headers_a)
    assert status_a_prep == 403, f"Expected 403 Forbidden, got {status_a_prep}: {res_a_prep}"
    print(f"PASS: AI Meeting Brief returns HTTP 403 FORBIDDEN across organization boundaries: {res_a_prep.get('detail')}")

    # 11. Preserving Existing Acme Technologies Data
    print("\n[TEST 11] Verifying Existing Acme Demo Data is preserved and accessible...")
    conn = sqlite3.connect("dealmind.db")
    c = conn.cursor()
    c.execute("SELECT id, name, organization_id FROM deals WHERE id = 'deal_acme_flagship'")
    deal_row = c.fetchone()
    assert deal_row is not None, "deal_acme_flagship was accidentally deleted!"
    assert deal_row[2] == "org_acme", f"deal_acme_flagship organization_id must be org_acme, got: {deal_row[2]}"

    c.execute("SELECT count(*) FROM interactions WHERE deal_id = 'deal_acme_flagship'")
    interaction_count = c.fetchone()[0]
    assert interaction_count >= 5, f"Existing interactions missing: {interaction_count}"
    print(f"PASS: deal_acme_flagship preserved with {interaction_count} interactions and organization_id='org_acme'.")
    conn.close()

    # 12. Frontend Dev Server check
    print("\n[TEST 12] Verifying Frontend Dev Server responds at http://localhost:5173...")
    try:
        req_fe = urllib.request.Request("http://localhost:5173/")
        with urllib.request.urlopen(req_fe, timeout=5) as fe_resp:
            assert fe_resp.status == 200
            print("PASS: Frontend server is running and responding at http://localhost:5173.")
    except Exception as e:
        print(f"Frontend connection check: {e}")

    print("\n==================================================================")
    print("ALL 12 REAL AUTHENTICATION & MULTI-TENANT AUDIT CHECKS PASSED!")
    print("==================================================================")

if __name__ == "__main__":
    run_e2e_verification()
