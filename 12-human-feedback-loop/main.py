"""Module 12: human feedback loop (human-in-the-loop).

Scenario: an AI drafts a reply to a customer complaint, but a human must
approve it before it's considered "sent". If the human rejects it with
feedback, the AI revises the draft incorporating that feedback, and the
loop can repeat. Nothing ships without an explicit human checkpoint.
"""
import os
import sys
from google import genai

MODEL = "gemini-2.5-flash"


def call_gemini(client: genai.Client, prompt: str) -> str:
    resp = client.models.generate_content(model=MODEL, contents=prompt)
    return resp.text or ""


def draft_reply(client: genai.Client, complaint: str) -> str:
    return call_gemini(
        client,
        "Write a short, professional reply (3-4 sentences) to this customer "
        f"complaint:\n\n{complaint}",
    )


def revise_reply(client: genai.Client, complaint: str, previous_draft: str, feedback: str) -> str:
    return call_gemini(
        client,
        "Rewrite this customer reply to incorporate the reviewer's feedback. "
        "Keep it short (3-4 sentences).\n\n"
        f"Original complaint:\n{complaint}\n\n"
        f"Previous draft:\n{previous_draft}\n\n"
        f"Reviewer feedback:\n{feedback}",
    )


def main():
    if not os.environ.get("GEMINI_API_KEY"):
        print("ERROR: set GEMINI_API_KEY to run this module.")
        sys.exit(1)

    client = genai.Client()
    complaint = "My order arrived broken and support hasn't responded in 3 days."

    draft = draft_reply(client, complaint)
    print(f"=== DRAFT v1 ===\n{draft}")

    feedback = "too formal and robotic, make it warmer and apologize up front"
    print(f"\n=== HUMAN REJECTED ===\nFeedback: {feedback}")

    revised = revise_reply(client, complaint, draft, feedback)
    print(f"\n=== DRAFT v2 (revised) ===\n{revised}")


if __name__ == "__main__":
    main()
