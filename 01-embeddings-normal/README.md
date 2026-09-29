# 01 — Embeddings: Normal (TF-IDF Keyword Search)

**Scenario:** a support-ticket search box that ranks tickets purely by
literal word overlap (TF-IDF + cosine similarity) — the same technique
behind most out-of-the-box "search" boxes.

**Concept:** TF-IDF only "sees" shared tokens. A query like `"cancel my
order"` scores near zero against the ticket "Cancel my subscription
immediately, I was double charged" if the exact words don't line up
well enough, even though a human would call that an obvious match.

**Run:**
```bash
python main.py
```

**Expected output:** for each of the 4 test queries, the top-3 ranked
tickets with similarity scores. At least two queries (`"cancel my
order"`, `"money taken twice"`) will show top scores near 0.0, marked
`MISS (score ~0)` — this is the literal-match ceiling module 02 fixes.
