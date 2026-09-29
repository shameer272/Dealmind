# DealMind — Comprehensive Testing Guide

This guide details the testing strategy, test suites, and instructions for verifying DealMind's backend, frontend, and AI memory layers.

## 1. Testing Architecture

DealMind includes automated tests across three distinct layers:
1. **Core Unit & Logic Tests**: Validates input sanitization, Pydantic schemas, and rule-based fallback extractors.
2. **Hindsight Memory Integration Tests**: Verifies etain, ecall, bank segregation, and multi-session association.
3. **AI Cognitive Evaluation Tests**: Empirical evaluations verifying budget recall, competitor detection, objection tracking, noise filtration, and commitment resolution.

---

## 2. Backend Automated Tests

All backend tests are located in ackend/tests/test_dealmind.py.

### Running Backend Tests

`ash
cd backend
python -m pytest tests/test_dealmind.py -v
`

### Test Cases Breakdown

1. **	est_memory_sanitization**:
   - Ensures sensitive credentials, JWT tokens, passwords, and API keys are redacted before ingestion into Hindsight.
2. **	est_rule_based_fact_extraction**:
   - Confirms that key entities (budgets, competitors, objections) are accurately identified even in fallback / rule-based extraction modes.
3. **	est_hindsight_retention_and_recall**:
   - Tests saving facts into Hindsight bank deal_{id} and retrieving them via natural language query.
4. **	est_eval_1_recall_customer_budget**:
   - Verifies explicit recall of customer budget constraints (₹10 Lakh).
5. **	est_eval_2_recall_competitor**:
   - Verifies recall of active competitors (e.g., Salesforce Einstein).
6. **	est_eval_3_recall_previous_objections**:
   - Verifies historical retrieval of technical blockers (e.g., CRM integration).
7. **	est_eval_4_connect_multi_interaction_facts**:
   - Verifies synthesis across separate interaction sessions (Session A + Session B).
8. **	est_eval_5_avoid_irrelevant_memories**:
   - Verifies precision filtering; prevents irrelevant chatter (e.g., weather) from polluting context.
9. **	est_eval_6_identify_unresolved_commitments**:
   - Verifies detection and surfacing of outstanding sales promises.

---

## 3. Frontend Build & Type Validation

The frontend uses TypeScript and Vite. All components and pages are validated for strict type safety and production build readiness.

### Running Frontend Typecheck & Build

`ash
cd frontend
npm run build
`

The output compiles cleanly into rontend/dist/.

---

## 4. End-to-End System Smoke Test

To verify the live system end-to-end:

1. **Start Backend**:
   `ash
   cd backend
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   `

2. **Start Frontend**:
   `ash
   cd frontend
   npm run dev
   `

3. **Verify Health Check**:
   `ash
   curl http://localhost:8000/
   curl http://localhost:8000/api/deals
   `

4. **Verify Flagship Acme Deal**:
   - Navigate to http://localhost:5173/deals/deal_acme_1
   - Test "Prepare for Meeting"
   - Test "Objection Radar"
   - Test "Memory Impact Demo"
