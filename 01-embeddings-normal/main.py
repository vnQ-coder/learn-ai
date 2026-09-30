"""Module 01: keyword/TF-IDF search over a support-ticket corpus.

Scenario: a support-ticket search box that only does literal keyword
matching. Shows where it fails on paraphrased queries.
"""
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
    "I was billed two times",  # paraphrase of "Charged twice for the same order..."
    "parcel hasn't shown up",  # paraphrase of "Order #9012 never arrived..."
    "I keep getting bounced out when I try to log in",  # paraphrase of "Login page shows a 500 error..."
    "delivery is taking forever",  # paraphrase of "Shipping is delayed for order #7788..."
]


def search(corpus: list[str], queries: list[str], top_k: int = 3):
    # stop_words='english' keeps common words like "I"/"was"/"the" from
    # creating accidental token overlap that would otherwise mask a real
    # TF-IDF miss (e.g. "I was billed two times" vs "I was double charged").
    vectorizer = TfidfVectorizer(stop_words="english")
    doc_vectors = vectorizer.fit_transform(corpus)
    results = {}
    for q in queries:
        q_vec = vectorizer.transform([q])
        sims = cosine_similarity(q_vec, doc_vectors)[0]
        ranked = np.argsort(sims)[::-1][:top_k]
        results[q] = [(corpus[i], round(float(sims[i]), 3)) for i in ranked]
    return results


def main():
    results = search(TICKETS, QUERIES)
    for q, hits in results.items():
        print(f"\nQuery: {q!r}")
        for text, score in hits:
            marker = "MATCH" if score > 0.05 else "MISS (score ~0)"
            print(f"  [{marker}] score={score:.3f}  {text}")


if __name__ == "__main__":
    main()
