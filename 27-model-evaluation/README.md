# 27 — Model Evaluation

A lightweight automated eval harness: a fixed set of 5 question / expected-keyword
pairs runs through Gemini one at a time. Each response is checked for whether it
contains all expected keywords (case-insensitive substring match), and an overall
pass rate is computed.

This demonstrates the basic pattern behind regression-testing an LLM-powered
feature: instead of eyeballing a handful of outputs, you run a repeatable suite
and track a score over time.

Run directly:

```bash
python main.py
```

Requires `GEMINI_API_KEY` to be set.
