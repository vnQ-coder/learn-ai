"""Module 21: multi-head (QKV) attention, built on module 20's single-head
scaled dot-product attention.

Instead of running one attention calculation over the full embedding, the
embedding dimension is split into several smaller "heads". Each head gets
its own learned Q/K/V projections and computes attention independently, so
each head can specialize in a different kind of relationship between
tokens. The heads' outputs are concatenated and passed through one final
output projection to mix the information back together.

This module is a standalone, from-scratch PyTorch demonstration. It makes
no network calls and needs no API key.
"""
import math

import torch
import torch.nn.functional as F

torch.manual_seed(42)

TOKENS = ["the", "cat", "sat", "on", "the", "mat"]


def _round_matrix(matrix: torch.Tensor, decimals: int = 4) -> list[list[float]]:
    return [[round(v, decimals) for v in row] for row in matrix.tolist()]


def compute_multi_head_attention(d_model: int = 16, num_heads: int = 4) -> dict:
    if d_model % num_heads != 0:
        raise ValueError("d_model must be divisible by num_heads")
    d_head = d_model // num_heads

    embeddings = torch.randn(len(TOKENS), d_model)

    head_outputs = []
    per_head_weights = []
    for _ in range(num_heads):
        w_q = torch.randn(d_model, d_head)
        w_k = torch.randn(d_model, d_head)
        w_v = torch.randn(d_model, d_head)

        q_h = embeddings @ w_q
        k_h = embeddings @ w_k
        v_h = embeddings @ w_v

        scores_h = q_h @ k_h.T / math.sqrt(d_head)
        weights_h = F.softmax(scores_h, dim=-1)
        head_output_h = weights_h @ v_h

        head_outputs.append(head_output_h)
        per_head_weights.append(_round_matrix(weights_h))

    concatenated = torch.cat(head_outputs, dim=-1)
    w_o = torch.randn(d_model, d_model)
    final_output = concatenated @ w_o

    return {
        "tokens": TOKENS,
        "num_heads": num_heads,
        "per_head_weights": per_head_weights,
        "output_shape": list(final_output.shape),
    }


def _strongest_off_diagonal(weights: list[list[float]]) -> tuple[int, int, float]:
    """Finds the (query_idx, key_idx, value) with the highest weight,
    ignoring a token attending to itself (the diagonal)."""
    best = (0, 0, -1.0)
    for i, row in enumerate(weights):
        for j, val in enumerate(row):
            if i != j and val > best[2]:
                best = (i, j, val)
    return best


def main():
    result = compute_multi_head_attention()
    tokens = result["tokens"]
    per_head_weights = result["per_head_weights"]

    for h, weights in enumerate(per_head_weights):
        print(f"\n--- Head {h} ---")
        header = "        " + " ".join(f"{t:>6}" for t in tokens)
        print(header)
        for i, row in enumerate(weights):
            row_str = " ".join(f"{v:6.4f}" for v in row)
            print(f"{tokens[i]:>7} {row_str}")

    def label(idx: int) -> str:
        word = tokens[idx]
        # disambiguate repeated words (e.g. two "the"s) by position
        return f"{word}[{idx}]" if tokens.count(word) > 1 else word

    q0, k0, v0 = _strongest_off_diagonal(per_head_weights[0])
    q1, k1, v1 = _strongest_off_diagonal(per_head_weights[1])
    print(
        f"\nHead 0's strongest non-self attention is '{label(q0)}' -> '{label(k0)}' "
        f"(weight={v0:.4f}), while head 1's strongest is '{label(q1)}' -> '{label(k1)}' "
        f"(weight={v1:.4f}) — different heads, different attention patterns, "
        "even though every head is looking at the exact same sentence."
    )


if __name__ == "__main__":
    main()
