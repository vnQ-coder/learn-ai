# 25 — Quantization

Takes a batch of real `float32` weights, quantizes them to `int8` using
affine (linear) quantization, then dequantizes back to float. Shows the
resulting memory reduction (4x) and per-value rounding error.

```bash
python3 main.py
```

No `GEMINI_API_KEY` required — this is a pure local PyTorch computation,
no LLM call involved.
