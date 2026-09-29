# DealMind API Documentation

Base URL: `http://localhost:8000/api`

## Health & Status
### `GET /api/health`
Returns system status and Hindsight memory engine connection status.
```json
{
  "status": "healthy",
  "service": "DealMind AI Backend",
  "hindsight": {
    "status": "connected",
    "url": "http://localhost:8888",
    "engine": "Hindsight Production"
  }
}
```

## Deals
### `GET /api/deals`
Returns list of all active opportunities with company details.

### `GET /api/deals/{id}`
Returns full opportunity profile including contacts, historical interactions, and tasks.

### `POST /api/deals`
Creates a new deal.

## Interactions & Hindsight Ingestion
### `GET /api/deals/{id}/interactions`
Returns chronological interaction records for the deal.

### `POST /api/deals/{id}/interactions`
Ingests an interaction into the database, invokes the agent to extract structured facts, and retains them into the deal's Hindsight bank.
**Request Body:**
```json
{
  "type": "Meeting",
  "title": "Technical CRM Webhook Deep Dive",
  "content": "Vikram stated our biggest concern is CRM integration latency.",
  "participants": "Vikram Rao, Rep",
  "outcome": "Walked through sandbox connector.",
  "next_steps": "Send API documentation."
}
```
**Response:**
```json
{
  "interaction": { "id": "int_..." },
  "analysis": {
    "summary": "...",
    "extracted_facts": [
      {
        "memory_type": "OBJECTION",
        "fact": "Expressed concern over CRM integration and API synchronization",
        "importance": "high"
      }
    ]
  },
  "memories_learned": 1
}
```

## Hindsight Memory
### `GET /api/deals/{id}/memory`
Retrieves all structured memories retained in Hindsight for the deal.

### `POST /api/deals/{id}/memory/search`
Queries the Hindsight bank using TEMPR multi-strategy search.

## AI Sales Intelligence
### `POST /api/ai/meeting-brief`
Generates comprehensive meeting brief with Customer Snapshot, Care-Abouts, Objections, Competitor Counter-Strategy, Talking Points, Risks, and Hindsight Memory Sources.

### `POST /api/ai/follow-up`
Generates personalized follow-up email incorporating historical commitments and objections.

### `POST /api/ai/objection-analysis`
Returns objection radar breakdown with occurrences, sales responses, and AI counter-strategies.

### `POST /api/ai/deal-health`
Returns explainable health score (0-100) grounded in verified Hindsight signals.

### `POST /api/ai/memory-impact`
Executes side-by-side comparison: Without Hindsight Memory vs With Hindsight Memory.

## Search & Analytics
### `GET /api/search?q={query}`
Global search across deals, companies, interactions, and Hindsight memories.

### `GET /api/analytics/memory-growth`
Returns empirical memory growth curve across historical interactions.
