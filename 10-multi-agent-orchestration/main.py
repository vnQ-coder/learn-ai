"""Module 10: multi-agent orchestration via a supervisor agent.

Scenario: a Supervisor LLM reads an incoming customer support request and
decides, live, which specialist agent should handle it (billing,
technical, or account) — then that specialist drafts the reply. Unlike
module 09's fixed researcher -> fact-checker -> writer pipeline, the
routing decision here is itself an LLM call that could go any of three
ways depending on what the request actually says.
"""
import os
import sys
from google import genai

MODEL = "gemini-2.5-flash"

SPECIALISTS = {
    "billing": "a billing support specialist who handles charges, refunds, and invoices",
    "technical": "a technical support specialist who handles bugs, errors, and how-to questions",
    "account": "an account support specialist who handles logins, passwords, and profile settings",
}


def call_gemini(client: genai.Client, prompt: str) -> str:
    resp = client.models.generate_content(model=MODEL, contents=prompt)
    return resp.text or ""


def supervisor_route(client: genai.Client, request: str) -> str:
    """Asks the model which specialist should handle this request. Returns
    one of the SPECIALISTS keys, defaulting to 'technical' if parsing fails."""
    options = ", ".join(SPECIALISTS.keys())
    raw = call_gemini(
        client,
        "You are a routing supervisor for a customer support team. Reply with "
        f"exactly one word — one of: {options} — naming which specialist should "
        f"handle this request. No punctuation, no explanation, just the word.\n\n"
        f"Request: {request}",
    )
    choice = raw.strip().lower().strip(".")
    for key in SPECIALISTS:
        if key in choice:
            return key
    return "technical"


def specialist_reply(client: genai.Client, specialist: str, request: str) -> str:
    persona = SPECIALISTS.get(specialist, SPECIALISTS["technical"])
    return call_gemini(
        client,
        f"You are {persona}. Write a short, helpful reply (2-3 sentences) to "
        f"this customer request:\n\n{request}",
    )


def main():
    if not os.environ.get("GEMINI_API_KEY"):
        print("ERROR: set GEMINI_API_KEY to run this module.")
        sys.exit(1)

    client = genai.Client()
    request = "I was charged twice this month and need a refund"

    specialist = supervisor_route(client, request)
    print(f"Supervisor routed to: {specialist}")

    reply = specialist_reply(client, specialist, request)
    print(f"\n=== {specialist.upper()} SPECIALIST REPLY ===\n{reply}")


if __name__ == "__main__":
    main()
