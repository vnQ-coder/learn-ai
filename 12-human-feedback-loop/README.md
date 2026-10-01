# 12 — Human Feedback Loop (Human-in-the-Loop)

**Scenario:** an AI drafts a reply to a customer complaint. A human must
approve it before it's considered sent. If the human rejects it with
feedback, the AI revises the draft incorporating that feedback, and the
loop can repeat.

**Why it matters:** this is the approval-gate pattern that makes agent
deployments safe in production — the agent proposes, a human disposes,
and rejected proposals feed back into the next generation as explicit
feedback rather than being silently discarded.

Run standalone:

```bash
export GEMINI_API_KEY=...
python main.py
```
