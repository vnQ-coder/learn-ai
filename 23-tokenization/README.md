# 23 — Tokenization

Shows a real WordPiece tokenizer (`sentence-transformers/all-MiniLM-L6-v2`'s
tokenizer, same BERT-style vocabulary used elsewhere in this curriculum)
breaking text into subword pieces, contrasted with naive whitespace
splitting — making concrete why "tokens" aren't the same as "words".

Run directly:

```
python main.py
```

No `GEMINI_API_KEY` needed — this module is pure local tokenization, no
LLM call.
