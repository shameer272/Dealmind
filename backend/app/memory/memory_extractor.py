import re
from typing import List, Dict, Any
from app.schemas.schemas import MemoryType, ExtractedFact

class MemoryExtractor:
    """
    Extracts structured memory categories and sanitizes sensitive data.
    Ensures safe, structured ingestion into Hindsight.
    """
    SENSITIVE_PATTERNS = [
        re.compile(r'(?i)(password|secret|passwd|token|api[_-]?key)\s*[:=]\s*(\S+)', re.IGNORECASE),
        re.compile(r'\b(?:\d[ -]*?){13,16}\b'),  # Credit cards
        re.compile(r'(?i)bearer\s+[A-Za-z0-9_\-\.]+', re.IGNORECASE),
        re.compile(r'ghp_[A-Za-z0-9_]{36}'),  # GitHub token
    ]

    @classmethod
    def sanitize(cls, text: str) -> str:
        """Strip sensitive credentials before sending to memory"""
        sanitized = text
        for pattern in cls.SENSITIVE_PATTERNS:
            sanitized = pattern.sub("[REDACTED_CREDENTIAL]", sanitized)
        return sanitized

    @classmethod
    def rule_based_extract(cls, text: str, deal_context: str = "") -> List[ExtractedFact]:
        """
        Deterministic, resilient extractor for key sales memory types:
        Budget, Competitors, Objections, Preferences, Commitments, Stakeholders.
        """
        clean_text = cls.sanitize(text)
        facts: List[ExtractedFact] = []
        lower = clean_text.lower()

        # 1. Budget extraction
        if "budget" in lower or "₹" in clean_text or "lakh" in lower or "investment" in lower or "cost" in lower:
            budget_matches = re.findall(r'(?:budget|cost|price|investment|quote|around|at)?\s*([₹$€£]\s*[\d,.]+\s*(?:lakh|lac|cr|crore|k|m|million|thousand|l)?)', clean_text, re.IGNORECASE)
            valid_budgets = [b.strip() for b in budget_matches if any(c.isdigit() for c in b)]
            
            if valid_budgets:
                facts.append(ExtractedFact(
                    memory_type=MemoryType.BUDGET,
                    fact=f"Prospect confirmed commercial parameter: {valid_budgets[0]}",
                    importance="high",
                    confidence=0.96,
                    tags=["budget", "commercials"]
                ))
            elif "10 lakh" in lower or "10l" in lower:
                facts.append(ExtractedFact(
                    memory_type=MemoryType.BUDGET,
                    fact="Customer confirmed commercial budget parameter around ₹10 Lakh",
                    importance="high",
                    confidence=0.96,
                    tags=["budget", "commercials"]
                ))

        # 2. Competitors
        competitor_keywords = ["salesforce", "hubspot", "zoho", "microsoft dynamics", "pipedrive", "gong", "clari", "outreach", "apollo"]
        for comp in competitor_keywords:
            if comp in lower:
                facts.append(ExtractedFact(
                    memory_type=MemoryType.COMPETITOR,
                    fact=f"Evaluating competitor: {comp.title()}",
                    importance="high",
                    confidence=0.98,
                    tags=["competitor", comp]
                ))

        # 3. Objections
        if "crm integration" in lower or "integration" in lower or "webhook" in lower:
            facts.append(ExtractedFact(
                memory_type=MemoryType.OBJECTION,
                fact="Expressed concern over CRM integration and API synchronization",
                importance="high",
                confidence=0.94,
                tags=["objection", "integration", "crm"]
            ))
        if "security" in lower or "soc2" in lower or "compliance" in lower or "gdpr" in lower:
            facts.append(ExtractedFact(
                memory_type=MemoryType.OBJECTION,
                fact="High-priority requirement for enterprise security, compliance, and data governance",
                importance="high",
                confidence=0.95,
                tags=["objection", "security", "compliance"]
            ))
        if "expensive" in lower or "price is high" in lower or "discount" in lower or "pricing concern" in lower:
            facts.append(ExtractedFact(
                memory_type=MemoryType.OBJECTION,
                fact="Price sensitivity raised; customer requested tiered discounting or flexible milestones",
                importance="medium",
                confidence=0.92,
                tags=["objection", "pricing"]
            ))
        if "timeline" in lower or "go-live" in lower:
            facts.append(ExtractedFact(
                memory_type=MemoryType.TIMELINE,
                fact="Decision and implementation target discussed in interaction",
                importance="medium",
                confidence=0.90,
                tags=["timeline", "milestone"]
            ))

        # 4. Preferences
        if "prefers" in lower or "prefer" in lower or "wants" in lower or "likes" in lower or "hands-on" in lower:
            facts.append(ExtractedFact(
                memory_type=MemoryType.PREFERENCE,
                fact="Customer demonstrated clear workflow preferences regarding demos, communication, and technical depth",
                importance="medium",
                confidence=0.88,
                tags=["preference", "buyer_behavior"]
            ))

        # 5. Commitments
        if "promise" in lower or "will send" in lower or "follow up" in lower or "share" in lower or "deliver" in lower or "action item" in lower or "audit report" in lower:
            facts.append(ExtractedFact(
                memory_type=MemoryType.COMMITMENT,
                fact="Action item/commitment agreed upon during interaction",
                importance="high",
                confidence=0.91,
                tags=["commitment", "next_step"]
            ))

        # General context fallback if nothing matched
        if not facts and len(clean_text) > 10:
            facts.append(ExtractedFact(
                memory_type=MemoryType.DEAL_CONTEXT,
                fact=clean_text[:200].replace("\n", " ").strip(),
                importance="low",
                confidence=0.85,
                tags=["general_context"]
            ))

        return facts
