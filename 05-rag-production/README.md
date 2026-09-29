# 05 — Production RAG (Hybrid Search + Citations)

**Scenario:** a documentation Q&A bot over real markdown files from one
of your own repos — not synthetic text.

**Concept:** production RAG is chunking + hybrid retrieval (BM25
keyword search combined with vector similarity, since either alone
misses cases the other catches) + a generation step that's forced to
cite its sources and admit when retrieval was weak.

**Run:**
```bash
export GEMINI_API_KEY=...
python main.py <path-to-a-folder-of-.md-files> "your question"
```

**Expected output:** a list of retrieved chunks with combined
BM25+vector scores, then a final answer citing `[1]`, `[2]` etc. back
to those chunks. A question unrelated to the corpus should return "I
don't have enough relevant information..." instead of a made-up answer.
