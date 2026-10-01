# 17 — Knowledge Graph

Extracts a small knowledge graph (subject-predicate-object triples) from a
short paragraph using Gemini structured output, then answers a question that
requires multi-hop graph traversal — following explicit relationships rather
than retrieving text that merely *looks* similar to the question.

Contrast with module 05 (vector RAG, retrieves chunks by similarity) and
module 02 (semantic embedding search): here, the answer can depend on facts
that share no vocabulary with the question at all. Only the graph structure
connects them.

Run standalone:

```
export GEMINI_API_KEY=...
python main.py
```
