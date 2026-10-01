"""Module 27: a lightweight automated eval harness.

Scenario: a small fixed set of question / expected-keyword pairs gets run
through Gemini one at a time. Each response is automatically checked for
whether it contains the expected keywords, and an overall pass rate is
computed. This is the basic pattern behind regression-testing an
LLM-powered feature: instead of eyeballing a few outputs, you run a
repeatable suite and track a score.
"""
import os
import sys
from google import genai

MODEL = "gemini-2.5-flash"

EVAL_SET = [
    {
        "question": "What does RAG stand for in the context of AI?",
        "expected_keywords": ["retrieval", "augmented", "generation"],
    },
    {
        "question": "Who created the original implementation of the Python programming language? Just give the first and last name.",
        "expected_keywords": ["Guido", "Rossum"],
    },
    {
        "question": "What is the time complexity of binary search on a sorted array, using Big O notation?",
        "expected_keywords": ["log"],
    },
    {
        "question": "What does HTTP stand for?",
        "expected_keywords": ["hypertext", "transfer", "protocol"],
    },
    {
        "question": "In machine learning, what does the acronym LLM stand for?",
        "expected_keywords": ["large", "language", "model"],
    },
]


def call_gemini(client: genai.Client, prompt: str) -> str:
    resp = client.models.generate_content(model=MODEL, contents=prompt)
    return resp.text or ""


def check_keywords(response_text: str, expected_keywords: list[str]) -> bool:
    lowered = response_text.lower()
    return all(keyword.lower() in lowered for keyword in expected_keywords)


def run_eval_item(client: genai.Client, item: dict) -> dict:
    response_text = call_gemini(client, item["question"])
    passed = check_keywords(response_text, item["expected_keywords"])
    return {
        "question": item["question"],
        "expected_keywords": item["expected_keywords"],
        "response": response_text,
        "passed": passed,
    }


def run_full_eval(client: genai.Client) -> dict:
    results = [run_eval_item(client, item) for item in EVAL_SET]
    passed_count = sum(1 for r in results if r["passed"])
    total = len(EVAL_SET)
    return {
        "results": results,
        "passed_count": passed_count,
        "total": total,
        "score_pct": round(passed_count / total * 100, 1),
    }


def main():
    if not os.environ.get("GEMINI_API_KEY"):
        print("ERROR: set GEMINI_API_KEY to run this module.")
        sys.exit(1)

    client = genai.Client()
    summary = run_full_eval(client)

    for i, r in enumerate(summary["results"], start=1):
        status = "PASS" if r["passed"] else "FAIL"
        print(f"\n[{i}] {status} — {r['question']}")
        print(f"    expected keywords: {r['expected_keywords']}")
        print(f"    response: {r['response'][:200]}")

    print(f"\n=== SCORE: {summary['passed_count']}/{summary['total']} ({summary['score_pct']}%) ===")


if __name__ == "__main__":
    main()
