# 11 — Observability & Tracing

Re-runs a small retrieve-then-generate pipeline, but wraps every step in a
**span** recording its name, start time, duration, an estimated token
count, and an estimated cost — the same instrumentation production AI
systems use to debug latency and track cost.

Run standalone:

```
GEMINI_API_KEY=... python main.py
```
