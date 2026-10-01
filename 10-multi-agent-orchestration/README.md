# 10 — Multi-Agent Orchestration (Supervisor Pattern)

**Scenario:** a Supervisor agent reads an incoming customer support
request and decides, live, which of three specialist agents (billing,
technical, account) should handle it — then that specialist drafts the
actual reply.

**Concept:** the supervisor/router-agent pattern. Unlike module 09's
fixed researcher -> fact-checker -> writer order, the path taken here is
itself an LLM decision: the same code can route to any of the three
specialists depending on what the request actually says.

**Run:**
```bash
export GEMINI_API_KEY=...
python main.py
```

**Expected output:** a routing decision (billing, technical, or
account) followed by that specialist's reply to the sample refund
request — which should route to billing.
