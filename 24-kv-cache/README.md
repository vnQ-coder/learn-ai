# 24 — KV Cache

Simulates the compute and memory tradeoff of KV caching during
autoregressive generation. Without a cache, generating token `t` naively
recomputes Key/Value work for all `t` tokens produced so far — total work
across generating N tokens grows `O(N^2)`. With a cache, each step only
computes K/V for the one new token, so total work grows `O(N)` instead. The
cache's memory footprint grows linearly with sequence length.

Pure arithmetic — no PyTorch, no Gemini API call.

Run directly:

```
python main.py
```
