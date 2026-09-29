from typing import List, Dict, Any
from app.schemas.schemas import MemoryItem, MemorySourceRef

class MemoryFormatter:
    """
    Formats Hindsight memory objects for LLM prompt context injection and UI display.
    """
    @staticmethod
    def format_memories_for_llm(memories: List[Dict[str, Any]]) -> str:
        if not memories:
            return "No previous Hindsight memory recorded for this deal."

        formatted_lines = []
        for i, m in enumerate(memories, 1):
            meta = m.get("metadata", {})
            mtype = meta.get("memory_type", "GENERAL")
            importance = meta.get("importance", "medium").upper()
            content = m.get("content", "")
            source = meta.get("source_title", "Interaction")
            formatted_lines.append(f"[{i}] [{mtype} - Priority: {importance}] {content} (Source: {source})")

        return "\n".join(formatted_lines)

    @staticmethod
    def to_source_refs(memories: List[Dict[str, Any]]) -> List[MemorySourceRef]:
        refs = []
        for m in memories:
            meta = m.get("metadata", {})
            refs.append(MemorySourceRef(
                memory_type=meta.get("memory_type", "DEAL_CONTEXT"),
                fact=m.get("content", ""),
                source_interaction=meta.get("source_title", "Historical Interaction"),
                occurred_at=m.get("created_at") or meta.get("occurred_at")
            ))
        return refs
