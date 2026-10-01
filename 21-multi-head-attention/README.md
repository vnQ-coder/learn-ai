# 21 — QKV Attention (Multi-Head)

Builds on module 20's single-head scaled dot-product attention by splitting
the embedding dimension into several independent heads, each with its own
Q/K/V projections. Every head computes attention over the same sentence but
develops its own pattern, since each head's weights are independent. The
heads' outputs are concatenated and passed through one output projection.

Run directly:

```
python main.py
```

No API key required — this is a pure PyTorch tensor demonstration, no
network calls.
