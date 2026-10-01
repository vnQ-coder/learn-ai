# 14 — Plan-and-Execute Architecture

**Scenario:** given a goal, the agent writes a complete plan up front —
a short numbered list of steps — then executes each step in order,
carrying forward context from earlier steps, and finally synthesizes
everything into one answer.

**Concept:** plan-and-execute, contrasted with module 13's ReAct loop.
ReAct decides its next move reactively, one observation at a time.
Plan-and-execute commits to a full sequence of steps before doing any
work, which is more predictable and auditable (the whole plan is
visible up front) but less able to adapt mid-task if something
unexpected comes up.

**Run:**
```bash
export GEMINI_API_KEY=...
python main.py
```

**Expected output:** a printed plan (3-4 steps), the result of executing
each step in turn, and a final synthesized answer that draws on all of
them.
