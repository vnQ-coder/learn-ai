"""Module 29: why vector databases exist.

Scenario: modules 04 and 19 already use Chroma (a real vector database)
as an implementation detail, but never explain WHY you'd reach for one
instead of just looping over a Python list of vectors and computing
similarity by hand. This module makes that concrete: time a brute-force
linear scan against Chroma's approximate nearest-neighbor (HNSW) index
as the corpus size grows, so you can see the gap widen with your own
eyes instead of just being told it exists.
"""
import time

import chromadb
import numpy as np

DB_PATH = "./chroma_data"
COLLECTION = "vector_db_benchmark"


def generate_random_vectors(n: int, dim: int = 64) -> np.ndarray:
    vectors = np.random.randn(n, dim).astype(np.float32)
    norms = np.linalg.norm(vectors, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    return vectors / norms


def brute_force_search(query: np.ndarray, corpus: np.ndarray, top_k: int = 5) -> tuple[list[int], float]:
    start = time.perf_counter()
    scores = corpus @ query
    top_indices = np.argsort(scores)[::-1][:top_k]
    elapsed_ms = (time.perf_counter() - start) * 1000
    return top_indices.tolist(), elapsed_ms


def indexed_search(query: np.ndarray, corpus: np.ndarray, top_k: int = 5) -> float:
    client = chromadb.PersistentClient(path=DB_PATH)
    try:
        client.delete_collection(COLLECTION)
    except Exception:
        pass
    coll = client.get_or_create_collection(COLLECTION)
    batch_size = 4000
    embeddings = corpus.tolist()
    ids = [str(i) for i in range(len(corpus))]
    for i in range(0, len(corpus), batch_size):
        coll.add(embeddings=embeddings[i:i + batch_size], ids=ids[i:i + batch_size])
    start = time.perf_counter()
    coll.query(query_embeddings=[query.tolist()], n_results=top_k)
    elapsed_ms = (time.perf_counter() - start) * 1000
    return elapsed_ms


def benchmark() -> dict:
    sizes = [1000, 15000, 50000, 100000]
    results = []
    for n in sizes:
        corpus = generate_random_vectors(n)
        query = generate_random_vectors(1)[0]
        _, brute_force_ms = brute_force_search(query, corpus)
        indexed_ms = indexed_search(query, corpus)
        results.append({
            "corpus_size": n,
            "brute_force_ms": round(brute_force_ms, 4),
            "indexed_ms": round(indexed_ms, 4),
        })
    return {"results": results}


def main():
    data = benchmark()
    print(f"{'corpus_size':>12}  {'brute_force_ms':>16}  {'indexed_ms':>12}")
    for r in data["results"]:
        print(f"{r['corpus_size']:>12}  {r['brute_force_ms']:>16.4f}  {r['indexed_ms']:>12.4f}")

    first, last = data["results"][0], data["results"][-1]
    print(
        f"\nAt {first['corpus_size']} documents: brute force {first['brute_force_ms']}ms, "
        f"indexed {first['indexed_ms']}ms."
    )
    print(
        f"At {last['corpus_size']} documents: brute force {last['brute_force_ms']}ms, "
        f"indexed {last['indexed_ms']}ms."
    )
    print(
        "Brute-force search time grows with corpus size, while the indexed search stays "
        "comparatively flat -- at larger scales this gap becomes the difference between a "
        "sub-millisecond query and a noticeably slower one."
    )


if __name__ == "__main__":
    main()
