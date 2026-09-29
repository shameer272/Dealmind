# DealMind Sales Intelligence Agent Design

## 1. Agent Architecture

The DealMind Sales Agent is not a passive conversational chatbot. It is a proactive sales copilot equipped with specialized cognitive tools:

1. `search_deal_memory(deal_id, query)`: Multi-vector search across Hindsight memory bank.
2. `get_deal_context(deal_id)`: Multi-dimensional extraction of customer profile, budget, timeline, and preferences.
3. `analyze_interaction(interaction_text)`: Identifies objections, competitor mentions, and commitments.
4. `generate_meeting_brief(deal_id, objective)`: Prepares the representative with personalized talking points and risk factors.
5. `generate_follow_up(deal_id, tone)`: Produces personalized correspondence citing past commitments.
6. `get_deal_health(deal_id)`: Computes an explainable score grounded in historical evidence.

## 2. Explainability & "Why?"

Trust is paramount in enterprise sales. Every recommendation produced by the agent surfaces its **Hindsight Memory Sources**:
- The exact interaction where the fact was learned.
- The date and stakeholders involved.
- The confidence and severity rating.
