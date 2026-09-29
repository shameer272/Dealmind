import urllib.request
import urllib.error
import json
import uuid
import datetime

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

def test_full_create_deal_lifecycle():
    print("==================================================================")
    print("TEST: FULL CREATE DEAL LIFECYCLE & MULTI-TENANT ISOLATION AUDIT")
    print("==================================================================")

    # 1. Register and Login Org Alpha ("DealMind Test Company")
    rand_alpha = uuid.uuid4().hex[:6]
    alpha_email = f"lead_{rand_alpha}@dealmindtest.com"
    alpha_pass = "AlphaPass123!"
    
    print(f"\n[STEP A] Registering & Authenticating DealMind Test Company ({alpha_email})...")
    reg_s, reg_d = make_req("POST", "/auth/register", {
        "name": "Alpha Sales Rep",
        "email": alpha_email,
        "password": alpha_pass,
        "confirm_password": alpha_pass,
        "company_name": f"DealMind Test Company {rand_alpha}",
        "role": "sales_rep"
    })
    assert reg_s == 201, f"Registration failed: {reg_s}, {reg_d}"

    log_s, log_d = make_req("POST", "/auth/login", {
        "email": alpha_email,
        "password": alpha_pass
    })
    assert log_s == 200, f"Login failed: {log_s}, {log_d}"
    token_alpha = log_d["access_token"]
    org_alpha_id = log_d["user"]["organization_id"]
    print(f"PASS: Logged in as DealMind Test Company. Org ID: {org_alpha_id}")

    # Confirm initially 0 deals
    d0_s, d0_deals = make_req("GET", "/deals", token=token_alpha)
    assert d0_s == 200 and len(d0_deals) == 0, f"Expected 0 deals initially, got {len(d0_deals)}"
    print(f"PASS: Confirmed organization initially has 0 deals (Active Deals empty state).")

    # 2. Create Deal without organization_id (simulate exact frontend modal payload)
    print("\n[STEP B] Submitting POST /api/deals without organization_id...")
    deal_payload = {
        "name": "NextGen Cloud Infrastructure Rollout",
        "value": 1500000,
        "currency": "INR",
        "stage": "Discovery",
        "probability": 65,
        "expected_close_date": (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=45)).isoformat(),
        "company_name": "Apex OmniCorp",
        "industry": "FinTech",
        "website": "https://apexomni.example.com",
        "size": "200-1000",
        "location": "Bengaluru, India",
        "primary_contact_name": "Rajesh Sharma",
        "primary_contact_email": "rajesh@apexomni.example.com"
    }

    create_s, new_deal = make_req("POST", "/deals", deal_payload, token=token_alpha)
    assert create_s == 200, f"Deal creation failed: {create_s}, {new_deal}"
    new_deal_id = new_deal["id"]
    print(f"PASS: Deal successfully created with ID: {new_deal_id}")
    print(f"PASS: Backend automatically assigned organization_id: {new_deal['organization_id']}")
    assert new_deal["organization_id"] == org_alpha_id, "Security breach: Organization ID mismatch!"
    assert new_deal["company"]["name"] == "Apex OmniCorp"

    # 3. Confirm deal appears in Active Deals
    print("\n[STEP C] Verifying deal appears in GET /api/deals...")
    deals_s, deals_list = make_req("GET", "/deals", token=token_alpha)
    assert deals_s == 200
    assert len(deals_list) == 1
    assert deals_list[0]["id"] == new_deal_id
    assert deals_list[0]["name"] == "NextGen Cloud Infrastructure Rollout"
    print(f"PASS: Deal '{deals_list[0]['name']}' appears in Active Deals list!")

    # 4. Open Deal Detail
    print("\n[STEP D] Opening GET /api/deals/{new_deal_id}...")
    detail_s, detail_d = make_req("GET", f"/deals/{new_deal_id}", token=token_alpha)
    assert detail_s == 200
    assert detail_d["id"] == new_deal_id
    print(f"PASS: Deal Detail loaded: {detail_d['name']} (Value: {detail_d['value']} {detail_d['currency']})")

    # 5. Add an Interaction to the new deal
    print("\n[STEP E] Adding an interaction via POST /api/deals/{deal_id}/interactions...")
    int_payload = {
        "deal_id": new_deal_id,
        "type": "Meeting",
        "title": "Commercial Architecture & Procurement Budget Review",
        "content": "Meeting with Rajesh Sharma at Apex OmniCorp. He confirmed their annual budget ceiling is strictly 15 Lakh INR. Their primary blocker is ISO 27001 data residency compliance in Mumbai, and they are also evaluating Competitor CloudStack.",
        "participants": "Rajesh Sharma (VP), Rep",
        "outcome": "Aligned on ₹15L commercial scope; will provide Mumbai residency certs.",
        "next_steps": "Send data residency whitepaper and SOC2 report."
    }
    int_s, int_res = make_req("POST", f"/deals/{new_deal_id}/interactions", int_payload, token=token_alpha)
    assert int_s == 200, f"Failed adding interaction: {int_s}, {int_res}"
    print(f"PASS: Interaction recorded successfully: {int_res['interaction']['title']}")

    # 6. Confirm Hindsight memory is created and scoped to Alpha
    print("\n[STEP F & G] Checking GET /api/deals/{new_deal_id}/memory for Hindsight memory extraction...")
    mem_s, memories = make_req("GET", f"/deals/{new_deal_id}/memory", token=token_alpha)
    assert mem_s == 200
    print(f"PASS: Hindsight returned {len(memories)} memories for deal {new_deal_id}.")
    sample_fact = memories[0]['fact'].encode('ascii', 'ignore').decode()
    print(f"Sample Memory Extracted: '{sample_fact}'")

    # 7. Confirm Acme deal & memories remain inaccessible to DealMind Test Company
    print("\n[STEP H] Confirming Acme flagship deal and memories return HTTP 403 Forbidden...")
    acme_s, acme_err = make_req("GET", "/deals/deal_acme_flagship", token=token_alpha)
    assert acme_s == 403
    print(f"PASS: Deal access blocked across tenant perimeter: {acme_err['detail']}")

    acme_m_s, acme_m_err = make_req("GET", "/deals/deal_acme_flagship/memory", token=token_alpha)
    assert acme_m_s == 403
    print(f"PASS: Acme memory access blocked: {acme_m_err['detail']}")

    # 8. Register Org Beta and verify it CANNOT access Org Alpha's newly created deal
    rand_beta = uuid.uuid4().hex[:6]
    beta_email = f"lead_{rand_beta}@competitor.com"
    beta_pass = "BetaPass123!"
    print(f"\n[STEP I] Registering Org Beta ({beta_email}) and testing cross-tenant isolation on new deal...")
    make_req("POST", "/auth/register", {
        "name": "Beta Rep",
        "email": beta_email,
        "password": beta_pass,
        "confirm_password": beta_pass,
        "company_name": f"Competitor Org {rand_beta}",
        "role": "sales_rep"
    })
    _, log_beta = make_req("POST", "/auth/login", {"email": beta_email, "password": beta_pass})
    token_beta = log_beta["access_token"]

    cross_s, cross_err = make_req("GET", f"/deals/{new_deal_id}", token=token_beta)
    assert cross_s == 403, f"Expected 403 Forbidden for cross-org deal access, got {cross_s}"
    print(f"PASS: Org Beta denied access to DealMind Test Company deal: {cross_err['detail']}")

    cross_mem_s, cross_mem_err = make_req("GET", f"/deals/{new_deal_id}/memory", token=token_beta)
    assert cross_mem_s == 403
    print(f"PASS: Org Beta denied access to DealMind Test Company memories: {cross_mem_err['detail']}")

    print("\n==================================================================")
    print("ALL VERIFICATION REQUIREMENTS A THROUGH I PASSED COMPLETELY!")
    print("==================================================================")

if __name__ == "__main__":
    test_full_create_deal_lifecycle()
