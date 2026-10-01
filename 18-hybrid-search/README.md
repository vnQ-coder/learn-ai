# 18 — Hybrid Search Explained

Module 05's production RAG pipeline uses hybrid search (BM25 + vector,
combined) as an implementation detail inside retrieval. This module pulls
that one idea out and isolates it: the same query is run through BM25
alone, vector search alone, and the hybrid combination, so you can see
each ranking side by side.

Run directly:

```
python main.py
```

No `GEMINI_API_KEY` needed — this module does pure retrieval, no
generation call.
