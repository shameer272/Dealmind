# Hindsight Memory Design & Ingestion Pipeline

## 1. Why Hindsight?

Standard LLMs suffer from context window limitations, high token costs, and loss of nuanced historical facts across long B2B sales cycles (typically 3 to 9 months with 15+ interactions).

Hindsight provides:
1. **Targeted Extraction**: Rather than storing raw transcripts verbatim, Hindsight extracts structured facts and observations.
2. **TEMPR Multi-Strategy Retrieval**: Parallel execution of semantic search, keyword matching, temporal filtering, and graph traversal.
3. **Synthesis & Reflection**: Ability to reflect across historical observations to identify systemic deal blockers.

## 2. Ingestion Pipeline

```text
[Sales Rep enters interaction]
              ↓
[Input Sanitization: Strip passwords, auth tokens, PCI data]
              ↓
[Structured Fact Extraction (Rule & Semantic)]
              ↓
[Hindsight Retain Primitive (bank_id: deal_{deal_id})]
              ↓
[Hindsight updates memory graph & indexes]
              ↓
[UI displays immediate feedback: "AI learned X new facts"]
```

## 3. Retain vs Recall vs Reflect

- **`retain(bank_id, content, context, metadata)`**: Invoked after every interaction, meeting, or email. Stores distilled insights with importance tags (`critical`, `high`, `medium`).
- **`recall(bank_id, query, top_k, filters)`**: Executed before every AI generation to bring relevant historical context into the prompt.
- **`reflect(bank_id, query)`**: Synthesizes deal health and objection patterns across the entire lifespan of the account.
