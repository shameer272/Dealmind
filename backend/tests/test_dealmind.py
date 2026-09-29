import pytest
import asyncio
from app.memory.memory_extractor import MemoryExtractor
from app.memory.hindsight_client import HindsightClient
from app.memory.memory_service import MemoryService
from app.agents.sales_agent import SalesIntelligenceAgent
from app.schemas.schemas import MemoryType

@pytest.fixture
def memory_service_instance():
    client = HindsightClient()
    return MemoryService(client=client)

# --- Section 41: Core Backend Tests ---

def test_memory_sanitization():
    extractor = MemoryExtractor()
    dirty_text = "Here is my password: secret123 and token: ghp_123456789012345678901234567890123456"
    sanitized = extractor.sanitize(dirty_text)
    assert "secret123" not in sanitized
    assert "[REDACTED_CREDENTIAL]" in sanitized

def test_rule_based_fact_extraction():
    extractor = MemoryExtractor()
    text = "We have allocated a budget around ₹10 lakh. We are also evaluating Salesforce. Our biggest blocker is CRM integration."
    facts = extractor.rule_based_extract(text)
    
    types = [f.memory_type for f in facts]
    assert MemoryType.BUDGET in types
    assert MemoryType.COMPETITOR in types
    assert MemoryType.OBJECTION in types

@pytest.mark.asyncio
async def test_hindsight_retention_and_recall(memory_service_instance):
    deal_id = "test_eval_deal"
    stored = await memory_service_instance.store_interaction_memory(
        deal_id=deal_id,
        interaction_id="int_test_1",
        interaction_title="Test Interaction",
        interaction_text="Customer stated budget is around ₹10 lakh and concern is CRM integration."
    )
    assert len(stored) >= 2

    # Recall
    recalled = await memory_service_instance.retrieve_deal_memory(deal_id, query="What is the budget?", top_k=5)
    assert len(recalled) > 0
    budget_facts = [m.fact for m in recalled if "₹10" in m.fact or "budget" in m.fact.lower() or "commercial" in m.fact.lower()]
    assert len(budget_facts) > 0

# --- Section 42: Formal Memory Evaluation Suite ---

@pytest.mark.asyncio
async def test_eval_1_recall_customer_budget(memory_service_instance):
    """Test 1: Can DealMind recall the customer's budget?"""
    deal_id = "deal_acme_eval"
    await memory_service_instance.store_interaction_memory(
        deal_id=deal_id,
        interaction_id="int_1",
        interaction_title="Budget Note",
        interaction_text="Customer stated: 'Our budget is around ₹10 lakh.'"
    )
    recalled = await memory_service_instance.retrieve_deal_memory(deal_id, query="customer budget", top_k=5)
    matched = any("10" in m.fact for m in recalled)
    assert matched, "Evaluation Failed: Could not recall customer budget."

@pytest.mark.asyncio
async def test_eval_2_recall_competitor(memory_service_instance):
    """Test 2: Can it recall the competitor?"""
    deal_id = "deal_acme_eval"
    await memory_service_instance.store_interaction_memory(
        deal_id=deal_id,
        interaction_id="int_2",
        interaction_title="Competitor Discussion",
        interaction_text="Sarah mentioned they are evaluating Salesforce Einstein."
    )
    recalled = await memory_service_instance.retrieve_deal_memory(deal_id, query="competitors evaluated", top_k=5)
    matched = any("Salesforce" in m.fact for m in recalled)
    assert matched, "Evaluation Failed: Could not recall competitor."

@pytest.mark.asyncio
async def test_eval_3_recall_previous_objections(memory_service_instance):
    """Test 3: Can it recall previous objections?"""
    deal_id = "deal_acme_eval"
    await memory_service_instance.store_interaction_memory(
        deal_id=deal_id,
        interaction_id="int_3",
        interaction_title="Technical Friction",
        interaction_text="Vikram stated our biggest concern is CRM integration and webhook latency."
    )
    recalled = await memory_service_instance.retrieve_deal_memory(deal_id, query="objections and blockers", top_k=5)
    matched = any("CRM integration" in m.fact or "integration" in m.fact.lower() for m in recalled)
    assert matched, "Evaluation Failed: Could not recall objections."

@pytest.mark.asyncio
async def test_eval_4_connect_multi_interaction_facts(memory_service_instance):
    """Test 4: Can it connect information from multiple interactions?"""
    deal_id = "deal_acme_eval_multi"
    # Interaction A: Budget
    await memory_service_instance.store_interaction_memory(
        deal_id=deal_id,
        interaction_id="int_a",
        interaction_title="Budget Discussion",
        interaction_text="Customer locked budget parameter at ₹10 lakh."
    )
    # Interaction B: Competitor
    await memory_service_instance.store_interaction_memory(
        deal_id=deal_id,
        interaction_id="int_b",
        interaction_title="Competitor Note",
        interaction_text="Competitor evaluation confirmed: Salesforce Einstein."
    )
    
    # Query spanning both budget and competitor
    recalled = await memory_service_instance.retrieve_deal_memory(deal_id, query="budget and Salesforce competitors", top_k=10)
    has_budget = any("10" in m.fact for m in recalled)
    has_competitor = any("Salesforce" in m.fact for m in recalled)
    assert has_budget and has_competitor, "Evaluation Failed: Multi-session facts not connected."

@pytest.mark.asyncio
async def test_eval_5_avoid_irrelevant_memories(memory_service_instance):
    """Test 5: Can it prioritize relevant memories and avoid irrelevant noise?"""
    deal_id = "deal_acme_eval_relevance"
    # Store relevant memory
    await memory_service_instance.store_interaction_memory(
        deal_id=deal_id,
        interaction_id="int_rel",
        interaction_title="Commercial Terms",
        interaction_text="Confirmed commercial budget is strictly ₹10 lakh."
    )
    # Store irrelevant noise
    await memory_service_instance.store_interaction_memory(
        deal_id=deal_id,
        interaction_id="int_irr",
        interaction_title="Weather Chatter",
        interaction_text="General conversation about heavy rains in Bengaluru during monsoon."
    )
    
    # Top 1 recalled memory for 'commercial budget' should be the budget, NOT the weather
    recalled = await memory_service_instance.retrieve_deal_memory(deal_id, query="commercial budget parameter", top_k=1)
    assert len(recalled) == 1
    assert "10" in recalled[0].fact or "budget" in recalled[0].fact.lower()
    assert "monsoon" not in recalled[0].fact.lower()

@pytest.mark.asyncio
async def test_eval_6_identify_unresolved_commitments(memory_service_instance):
    """Test 6: Can it identify unresolved commitments?"""
    deal_id = "deal_acme_eval"
    await memory_service_instance.store_interaction_memory(
        deal_id=deal_id,
        interaction_id="int_5",
        interaction_title="Action Items",
        interaction_text="Rep promised: We will send official SOC2 audit report by Friday."
    )
    recalled = await memory_service_instance.retrieve_deal_memory(deal_id, query="promises and commitments", top_k=5)
    matched = any("commitment" in m.fact.lower() or "audit" in m.fact.lower() or "action item" in m.fact.lower() for m in recalled)
    assert matched, "Evaluation Failed: Could not identify commitments."
