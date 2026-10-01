"""Module 22: positional encoding.

Scenario: prove that plain scaled dot-product attention has no sense of
word order (it's permutation-equivariant — shuffle the input, get the
same shuffled output back), then show that adding sinusoidal positional
encoding breaks that symmetry, so a transformer can actually tell "the
cat sat on the mat" apart from "mat the on sat cat the".

Pure tensor math with PyTorch. No LLM calls, no GEMINI_API_KEY needed.
"""
import sys

import torch
import torch.nn.functional as F

TOKENS = ["the", "cat", "sat", "on", "the", "mat"]


def sinusoidal_positional_encoding(seq_len: int, d_model: int) -> torch.Tensor:
    """PE(pos, 2i) = sin(pos / 10000^(2i/d_model)); PE(pos, 2i+1) = cos(...)."""
    position = torch.arange(seq_len, dtype=torch.float32).unsqueeze(1)  # (seq_len, 1)
    i = torch.arange(0, d_model, 2, dtype=torch.float32)  # (d_model/2,)
    div_term = torch.pow(10000.0, i / d_model)  # 10000^(2i/d_model)

    pe = torch.zeros(seq_len, d_model)
    pe[:, 0::2] = torch.sin(position / div_term)
    pe[:, 1::2] = torch.cos(position / div_term)
    return pe


def simple_attention(embeddings: torch.Tensor, w_q: torch.Tensor, w_k: torch.Tensor, w_v: torch.Tensor) -> torch.Tensor:
    """One-head scaled dot-product self-attention, using the given (shared) weights."""
    d_model = embeddings.shape[-1]
    q = embeddings @ w_q
    k = embeddings @ w_k
    v = embeddings @ w_v
    scores = q @ k.T / (d_model ** 0.5)
    weights = F.softmax(scores, dim=-1)
    return weights @ v


def compute_demo(d_model: int = 16) -> dict:
    torch.manual_seed(42)

    embeddings = torch.randn(len(TOKENS), d_model)
    w_q = torch.randn(d_model, d_model)
    w_k = torch.randn(d_model, d_model)
    w_v = torch.randn(d_model, d_model)

    perm = [2, 0, 4, 1, 5, 3]
    inverse_perm = [perm.index(i) for i in range(len(perm))]

    # Without positional encoding: attention is permutation-equivariant.
    out_orig = simple_attention(embeddings, w_q, w_k, w_v)
    out_shuffled = simple_attention(embeddings[perm], w_q, w_k, w_v)
    out_shuffled_unpermuted = out_shuffled[inverse_perm]
    diff_without_pe = (out_orig - out_shuffled_unpermuted).abs().mean().item()

    # With positional encoding: position is baked into the representation.
    pe = sinusoidal_positional_encoding(len(TOKENS), d_model)
    embeddings_with_pe = embeddings + pe
    out_orig_pe = simple_attention(embeddings_with_pe, w_q, w_k, w_v)
    out_shuffled_pe = simple_attention(embeddings[perm] + pe, w_q, w_k, w_v)
    out_shuffled_pe_unpermuted = out_shuffled_pe[inverse_perm]
    diff_with_pe = (out_orig_pe - out_shuffled_pe_unpermuted).abs().mean().item()

    return {
        "tokens": TOKENS,
        "pe_matrix": [[round(v, 4) for v in row] for row in pe.tolist()],
        "diff_without_pe": round(diff_without_pe, 6),
        "diff_with_pe": round(diff_with_pe, 6),
    }


def main():
    result = compute_demo()

    print("Positional encoding matrix (position x dimension):")
    for pos, row in enumerate(result["pe_matrix"]):
        formatted = "  ".join(f"{v:+.3f}" for v in row)
        print(f"  pos {pos}: {formatted}")

    print(f"\nOutput difference WITHOUT positional encoding: {result['diff_without_pe']:.6f}")
    print(f"Output difference WITH positional encoding:    {result['diff_with_pe']:.6f}")

    if result["diff_with_pe"] > result["diff_without_pe"]:
        if result["diff_without_pe"] < 1e-5:
            comparison = "an essentially exact match (0.000000) — attention is provably blind to order"
        else:
            ratio = result["diff_with_pe"] / result["diff_without_pe"]
            comparison = f"a {ratio:.1f}x larger difference"
        print(
            f"\nWithout positional encoding, shuffling word order barely changes the "
            f"(un-shuffled) output — attention doesn't notice order ({comparison}). With "
            f"positional encoding, the same shuffle produces a meaningfully different "
            f"output ({result['diff_with_pe']:.6f}) — order now matters."
        )
    else:
        print("\nWARNING: expected diff_with_pe > diff_without_pe but it wasn't — check the implementation.")
        sys.exit(1)


if __name__ == "__main__":
    main()
