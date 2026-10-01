"""Module 14: plan-and-execute architecture.

Scenario: contrast with the reactive ReAct loop (module 13) — here the
agent writes a complete plan up front, then executes each step in order,
accumulating context, and finally synthesizes everything into one answer.
"""
import json
import os
import re
import sys
from google import genai

MODEL = "gemini-2.5-flash"


def call_gemini(client: genai.Client, prompt: str) -> str:
    resp = client.models.generate_content(model=MODEL, contents=prompt)
    return resp.text or ""


def _strip_code_fence(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```[a-zA-Z]*\n?", "", text)
        text = re.sub(r"```$", "", text)
    return text.strip()


def make_plan(client: genai.Client, goal: str) -> list[str]:
    raw = call_gemini(
        client,
        "Break this goal into a short plan of 3-4 concise, concrete steps. "
        "Respond with ONLY a JSON array of strings, nothing else — no markdown, "
        "no explanation, just the array.\n\n"
        f"Goal: {goal}",
    )
    cleaned = _strip_code_fence(raw)
    try:
        steps = json.loads(cleaned)
        if isinstance(steps, list) and all(isinstance(s, str) for s in steps) and steps:
            return steps
    except (json.JSONDecodeError, ValueError):
        pass

    # Fallback: split on newlines and strip leading numbers/bullets.
    lines = [line.strip() for line in raw.splitlines() if line.strip()]
    steps = [re.sub(r"^[\-\*\d\.\)\s]+", "", line).strip() for line in lines]
    steps = [s for s in steps if s]
    return steps or [goal]


def execute_step(client: genai.Client, goal: str, step: str, prior_context: str) -> str:
    context_block = f"\n\nWhat's been done so far:\n{prior_context}" if prior_context else ""
    return call_gemini(
        client,
        f"Overall goal: {goal}\n\n"
        f"Carry out this one step of the plan and report the result concisely:\n{step}"
        f"{context_block}",
    )


def synthesize(client: genai.Client, goal: str, step_results: list[str]) -> str:
    joined = "\n\n".join(f"Step {i + 1} result: {r}" for i, r in enumerate(step_results))
    return call_gemini(
        client,
        f"Goal: {goal}\n\n"
        "Combine these step results into one coherent, final answer to the goal:\n\n"
        f"{joined}",
    )


def main():
    if not os.environ.get("GEMINI_API_KEY"):
        print("ERROR: set GEMINI_API_KEY to run this module.")
        sys.exit(1)

    client = genai.Client()
    goal = "Explain what RAG is and give one real-world example"

    plan = make_plan(client, goal)
    print("=== PLAN ===")
    for i, step in enumerate(plan, 1):
        print(f"{i}. {step}")

    results: list[str] = []
    for step in plan:
        prior_context = "\n".join(results)
        result = execute_step(client, goal, step, prior_context)
        results.append(result)
        print(f"\n=== STEP: {step} ===\n{result}")

    final = synthesize(client, goal, results)
    print(f"\n=== FINAL ANSWER ===\n{final}")


if __name__ == "__main__":
    main()
