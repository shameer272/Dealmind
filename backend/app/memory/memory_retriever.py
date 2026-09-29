from typing import List, Dict, Any, Optional
from app.memory.hindsight_client import hindsight_client

class MemoryRetriever:
    """
    Intelligent retrieval coordinator using Hindsight TEMPR retrieval:
    Retrieves deal context, objections, commitments, competitors, and preferences.
    """
    def __init__(self, client=None):
        self.client = client or hindsight_client

    async def get_comprehensive_deal_memory(self, deal_id: str) -> Dict[str, List[Dict[str, Any]]]:
        bank_id = f"deal_{deal_id}"
        
        # Multi-query recall targeting sales intelligence pillars
        queries = [
            ("objections", "objection concern integration security pricing problem blocker"),
            ("competitors", "competitor alternative salesforce hubspot evaluating vs"),
            ("budget_timeline", "budget pricing cost investment timeline go-live decision"),
            ("commitments", "promise follow-up documentation send action item deliverable"),
            ("preferences", "preference communication demo requirement architecture hands-on")
        ]

        categorized_memories = {}
        for category, query in queries:
            memories = await self.client.recall(bank_id=bank_id, query=query, top_k=6)
            categorized_memories[category] = memories

        # General recall
        all_general = await self.client.recall(bank_id=bank_id, query="customer profile and priorities", top_k=15)
        categorized_memories["all_relevant"] = all_general
        return categorized_memories

    async def retrieve_for_prompt(self, deal_id: str, prompt_intent: str) -> List[Dict[str, Any]]:
        bank_id = f"deal_{deal_id}"
        return await self.client.recall(bank_id=bank_id, query=prompt_intent, top_k=10)
