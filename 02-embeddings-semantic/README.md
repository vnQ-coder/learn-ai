# 02 — Embeddings: Semantic (Sentence Transformers)

**Scenario:** the same support-ticket search box as module 01, now
backed by a local sentence-transformer model (`all-MiniLM-L6-v2`)
instead of TF-IDF.

**Concept:** semantic embeddings encode meaning, not just tokens, so
`"cancel my order"` correctly matches "Cancel my subscription
immediately, I was double charged" even with zero shared keywords.

**Run:**
```bash
python main.py
```

**Expected output:** for each query, a TF-IDF result line and a
Semantic result line side by side. On the paraphrased queries, the
semantic score is clearly higher and points at the actually-relevant
ticket, printed with a `-> semantic search found a better match` note.
