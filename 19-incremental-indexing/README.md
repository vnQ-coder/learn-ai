# 19 — Live-Updating Documents (Incremental Indexing)

Every other RAG module in this curriculum treats the document corpus as
static: indexed once, queried forever. Real knowledge bases don't work
that way — documents get added, edited, and deleted continuously.

This module demonstrates **incremental indexing** against a real
persistent vector store (Chroma): adding a document only embeds that one
document, updating a document only re-embeds that one document, and
deleting a document removes it immediately — no full corpus rebuild
required at any point.

Run standalone:

```bash
python main.py
```

This resets the demo index, runs a query, adds a new document and
re-queries to show it's immediately findable, updates an existing
document and re-queries to show the new content (not the old) is what
matches, then deletes a document and re-queries to show it's gone.
