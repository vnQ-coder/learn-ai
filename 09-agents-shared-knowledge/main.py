"""Module 09: blackboard pattern across three agents.

Scenario: a researcher agent, a fact-checker agent, and a writer agent
produce a short report by reading/writing a shared knowledge store,
without ever calling each other directly.
"""
import os
import sys
from google import genai

MODEL = "gemini-2.5-flash"


class Blackboard:
    """A shared knowledge store multiple agents read from and write to."""

    def __init__(self):
        self._entries: list[dict] = []

    def write(self, agent: str, key: str, value: str) -> None:
        self._entries.append({"agent": agent, "key": key, "value": value})

    def read_all(self) -> list[dict]:
        return list(self._entries)

    def dump(self, label: str) -> None:
        print(f"\n--- Blackboard after {label} ---")
        for e in self._entries:
            print(f"  [{e['agent']}] {e['key']}: {e['value'][:120]}")


def call_gemini(client: genai.Client, prompt: str) -> str:
    resp = client.models.generate_content(model=MODEL, contents=prompt)
    return resp.text


def researcher_agent(client: genai.Client, board: Blackboard, topic: str):
    findings = call_gemini(
        client,
        f"List 3 concise factual bullet points about: {topic}",
    )
    board.write("researcher", "raw_findings", findings)


def fact_checker_agent(client: genai.Client, board: Blackboard):
    findings = next(e["value"] for e in board.read_all() if e["key"] == "raw_findings")
    verdict = call_gemini(
        client,
        "Review these bullet points for anything questionable or "
        f"unverifiable, and note it. Otherwise say they look reasonable:\n\n{findings}",
    )
    board.write("fact_checker", "verdict", verdict)


def writer_agent(client: genai.Client, board: Blackboard, topic: str):
    findings = next(e["value"] for e in board.read_all() if e["key"] == "raw_findings")
    verdict = next(e["value"] for e in board.read_all() if e["key"] == "verdict")
    report = call_gemini(
        client,
        f"Write a 3-sentence report on '{topic}' using these findings "
        f"and respecting this fact-check verdict:\n\nFindings:\n{findings}\n\nVerdict:\n{verdict}",
    )
    board.write("writer", "final_report", report)


def main():
    if not os.environ.get("GEMINI_API_KEY"):
        print("ERROR: set GEMINI_API_KEY to run this module.")
        sys.exit(1)

    client = genai.Client()
    board = Blackboard()
    topic = "why hybrid search outperforms pure keyword search"

    researcher_agent(client, board, topic)
    board.dump("researcher")

    fact_checker_agent(client, board)
    board.dump("fact_checker")

    writer_agent(client, board, topic)
    board.dump("writer")

    final = next(e["value"] for e in board.read_all() if e["key"] == "final_report")
    print(f"\n=== FINAL REPORT ===\n{final}")


if __name__ == "__main__":
    main()
