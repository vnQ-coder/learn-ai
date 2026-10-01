"""Module 18: hybrid search, isolated and explained.

Module 05's production RAG pipeline already uses hybrid search (BM25 +
vector, combined) as an implementation detail buried inside retrieval.
This module pulls that one idea out on its own: run the SAME query
through keyword search alone, vector search alone, and the hybrid
combination, and compare all three rankings side by side so you can see
exactly what each one gets right or wrong, and why combining them wins.

No Gemini call here at all — this module stops at retrieval.
"""
import numpy as np
from rank_bm25 import BM25Okapi
from sentence_transformers import SentenceTransformer

DOCS = [
    "How to cancel your subscription from the billing settings page",
    "Steps to end your recurring plan and stop future charges",
    "Troubleshooting steps for a subscription that won't cancel",
    "How to update your credit card on file for billing",
    "Resetting your account password after a failed login",
    "Exporting your data before closing your account",
    "How to pause a subscription instead of canceling it",
    "Contacting support about a refund for a canceled order",
]


def _norm(x: np.ndarray) -> np.ndarray:
    rng = x.max() - x.min()
    return (x - x.min()) / rng if rng > 0 else np.zeros_like(x)


def bm25_only(query: str, docs: list[str]) -> list[dict]:
    tokenized = [d.lower().split() for d in docs]
    bm25 = BM25Okapi(tokenized)
    scores = bm25.get_scores(query.lower().split())
    order = np.argsort(scores)[::-1]
    return [{"text": docs[i], "score": float(scores[i])} for i in order]


def vector_only(query: str, docs: list[str], model: SentenceTransformer) -> list[dict]:
    embeddings = model.encode(docs, normalize_embeddings=True)
    q_emb = model.encode([query], normalize_embeddings=True)[0]
    scores = embeddings @ q_emb
    order = np.argsort(scores)[::-1]
    return [{"text": docs[i], "score": float(scores[i])} for i in order]


def hybrid(query: str, docs: list[str], model: SentenceTransformer) -> list[dict]:
    """Same min-max-normalize-then-0.5/0.5-combine math as module 05's hybrid_search."""
    tokenized = [d.lower().split() for d in docs]
    bm25 = BM25Okapi(tokenized)
    bm25_scores = np.array(bm25.get_scores(query.lower().split()))

    embeddings = model.encode(docs, normalize_embeddings=True)
    q_emb = model.encode([query], normalize_embeddings=True)[0]
    vector_scores = embeddings @ q_emb

    combined = 0.5 * _norm(vector_scores) + 0.5 * _norm(bm25_scores)
    order = np.argsort(combined)[::-1]
    return [{"text": docs[i], "score": float(combined[i])} for i in order]


def main():
    query = "how do I stop my membership from renewing automatically"
    model = SentenceTransformer("all-MiniLM-L6-v2")

    print(f"Query: {query!r}\n")

    print("=== BM25 only (keyword) ===")
    for r in bm25_only(query, DOCS):
        print(f"  {r['score']:.3f}  {r['text']}")

    print("\n=== Vector only (meaning) ===")
    for r in vector_only(query, DOCS, model):
        print(f"  {r['score']:.3f}  {r['text']}")

    print("\n=== Hybrid (combined) ===")
    for r in hybrid(query, DOCS, model):
        print(f"  {r['score']:.3f}  {r['text']}")


if __name__ == "__main__":
    main()
