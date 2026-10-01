"""Module 11: observability and tracing for an AI pipeline.

Scenario: re-run a small two-step retrieve-then-generate pipeline, but
wrap every step in a span that records its name, start time, duration,
an estimated token count, and an estimated cost — exactly like
production observability tooling instruments real LLM calls.
"""
import os
import sys
import time

from google import genai

MODEL = "gemini-2.5-flash"

# Small in-memory corpus so retrieval has something real to score against,
# without needing embeddings — this module's subject is tracing, not search.
DOCS = [
    "Embeddings turn text into vectors of numbers; semantic embeddings capture meaning, "
    "while TF-IDF embeddings only capture literal word overlap.",
    "Short-term memory in a chatbot is a sliding window: only the last N turns of "
    "conversation are included in each prompt, and older turns are dropped entirely.",
    "Long-term memory stores facts in a persistent vector database so an assistant can "
    "recall them across completely separate sessions, not just within one conversation.",
    "Production RAG retrieves relevant document chunks with hybrid search (BM25 plus "
    "vector similarity) and asks the model to answer using only those chunks, with citations.",
    "Multi-agent systems split work across several specialized agents that communicate "
    "through fixed protocols, shared state, or a supervisor that routes work dynamically.",
]

# Rough, illustrative heuristics — NOT real token counts or real billing.
TOKENS_PER_CHAR = 1 / 4
COST_PER_TOKEN_USD = 0.0000003


def _estimate_tokens(text: str) -> int:
    return max(1, int(len(text) * TOKENS_PER_CHAR))


def _score_doc(query: str, doc: str) -> int:
    query_words = set(query.lower().split())
    doc_words = set(doc.lower().split())
    return len(query_words & doc_words)


def run_traced(client: genai.Client, question: str) -> tuple[list[dict], str]:
    run_start = time.perf_counter()
    spans: list[dict] = []

    # --- span: retrieve ---
    retrieve_start = time.perf_counter()
    scored = sorted(DOCS, key=lambda d: _score_doc(question, d), reverse=True)
    best_doc = scored[0]
    retrieve_end = time.perf_counter()

    retrieve_tokens = _estimate_tokens(question + best_doc)
    spans.append({
        "name": "retrieve",
        "start_ms": round((retrieve_start - run_start) * 1000, 1),
        "duration_ms": round((retrieve_end - retrieve_start) * 1000, 1),
        "tokens": retrieve_tokens,
        "cost_usd": round(retrieve_tokens * COST_PER_TOKEN_USD, 6),
    })

    # --- span: generate ---
    generate_start = time.perf_counter()
    prompt = (
        "Answer the question using only this context:\n\n"
        f"Context: {best_doc}\n\nQuestion: {question}"
    )
    resp = client.models.generate_content(model=MODEL, contents=prompt)
    answer = resp.text or ""
    generate_end = time.perf_counter()

    generate_tokens = _estimate_tokens(prompt + answer)
    spans.append({
        "name": "generate",
        "start_ms": round((generate_start - run_start) * 1000, 1),
        "duration_ms": round((generate_end - generate_start) * 1000, 1),
        "tokens": generate_tokens,
        "cost_usd": round(generate_tokens * COST_PER_TOKEN_USD, 6),
    })

    return spans, answer


def main():
    if not os.environ.get("GEMINI_API_KEY"):
        print("ERROR: set GEMINI_API_KEY to run this module.")
        sys.exit(1)

    client = genai.Client()
    question = "What does this curriculum teach about embeddings?"
    spans, answer = run_traced(client, question)

    print(f"Question: {question}\n")
    for span in spans:
        print(
            f"  [{span['name']}] start={span['start_ms']}ms duration={span['duration_ms']}ms "
            f"tokens={span['tokens']} cost=${span['cost_usd']}"
        )
    print(f"\nAnswer: {answer}")


if __name__ == "__main__":
    main()
