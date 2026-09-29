import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from app.memory.hindsight_client import hindsight_client, HindsightClient
from app.memory.memory_extractor import MemoryExtractor
from app.memory.memory_formatter import MemoryFormatter
from app.memory.memory_retriever import MemoryRetriever
from app.schemas.schemas import MemoryItem, MemoryType, ExtractedFact

logger = logging.getLogger("dealmind.memory_service")

class MemoryService:
    """
    Central orchestration service for persistent AI memory using Hindsight.
    Responsible for extraction, sanitization, ingestion (retain), recall, and reflection.
    """
    def __init__(self, client: Optional[HindsightClient] = None):
        self.client = client or hindsight_client
        self.retriever = MemoryRetriever(self.client)
        self.extractor = MemoryExtractor()
        self.formatter = MemoryFormatter()

    def get_bank_id(self, deal_id: str, organization_id: Optional[str] = None) -> str:
        if organization_id and organization_id not in ("org_acme", "default"):
            return f"org_{organization_id}_deal_{deal_id}"
        return f"deal_{deal_id}"

    async def store_interaction_memory(
        self,
        deal_id: str,
        interaction_id: str,
        interaction_title: str,
        interaction_text: str,
        company_id: Optional[str] = None,
        custom_facts: Optional[List[ExtractedFact]] = None,
        organization_id: Optional[str] = None
    ) -> List[MemoryItem]:
        """
        Processes an interaction, extracts structured facts, and retains them in Hindsight.
        Tagged with organization_id for complete multi-tenant memory isolation.
        """
        bank_id = self.get_bank_id(deal_id, organization_id=organization_id)
        sanitized_text = self.extractor.sanitize(interaction_text)

        # Extract structured facts (rule-based or provided by LLM analysis)
        facts_to_store = custom_facts or self.extractor.rule_based_extract(sanitized_text)

        stored_memories: List[MemoryItem] = []
        for fact_obj in facts_to_store:
            metadata = {
                "deal_id": deal_id,
                "company_id": company_id,
                "organization_id": organization_id,
                "memory_type": fact_obj.memory_type.value,
                "importance": fact_obj.importance,
                "confidence": fact_obj.confidence,
                "source_interaction_id": interaction_id,
                "source_title": interaction_title,
                "tags": fact_obj.tags,
                "stored_at": datetime.now(timezone.utc).isoformat()
            }

            retain_res = await self.client.retain(
                bank_id=bank_id,
                content=fact_obj.fact,
                context=f"Interaction: {interaction_title}",
                metadata=metadata
            )

            mem_id = retain_res.get("memory_id") or retain_res.get("id") or f"mem_{datetime.now(timezone.utc).timestamp()}"
            stored_memories.append(MemoryItem(
                id=mem_id,
                deal_id=deal_id,
                company_id=company_id,
                memory_type=fact_obj.memory_type,
                fact=fact_obj.fact,
                importance=fact_obj.importance,
                source_interaction_id=interaction_id,
                source_title=interaction_title,
                timestamp=datetime.now(timezone.utc),
                confidence=fact_obj.confidence,
                tags=fact_obj.tags
            ))

        logger.info(f"Retained {len(stored_memories)} memories in Hindsight bank {bank_id} (org: {organization_id})")
        return stored_memories

    async def retrieve_deal_memory(
        self,
        deal_id: str,
        query: str = "customer profile, objections, budget, commitments",
        top_k: int = 15,
        organization_id: Optional[str] = None
    ) -> List[MemoryItem]:
        """Retrieve memories for a deal from Hindsight with organization scoping"""
        bank_id = self.get_bank_id(deal_id, organization_id=organization_id)
        raw_memories = await self.client.recall(bank_id=bank_id, query=query, top_k=top_k)
        
        items: List[MemoryItem] = []
        for m in raw_memories:
            meta = m.get("metadata", {})
            # Verify organization isolation if set
            mem_org = meta.get("organization_id")
            if organization_id and mem_org and mem_org != organization_id:
                continue

            try:
                mtype = MemoryType(meta.get("memory_type", MemoryType.DEAL_CONTEXT.value))
            except Exception:
                mtype = MemoryType.DEAL_CONTEXT

            items.append(MemoryItem(
                id=m.get("id", "mem_unknown"),
                deal_id=deal_id,
                company_id=meta.get("company_id"),
                memory_type=mtype,
                fact=m.get("content", ""),
                importance=meta.get("importance", "medium"),
                source_interaction_id=meta.get("source_interaction_id"),
                source_title=meta.get("source_title", "Interaction"),
                timestamp=datetime.fromisoformat(m.get("created_at", datetime.now(timezone.utc).isoformat())),
                confidence=float(meta.get("confidence", 0.95)),
                tags=meta.get("tags", [])
            ))
        return items

    async def retrieve_customer_context(self, deal_id: str) -> Dict[str, Any]:
        """Categorized memory synthesis for sales workflows"""
        return await self.retriever.get_comprehensive_deal_memory(deal_id)

    async def get_relevant_memories(self, deal_id: str, prompt_text: str, top_k: int = 10) -> List[Dict[str, Any]]:
        """Query-driven memory retrieval"""
        return await self.retriever.retrieve_for_prompt(deal_id, prompt_text)

    async def reflect_on_deal(self, deal_id: str, question: str) -> Dict[str, Any]:
        """Use Hindsight reflect to synthesize higher-order deal intelligence"""
        bank_id = self.get_bank_id(deal_id)
        return await self.client.reflect(bank_id=bank_id, query=question)

memory_service = MemoryService()
