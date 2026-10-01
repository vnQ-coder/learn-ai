"""Module 19: live-updating documents (incremental indexing).

Scenario: every other RAG module in this curriculum treats the document
corpus as static -- indexed once, queried forever. Real knowledge bases
don't work that way: someone edits a policy doc, a new FAQ gets written,
an old one gets deleted. This module shows what a RAG system has to do
about that -- update just the ONE document that changed, instantly,
against a real persistent vector store, without re-processing anything
else.

Run directly:
    python main.py
"""
import chromadb

DB_PATH = "./chroma_data"
COLLECTION = "incremental_docs"

SEED_DOCS = [
    {"id": "doc-1", "text": "Our standard shipping takes 5-7 business days within the country."},
    {"id": "doc-2", "text": "Refunds are issued within 3 business days of receiving a returned item."},
    {"id": "doc-3", "text": "You can reset your password from the account settings page."},
]
SEED_IDS = [d["id"] for d in SEED_DOCS]


def get_collection():
    client = chromadb.PersistentClient(path=DB_PATH)
    return client.get_or_create_collection(COLLECTION)


def reset_demo() -> None:
    """Wipes the collection and reseeds it with SEED_DOCS, so every demo
    session starts from the same known state."""
    client = chromadb.PersistentClient(path=DB_PATH)
    try:
        client.delete_collection(COLLECTION)
    except Exception:
        pass
    coll = client.get_or_create_collection(COLLECTION)
    coll.add(
        documents=[d["text"] for d in SEED_DOCS],
        ids=[d["id"] for d in SEED_DOCS],
    )


def add_document(doc_id: str, text: str) -> None:
    """Incremental insert: only this one document gets embedded."""
    coll = get_collection()
    coll.add(documents=[text], ids=[doc_id])


def update_document(doc_id: str, text: str) -> None:
    """Incremental update: only this one document's embedding changes."""
    coll = get_collection()
    coll.upsert(documents=[text], ids=[doc_id])


def delete_document(doc_id: str) -> None:
    coll = get_collection()
    coll.delete(ids=[doc_id])


def list_all() -> list[dict]:
    coll = get_collection()
    result = coll.get()
    docs = list(zip(result["ids"], result["documents"]))
    docs.sort(key=lambda d: d[0])
    return [{"id": i, "text": t} for i, t in docs]


def query(question: str, top_k: int = 3) -> list[dict]:
    coll = get_collection()
    count = coll.count()
    if count == 0:
        return []
    results = coll.query(query_texts=[question], n_results=min(top_k, count))
    ids = results["ids"][0]
    docs = results["documents"][0]
    dists = results["distances"][0]
    return [{"id": i, "text": t, "distance": float(d)} for i, t, d in zip(ids, docs, dists)]


def _print_results(label: str, results: list[dict]) -> None:
    print(f"\n{label}")
    if not results:
        print("  (no results)")
    for r in results:
        print(f"  [{r['id']}] distance={r['distance']:.3f}  {r['text']}")


def main():
    reset_demo()
    print("Seeded index with 3 starter documents.")

    q1 = "how long does shipping take"
    _print_results(f'Query: "{q1}" (before any changes)', query(q1))

    new_text = "We now offer same-day delivery in select metro areas for an extra fee."
    add_document("doc-4", new_text)
    print(f"\nAdded doc-4: {new_text!r}")
    q2 = "is same-day delivery available"
    _print_results(f'Query: "{q2}" (after adding doc-4)', query(q2))

    updated_text = "Our password reset page also supports two-factor authentication recovery codes."
    update_document("doc-3", updated_text)
    print(f"\nUpdated doc-3 to: {updated_text!r}")
    q3 = "how do I recover my two-factor authentication codes"
    _print_results(f'Query: "{q3}" (matches only the UPDATED doc-3 content)', query(q3))

    delete_document("doc-2")
    print("\nDeleted doc-2 (the refund policy document).")
    q4 = "what is the refund policy"
    _print_results(f'Query: "{q4}" (doc-2 should no longer appear)', query(q4))

    print("\nFinal index contents:")
    for d in list_all():
        print(f"  [{d['id']}] {d['text']}")


if __name__ == "__main__":
    main()
