# 20 — Attention Mechanism

Implements real scaled dot-product self-attention (Query/Key/Value
projections, `softmax(QK^T/√d_k)V`) over a short sentence using PyTorch,
and returns the resulting attention weight matrix.

Unlike modules 01-19, this does not call the Gemini API — it's pure
tensor math, run locally. No `GEMINI_API_KEY` needed.

Run directly:

```
python main.py
```
