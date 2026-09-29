"""Module 02: semantic embeddings over the same support-ticket corpus
as module 01, showing where meaning-based search rescues TF-IDF misses.
"""
from sentence_transformers import SentenceTransformer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

TICKETS = [
    "Refund request for order #4521, item arrived damaged",
    "How do I reset my password, the reset email never arrives",
    "Cancel my subscription immediately, I was double charged",
    "Shipping is delayed for order #7788, tracking not updating",
    "App crashes every time I open the settings page",
    "I want a refund, the product does not match the description",
    "Update my billing address before the next invoice",
    "Login page shows a 500 error on mobile Safari",
    "Order #9012 never arrived, it has been three weeks",
    "Downgrade my plan to the free tier starting next month",
    "The dark mode toggle does nothing in the dashboard",
    "Charged twice for the same order, need the extra charge reversed",
    "Export my data before I close my account",
    "Two-factor authentication codes are not being sent by SMS",
    "Change the email address linked to my account",
    "The checkout page freezes on the payment step",
    "Request a copy of my last three invoices",
    "My account was suspended without any explanation",
]

QUERIES = [
    "cancel my order",
    "money taken twice",
    "can't log in",
    "package is late",
]


def tfidf_top1(corpus, queries):
    vectorizer = TfidfVectorizer()
    doc_vectors = vectorizer.fit_transform(corpus)
    out = {}
    for q in queries:
        sims = cosine_similarity(vectorizer.transform([q]), doc_vectors)[0]
        i = int(np.argmax(sims))
        out[q] = (corpus[i], float(sims[i]))
    return out


def semantic_top1(corpus, queries, model):
    doc_emb = model.encode(corpus, normalize_embeddings=True)
    q_emb = model.encode(queries, normalize_embeddings=True)
    sims = q_emb @ doc_emb.T
    out = {}
    for qi, q in enumerate(queries):
        i = int(np.argmax(sims[qi]))
        out[q] = (corpus[i], float(sims[qi][i]))
    return out


def main():
    model = SentenceTransformer("all-MiniLM-L6-v2")
    tfidf_results = tfidf_top1(TICKETS, QUERIES)
    semantic_results = semantic_top1(TICKETS, QUERIES, model)

    for q in QUERIES:
        t_text, t_score = tfidf_results[q]
        s_text, s_score = semantic_results[q]
        print(f"\nQuery: {q!r}")
        print(f"  TF-IDF  (score={t_score:.3f}): {t_text}")
        print(f"  Semantic(score={s_score:.3f}): {s_text}")
        if s_score > t_score + 0.15:
            print("  -> semantic search found a better match TF-IDF missed")


if __name__ == "__main__":
    main()
