# 06 — RAG Evaluation & Guardrails

**Scenario:** grading the module 05 doc bot's own answers before
trusting them.

**Concept:** production RAG needs a second pass checking (a) whether
retrieval was even confident enough to answer from, and (b) whether the
generated answer's claims are actually backed by the retrieved chunks
— refusing rather than hallucinating when either check fails.

**Run:**
```bash
export GEMINI_API_KEY=...
python main.py <path-to-a-folder-of-.md-files>
```

Note: the built-in `TEST_QUESTIONS` include "how is the curriculum
organized?", which only makes sense against a curriculum-style corpus.
Point the folder argument at docs where that question is meaningful —
e.g. this repo itself (`~/Desktop/ai-apps/learning`), since its
top-level and per-module READMEs are real markdown describing how the
curriculum is organized.

**Expected output:** two test questions run automatically — one
answerable from the corpus (gets a real cited answer), one
intentionally unanswerable (gets a `REFUSED: ...` result instead of a
hallucinated answer).
