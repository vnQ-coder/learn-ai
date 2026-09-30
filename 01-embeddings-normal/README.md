# 01 — Embeddings: Normal (TF-IDF Keyword Search)

**Scenario:** a support-ticket search box that ranks tickets purely by
literal word overlap (TF-IDF + cosine similarity) — the same technique
behind most out-of-the-box "search" boxes.

**Concept:** TF-IDF only "sees" shared tokens. A query like `"I was
billed two times"` scores 0.0 against the ticket "Charged twice for
the same order, need the extra charge reversed" because none of the
query's words literally appear in that ticket, even though a human
would call that an obvious match.

**Run:**
```bash
python main.py
```

**Expected output:** for each of the 4 test queries, the top-3 ranked
tickets with similarity scores. All 4 queries are genuine paraphrases
with zero literal token overlap with their intended ticket, so every
one shows a top score of 0.000, marked `MISS (score ~0)` — this is the
literal-match ceiling module 02 fixes.
