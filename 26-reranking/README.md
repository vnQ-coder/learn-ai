# Module 26 — Reranking

A two-stage retrieval pipeline: fast, approximate vector search retrieves
a shortlist, then a slower, more accurate LLM judge rescans just that
shortlist and reorders it by true relevance.

Run standalone:

```
python main.py
```

Requires `GEMINI_API_KEY` set in the environment (the rerank step calls
Gemini; the initial vector-search step does not).
