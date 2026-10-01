# 22 — Positional Encoding

**Scenario:** prove that plain scaled dot-product attention has no
sense of word order, then show that adding sinusoidal positional
encoding fixes that.

**Concept:** attention is permutation-equivariant — shuffle the input
tokens and you get back the same outputs, just shuffled to match.
Adding positional encoding (`PE(pos, 2i) = sin(pos / 10000^(2i/d))`,
`PE(pos, 2i+1) = cos(...)`) to each token's embedding before attention
breaks that symmetry, since position is now baked into the
representation itself.

**Run:**
```bash
python main.py
```

**Expected output:** the positional encoding matrix, then two
"output difference" numbers from the same shuffle test — the one
without positional encoding should be essentially 0.000000 (proving
attention alone can't tell order apart), and the one with positional
encoding should be clearly, meaningfully larger.
