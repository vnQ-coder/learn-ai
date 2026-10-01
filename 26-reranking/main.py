"""Module 26: reranking — a two-stage retrieval pipeline.

Stage 1 (fast, approximate): vector search over a small corpus casts a
wide net quickly but imperfectly ranked.
Stage 2 (slow, accurate): an LLM judge rescans just the top candidates
and reorders them by true relevance.

Scenario: a support-ticket search where the initial vector ranking is
plausible but not quite right, and reranking fixes the order.
"""
import os
import re
import sys

from google import genai
from sentence_transformers import SentenceTransformer

MODEL = "gemini-2.5-flash"

DOCS = [
    "How to dispute an incorrect charge on your billing statement",
    "Updating your saved payment method before your next billing cycle",
    "Why you were charged twice for the same subscription this month",
    "Troubleshooting failed login attempts on your account",
    "How to request a refund when your order total was wrong",
    "Setting up two-factor authentication for extra account security",
    "Understanding the line items on your monthly invoice",
    "Canceling an order before it ships to avoid being charged",
]


def initial_retrieve(query: str, top_k: int = 5) -> list[dict]:
    model = SentenceTransformer("all-MiniLM-L6-v2")
    embeddings = model.encode(DOCS, normalize_embeddings=True)
    q_emb = model.encode([query], normalize_embeddings=True)[0]
    scores = embeddings @ q_emb
    order = scores.argsort()[::-1][:top_k]
    return [{"text": DOCS[i], "vector_score": round(float(scores[i]), 4)} for i in order]


def _parse_score(text: str) -> int:
    match = re.search(r"\d+", text.strip())
    if not match:
        return 0
    return max(0, min(10, int(match.group())))


def rerank(client: genai.Client, query: str, candidates: list[dict]) -> list[dict]:
    scored = []
    for c in candidates:
        prompt = (
            f"On a scale of 0 to 10, how relevant is this document to the question "
            f"'{query}'? Document: {c['text']}\n\n"
            "Respond with ONLY a single integer 0-10, nothing else."
        )
        resp = client.models.generate_content(model=MODEL, contents=prompt)
        score = _parse_score(resp.text or "0")
        scored.append({**c, "rerank_score": score})
    scored.sort(key=lambda d: d["rerank_score"], reverse=True)
    return scored


def main():
    if not os.environ.get("GEMINI_API_KEY"):
        print("ERROR: set GEMINI_API_KEY to run this module.")
        sys.exit(1)

    query = "how do I stop being double billed"

    print(f"Query: {query!r}\n")
    initial = initial_retrieve(query)
    print("=== Initial order (vector search) ===")
    for i, r in enumerate(initial):
        print(f"  {i + 1}. [{r['vector_score']:.3f}] {r['text']}")

    client = genai.Client()
    reranked = rerank(client, query, initial)
    print("\n=== Reranked order (LLM judge) ===")
    for i, r in enumerate(reranked):
        print(f"  {i + 1}. [score={r['rerank_score']}] {r['text']}")

    initial_order = [r["text"] for r in initial]
    reranked_order = [r["text"] for r in reranked]
    moved = max(
        reranked_order,
        key=lambda t: abs(initial_order.index(t) - reranked_order.index(t)),
    )
    delta = initial_order.index(moved) - reranked_order.index(moved)
    direction = "up" if delta > 0 else "down" if delta < 0 else "not at all"
    print(f"\n'{moved}' moved {direction} by {abs(delta)} position(s) after reranking.")


if __name__ == "__main__":
    main()
