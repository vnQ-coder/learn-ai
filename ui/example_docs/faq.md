# Frequently Asked Questions

**Why does module 01 sometimes fail to find the right search result?**
Module 01 uses TF-IDF, a keyword-matching technique that only sees
shared words between a query and a document. It cannot recognize that
two different phrasings mean the same thing — that limitation is the
whole point of the lesson, and module 02 fixes it with semantic
embeddings.

**Why do modules 05 and 06 refuse to answer some questions?**
Both modules check how semantically similar the retrieved documents
are to the question before generating an answer. If nothing relevant
was found, they refuse rather than let the model answer from its own
general knowledge, which would not be grounded in this repository's
actual content.

**Do I need an API key to run every module?**
No. Modules 01, 02, 04, and 08 run completely offline. Modules 03, 05,
06, 07, and 09 need a Gemini API key because they call a real language
model.
