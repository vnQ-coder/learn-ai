"""Module 05: production RAG over real markdown files from a real repo.

Scenario: a documentation Q&A bot over markdown files pulled from one
of your own repos (pass the folder path as argv[1]).

Pipeline: chunk -> embed -> hybrid (BM25 + vector) retrieve -> rerank
by combined score -> generate a cited answer with Gemini.
"""
import glob
import os
import sys

import numpy as np
from google import genai
from rank_bm25 import BM25Okapi
from sentence_transformers import SentenceTransformer

MODEL = "gemini-2.5-flash"


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
    tokenized = [t.lower().split() for t in texts]
    bm25 = BM25Okapi(tokenized)
    return embeddings, bm25


def hybrid_search(query: str, chunks: list[dict], embeddings, bm25, model, top_k=5):
    q_emb = model.encode([query], normalize_embeddings=True)[0]
    vector_scores = embeddings @ q_emb
    bm25_scores = np.array(bm25.get_scores(query.lower().split()))
    # normalize both to 0..1 so they combine fairly
    def norm(x):
        rng = x.max() - x.min()
        return (x - x.min()) / rng if rng > 0 else np.zeros_like(x)
    combined = 0.5 * norm(vector_scores) + 0.5 * norm(bm25_scores)
    ranked_idx = np.argsort(combined)[::-1][:top_k]
    return [
        {**chunks[i], "score": float(combined[i])}
        for i in ranked_idx
    ]


def answer_question(client: genai.Client, question: str, retrieved: list[dict]) -> str:
    if not retrieved or retrieved[0]["score"] < 0.05:
        return "I don't have enough relevant information in the indexed docs to answer that confidently."
    context = "\n\n".join(
        f"[{i+1}] (source: {c['source']})\n{c['text']}" for i, c in enumerate(retrieved)
    )
    prompt = (
        "Answer the question using ONLY the numbered sources below. "
        "Cite sources like [1], [2] inline.\n\n"
        f"Sources:\n{context}\n\nQuestion: {question}"
    )
    resp = client.models.generate_content(model=MODEL, contents=prompt)
    return resp.text


def main():
    if len(sys.argv) < 3:
        print('Usage: python main.py <markdown_folder> "question"')
        sys.exit(1)
    if not os.environ.get("GEMINI_API_KEY"):
        print("ERROR: set GEMINI_API_KEY to run this module.")
        sys.exit(1)

    folder, question = sys.argv[1], sys.argv[2]
    docs = load_markdown_files(folder)
    if not docs:
        print(f"No markdown files found under {folder}")
        sys.exit(1)

    chunks = [c for path, text in docs for c in chunk_text(path, text)]
    model = SentenceTransformer("all-MiniLM-L6-v2")
    embeddings, bm25 = build_index(chunks, model)

    retrieved = hybrid_search(question, chunks, embeddings, bm25, model)
    print("Retrieved chunks:")
    for r in retrieved:
        print(f"  score={r['score']:.3f}  {r['source']}")

    client = genai.Client()
    answer = answer_question(client, question, retrieved)
    print(f"\nAnswer:\n{answer}")


if __name__ == "__main__":
    main()
