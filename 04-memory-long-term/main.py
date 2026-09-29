"""Module 04: persistent long-term memory across separate process runs.

Scenario: a personal assistant that remembers "I'm vegetarian" and can
recall it weeks later, in a completely separate invocation.

Run modes:
    python main.py remember "I'm vegetarian"
    python main.py recall "what do I eat"
"""
import sys
import chromadb

DB_PATH = "./chroma_data"
COLLECTION = "long_term_memory"


def get_collection():
    client = chromadb.PersistentClient(path=DB_PATH)
    return client.get_or_create_collection(COLLECTION)


def remember(fact: str) -> None:
    coll = get_collection()
    next_id = str(coll.count())
    coll.add(documents=[fact], ids=[next_id])
    print(f"Remembered (id={next_id}): {fact}")


def recall(query: str) -> str | None:
    coll = get_collection()
    if coll.count() == 0:
        print("Nothing remembered yet.")
        return None
    results = coll.query(query_texts=[query], n_results=1)
    docs = results["documents"][0]
    dists = results["distances"][0]
    if not docs:
        print("Nothing remembered yet.")
        return None
    print(f"Recalled (distance={dists[0]:.3f}): {docs[0]}")
    return docs[0]


def main():
    if len(sys.argv) < 3:
        print("Usage: python main.py [remember|recall] \"text\"")
        sys.exit(1)
    mode, text = sys.argv[1], sys.argv[2]
    if mode == "remember":
        remember(text)
    elif mode == "recall":
        recall(text)
    else:
        print("Unknown mode, use 'remember' or 'recall'")
        sys.exit(1)


if __name__ == "__main__":
    main()
