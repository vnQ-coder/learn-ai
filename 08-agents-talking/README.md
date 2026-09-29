# 08 — Agents Talking (Agent-to-Agent Negotiation)

**Scenario:** a trip-planner agent and a separate budget-checker agent
(its own local HTTP server) negotiate a trip cost back and forth.

**Concept:** a real agent-to-agent protocol — structured JSON messages
over HTTP between independent services, with a
propose -> counter-offer -> revised-propose loop and a hard round
limit, not a single request/response.

**Run:**
```bash
python main.py
```

**Expected output:** a printed round-by-round transcript of proposals
and counter-offers, ending in either "Agreement reached at $X after N
round(s)" or "No agreement reached after N rounds" if the cutoff hits
first.
