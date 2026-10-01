"""Module 28: LLM-as-judge.

Scenario: two candidate answers to the same customer question get
judged by Gemini acting as an impartial evaluator, which scores both on
a rubric (helpfulness, accuracy, clarity), picks a winner, and explains
its reasoning. This contrasts with module 27's keyword-based automatic
checking: some qualities (is this answer actually HELPFUL, not just
factually present?) can't be captured by simple string matching, so you
use one model to grade another model's output instead.
"""
import json
import os
import re
import sys

from google import genai

MODEL = "gemini-2.5-flash"

QUESTION = "A customer asks: 'My order arrived three days late and the box was damaged. What should I do?'"

CANDIDATE_A = (
    "I'm really sorry about this — a late, damaged order is frustrating and "
    "that's on us to fix. Here's what I'll do: if you can share your order "
    "number, I'll check the shipment right away and get you either a free "
    "replacement or a full refund, whichever you'd prefer. You don't need "
    "to send the damaged item back unless we ask for it. I'll also flag the "
    "carrier delay so we can look into why it ran late."
)

CANDIDATE_B = (
    "Thank you for reaching out to us. We understand that issues can "
    "sometimes occur with shipping and we apologize for any inconvenience "
    "this may have caused you. Please know that customer satisfaction is "
    "very important to us. For help with your order, please contact our "
    "support team and they will be happy to assist you with your concern "
    "regarding the delivery of your package."
)


def _strip_code_fence(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```[a-zA-Z]*\n?", "", text)
        text = re.sub(r"```$", "", text.strip())
    return text.strip()


def call_gemini(client: genai.Client, prompt: str) -> str:
    resp = client.models.generate_content(model=MODEL, contents=prompt)
    return resp.text or ""


def judge(client: genai.Client, question: str, candidate_a: str, candidate_b: str) -> dict:
    prompt = (
        "You are an impartial evaluator. Score each candidate answer below "
        "on three dimensions (helpfulness, accuracy, clarity), each from 1 "
        "to 10, then pick an overall winner and explain why in 1-2 "
        "sentences.\n\n"
        f"Question: {question}\n\n"
        f"Candidate A:\n{candidate_a}\n\n"
        f"Candidate B:\n{candidate_b}\n\n"
        "Respond with ONLY a JSON object shaped exactly like this, nothing "
        "else:\n"
        '{"score_a": {"helpfulness": int, "accuracy": int, "clarity": int}, '
        '"score_b": {"helpfulness": int, "accuracy": int, "clarity": int}, '
        '"winner": "A" or "B", "reasoning": "short explanation"}'
    )
    raw = call_gemini(client, prompt)
    try:
        data = json.loads(_strip_code_fence(raw))
        return {
            "score_a": data["score_a"],
            "score_b": data["score_b"],
            "winner": data["winner"],
            "reasoning": data["reasoning"],
        }
    except (json.JSONDecodeError, KeyError, TypeError) as e:
        raise ValueError(f"Could not parse judge verdict from model response: {raw!r}") from e


def main():
    if not os.environ.get("GEMINI_API_KEY"):
        print("ERROR: set GEMINI_API_KEY to run this module.")
        sys.exit(1)

    client = genai.Client()
    print(f"Question: {QUESTION}\n")
    print(f"Candidate A:\n{CANDIDATE_A}\n")
    print(f"Candidate B:\n{CANDIDATE_B}\n")

    verdict = judge(client, QUESTION, CANDIDATE_A, CANDIDATE_B)
    print("=== VERDICT ===")
    print(f"Score A: {verdict['score_a']}")
    print(f"Score B: {verdict['score_b']}")
    print(f"Winner: {verdict['winner']}")
    print(f"Reasoning: {verdict['reasoning']}")


if __name__ == "__main__":
    main()
