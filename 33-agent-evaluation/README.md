# Module 33 — Agent Evaluation in Production

Reuses module 07's order-lookup tool-calling agent, but instead of checking
whether the final answer "sounds right," this runs the agent through a small
suite of scenarios chosen to tempt real production failure modes, and scores
its entire **trajectory** — every tool call, with its arguments, how many
times, and whether the final answer is actually grounded in what the tool
returned — not just the final text.

Contrast with:
- Module 27 (Model Evaluation) — checks only the final answer's keywords.
- Module 28 (LLM-as-Judge) — judges the subjective quality of pre-written text.

Neither of those can catch an agent quietly calling a tool twice, or
hallucinating a status for an order that doesn't exist. Only trajectory-level
evaluation does.

Run directly:

```
python main.py
```

Requires `GEMINI_API_KEY` in the environment.
