# 29 — Vector Databases

Times a brute-force linear scan (numpy) against a real indexed search
(Chroma, backed by HNSW) as the corpus size grows from 1,000 to 100,000
vectors, to show concretely why vector databases exist: brute force
wins at small scale thanks to numpy's vectorization, but the index's
flatter scaling wins out once the corpus gets large.

Run standalone:

```
python main.py
```

No `GEMINI_API_KEY` needed — this module is pure local computation, no
LLM calls.
