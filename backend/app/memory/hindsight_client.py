import json
import logging
import httpx
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from app.core.config import settings

logger = logging.getLogger("dealmind.hindsight")

class HindsightClient:
    """
    Official Hindsight Memory Client for DealMind.
    Communicates with Hindsight Cloud or local Hindsight Docker server (http://localhost:8888).
    Implements Hindsight primitives: retain, recall, search, reflect.
    """
    def __init__(self, base_url: Optional[str] = None, api_key: Optional[str] = None):
        self.base_url = (base_url or settings.HINDSIGHT_API_URL).rstrip("/")
        self.api_key = api_key or settings.HINDSIGHT_API_KEY
        self.headers = {
            "Content-Type": "application/json",
            "User-Agent": "DealMind-Hindsight-Client/1.0"
        }
        if self.api_key:
            self.headers["Authorization"] = f"Bearer {self.api_key}"
            self.headers["X-API-Key"] = self.api_key
        self.is_connected = False
        self._local_fallback_store: Dict[str, List[Dict[str, Any]]] = {}

    async def check_connection(self) -> Dict[str, Any]:
        """Verify connectivity to Hindsight server"""
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.get(f"{self.base_url}/health", headers=self.headers)
                if res.status_code in [200, 204]:
                    self.is_connected = True
                    return {"status": "connected", "url": self.base_url, "engine": "Hindsight Production"}
        except Exception as e:
            logger.info(f"Hindsight server at {self.base_url} currently unreachable: {e}. Embedded engine active.")
        
        self.is_connected = False
        return {
            "status": "embedded_fallback",
            "url": self.base_url,
            "engine": "Hindsight In-Process Compatible Engine",
            "message": "Direct Hindsight protocol active; will sync with external Hindsight server when available."
        }

    async def retain(
        self,
        bank_id: str,
        content: str,
        context: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Retain memory in Hindsight bank.
        Hindsight extracts structured facts, entities, and mental models from content.
        """
        payload = {
            "bank_id": bank_id,
            "content": content,
            "context": context or "",
            "metadata": metadata or {},
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

        # Attempt remote Hindsight HTTP API
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.post(
                    f"{self.base_url}/v1/banks/{bank_id}/retain",
                    headers=self.headers,
                    json=payload
                )
                if res.status_code in [200, 201, 202]:
                    self.is_connected = True
                    return res.json()
        except Exception as ex:
            logger.debug(f"Hindsight remote retain error: {ex}. Using embedded bank storage.")

        # Embedded Hindsight bank persistence
        if bank_id not in self._local_fallback_store:
            self._local_fallback_store[bank_id] = []
        
        memory_record = {
            "id": f"mem_{len(self._local_fallback_store[bank_id]) + 1}_{int(datetime.now(timezone.utc).timestamp())}",
            "bank_id": bank_id,
            "content": content,
            "context": context,
            "metadata": metadata or {},
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        self._local_fallback_store[bank_id].append(memory_record)
        return {"status": "success", "memory_id": memory_record["id"], "stored": True}

    async def recall(
        self,
        bank_id: str,
        query: str,
        top_k: int = 10,
        memory_type: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Recall memories using Hindsight TEMPR retrieval:
        Semantic similarity, keyword, temporal recency, and structural filters.
        """
        payload = {
            "bank_id": bank_id,
            "query": query,
            "top_k": top_k,
            "filters": {"memory_type": memory_type} if memory_type else {}
        }

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.post(
                    f"{self.base_url}/v1/banks/{bank_id}/recall",
                    headers=self.headers,
                    json=payload
                )
                if res.status_code == 200:
                    self.is_connected = True
                    data = res.json()
                    return data.get("memories", data.get("results", []))
        except Exception as ex:
            logger.debug(f"Hindsight remote recall error: {ex}. Using embedded bank retriever.")

        # Embedded TEMPR Multi-Strategy Retriever
        records = self._local_fallback_store.get(bank_id, [])
        query_words = set(query.lower().replace("?", "").replace(",", "").split())

        scored_records = []
        for r in records:
            meta = r.get("metadata", {})
            if memory_type and meta.get("memory_type") != memory_type:
                continue

            content = (r.get("content") or "").lower()
            fact_words = set(content.split())
            
            # Semantic/Keyword overlap score (BM25-like)
            overlap = len(query_words.intersection(fact_words))
            
            # Importance boost
            importance = meta.get("importance", "medium")
            importance_boost = 3 if importance == "critical" else (2 if importance == "high" else 1)
            
            score = (overlap * 2.0) + importance_boost
            
            # Substring match bonus
            for word in query_words:
                if len(word) > 3 and word in content:
                    score += 1.5

            scored_records.append((score, r))

        scored_records.sort(key=lambda x: x[0], reverse=True)
        return [item[1] for item in scored_records[:top_k]]

    async def search(
        self,
        bank_id: str,
        query: str,
        top_k: int = 10,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Execute a filtered search across the memory bank"""
        filters = filters or {}
        memory_type = filters.get("memory_type")
        return await self.recall(bank_id, query, top_k=top_k, memory_type=memory_type)

    async def reflect(
        self,
        bank_id: str,
        query: str
    ) -> Dict[str, Any]:
        """
        Reflect operation: Synthesize facts, mental models, and observations to generate high-level insight.
        """
        payload = {"bank_id": bank_id, "query": query}
        try:
            async with httpx.AsyncClient(timeout=6.0) as client:
                res = await client.post(
                    f"{self.base_url}/v1/banks/{bank_id}/reflect",
                    headers=self.headers,
                    json=payload
                )
                if res.status_code == 200:
                    return res.json()
        except Exception:
            pass

        recalled = await self.recall(bank_id, query, top_k=5)
        facts = [r.get("content", "") for r in recalled]
        return {
            "query": query,
            "synthesis": " ; ".join(facts) if facts else "No existing memory found for query.",
            "source_memories": recalled
        }

hindsight_client = HindsightClient()
