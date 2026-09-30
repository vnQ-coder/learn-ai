"""Module 06: evaluating RAG answers for the module 05 pipeline.

Scenario: grading the module 05 doc bot's answers for hallucination
and refusing to answer when retrieval is too weak.
"""
import glob
import os
import sys

import numpy as np
from google import genai
from rank_bm25 import BM25Okapi
from sentence_transformers import SentenceTransformer

MODEL = "gemini-2.5-flash"

# --- duplicated from module 05 (intentional; modules stay independent) ---

def load_markdown_files(root: str) -> list[tuple[str, str]]:
    paths = glob.glob(os.path.join(root, "**", "*.md"), recursive=True)
    docs = []
    for p in paths:
        with open(p, "r", errors="ignore") as f:
            docs.append((p, f.read()))
    return docs


def chunk_text(path: str, text: str, chunk_size: int = 500, overlap: int = 100):
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        piece = text[start:end].strip()
        if piece:
            chunks.append({"source": path, "text": piece})
        start += chunk_size - overlap
    return chunks


def build_index(chunks: list[dict], model: SentenceTransformer):
    texts = [c["text"] for c in chunks]
    embeddings = model.encode(texts, normalize_embeddings=True)
    bm25 = BM25Okapi([t.lower().split() for t in texts])
    return embeddings, bm25


def hybrid_search(query, chunks, embeddings, bm25, model, top_k=5):
    q_emb = model.encode([query], normalize_embeddings=True)[0]
    vector_scores = embeddings @ q_emb  # raw cosine similarity, not re-scaled per query
    bm25_scores = np.array(bm25.get_scores(query.lower().split()))
    def norm(x):
        rng = x.max() - x.min()
        return (x - x.min()) / rng if rng > 0 else np.zeros_like(x)
    combined = 0.5 * norm(vector_scores) + 0.5 * norm(bm25_scores)
    ranked_idx = np.argsort(combined)[::-1][:top_k]
    return [
        {**chunks[i], "score": float(combined[i]), "raw_vector_score": float(vector_scores[i])}
        for i in ranked_idx
    ]

# --- new evaluation logic ---

# Per-query min-max normalization in hybrid_search always stretches the
# top hit's combined "score" toward 1.0 even when nothing in the corpus
# is relevant, so abstention must check the raw (non-normalized) cosine
# similarity instead.
RAW_VECTOR_CONFIDENCE_FLOOR = 0.3


def check_claims_supported(client: genai.Client, answer: str, retrieved: list[dict]) -> tuple[bool, str]:
    context = "\n\n".join(f"[{i+1}] {c['text']}" for i, c in enumerate(retrieved))
    prompt = (
        "You are a strict fact-checker. Given the SOURCES and the ANSWER, "
        "reply with exactly 'SUPPORTED' if every claim in the answer is "
        "backed by the sources, or 'UNSUPPORTED: <reason>' if any claim "
        "is not backed by the sources.\n\n"
        f"SOURCES:\n{context}\n\nANSWER:\n{answer}"
    )
    resp = client.models.generate_content(model=MODEL, contents=prompt)
    verdict = (resp.text or "").strip()
    normalized = verdict.strip("*").upper()
    return normalized.startswith("SUPPORTED"), verdict


def answer_with_guardrails(client: genai.Client, question: str, retrieved: list[dict]) -> str:
    if not retrieved or max(c["raw_vector_score"] for c in retrieved) < RAW_VECTOR_CONFIDENCE_FLOOR:
        return "REFUSED: retrieval confidence too low to answer safely."

    context = "\n\n".join(f"[{i+1}] {c['text']}" for i, c in enumerate(retrieved))
    prompt = (
        "Answer the question using ONLY the numbered sources below, "
        "citing [1], [2] inline.\n\n"
        f"Sources:\n{context}\n\nQuestion: {question}"
    )
    resp = client.models.generate_content(model=MODEL, contents=prompt)
    answer = resp.text or ""

    supported, verdict = check_claims_supported(client, answer, retrieved)
    if not supported:
        return f"REFUSED: answer failed fact-check ({verdict})"
    return answer


TEST_QUESTIONS = [
    "how is the curriculum organized?",
    "what is the airspeed velocity of an unladen swallow?",  # intentionally unanswerable from repo docs
]


def main():
    if len(sys.argv) < 2:
        print("Usage: python main.py <markdown_folder>")
        sys.exit(1)
    if not os.environ.get("GEMINI_API_KEY"):
        print("ERROR: set GEMINI_API_KEY to run this module.")
        sys.exit(1)

    folder = sys.argv[1]
    docs = load_markdown_files(folder)
    if not docs:
        print(f"No markdown files found under {folder}")
        sys.exit(1)

    chunks = [c for path, text in docs for c in chunk_text(path, text)]
    if not chunks:
        print(f"No chunks produced from markdown files under {folder}")
        sys.exit(1)

    model = SentenceTransformer("all-MiniLM-L6-v2")
    embeddings, bm25 = build_index(chunks, model)
    client = genai.Client()

    for q in TEST_QUESTIONS:
        retrieved = hybrid_search(q, chunks, embeddings, bm25, model)
        print(f"\nQuestion: {q}")
        print(f"  top raw_vector_score: {retrieved[0]['raw_vector_score']:.3f}" if retrieved else "  no chunks retrieved")
        result = answer_with_guardrails(client, q, retrieved)
        print(f"  Result: {result}")


if __name__ == "__main__":
    main()
