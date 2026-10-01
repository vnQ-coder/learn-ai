"""Module 20: the attention mechanism, implemented by hand with real tensors.

Scenario: run scaled dot-product self-attention on a short sentence and
look at the resulting attention weight matrix — which word "attends to"
which other word, and how strongly.

This module is different from 01-19: it's pure math, not an LLM API call.
No GEMINI_API_KEY is needed anywhere here.

Formula (Vaswani et al., "Attention Is All You Need"):
    scores  = Q @ K^T / sqrt(d_k)
    weights = softmax(scores, dim=-1)
    output  = weights @ V
"""
import torch
import torch.nn.functional as F

TOKENS = ["the", "cat", "sat", "on", "the", "mat"]

# Fixed seed so the demo is reproducible run to run instead of looking
# different (and potentially confusing) on every single request.
_SEED = 42


def _round(matrix: list[list[float]], ndigits: int = 4) -> list[list[float]]:
    return [[round(v, ndigits) for v in row] for row in matrix]


def compute_attention(d_model: int = 16) -> dict:
    torch.manual_seed(_SEED)

    n = len(TOKENS)
    embeddings = torch.randn(n, d_model)
    w_q = torch.randn(d_model, d_model)
    w_k = torch.randn(d_model, d_model)
    w_v = torch.randn(d_model, d_model)

    q = embeddings @ w_q
    k = embeddings @ w_k
    v = embeddings @ w_v

    scores = q @ k.T / (d_model ** 0.5)
    weights = F.softmax(scores, dim=-1)
    output = weights @ v

    return {
        "tokens": TOKENS,
        "weights": _round(weights.tolist()),
        "output_shape": list(output.shape),
    }


def main():
    result = compute_attention()
    tokens = result["tokens"]
    weights = result["weights"]

    print(f"Tokens: {tokens}")
    print(f"Output shape: {result['output_shape']}\n")

    header = "        " + "".join(f"{t:>8}" for t in tokens)
    print(header)
    for i, row in enumerate(weights):
        row_str = "".join(f"{v:8.4f}" for v in row)
        print(f"{tokens[i]:>8}{row_str}")
        row_sum = sum(row)
        assert abs(row_sum - 1.0) < 1e-4, f"row {i} does not sum to 1.0 (got {row_sum})"

    print("\nAll rows sum to ~1.0, confirming softmax normalized each query's attention.")

    # Find, for one interesting row, which non-self token it attends to most.
    row_idx = 1  # "cat"
    row = weights[row_idx]
    best_j, best_v = None, -1.0
    for j, v in enumerate(row):
        if j != row_idx and v > best_v:
            best_j, best_v = j, v
    print(
        f"\n'{tokens[row_idx]}' attends most strongly (besides itself) to "
        f"'{tokens[best_j]}' with weight {best_v:.4f}."
    )


if __name__ == "__main__":
    main()
