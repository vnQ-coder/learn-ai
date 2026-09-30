"""Module 03: sliding-window short-term memory for a multi-turn chat.

Scenario: a support chatbot booking a flight, where an early detail
("business class") must survive into a later turn, until the window
is deliberately made too small and it gets dropped.
"""
import os
import sys
from google import genai
from google.genai import types

MODEL = "gemini-2.5-flash"


class SlidingWindowMemory:
    """Keeps only the last `window_size` (role, content) turns.

    Roles follow the Gemini API's convention: "user" and "model"
    (not "assistant")."""

    def __init__(self, window_size: int):
        self.window_size = window_size
        self._turns: list[dict] = []

    def add(self, role: str, content: str) -> None:
        self._turns.append({"role": role, "content": content})
        if len(self._turns) > self.window_size:
            self._turns = self._turns[-self.window_size :]

    def get_context(self) -> list[dict]:
        return list(self._turns)

    def to_gemini_contents(self) -> list[types.Content]:
        return [
            types.Content(role=t["role"], parts=[types.Part(text=t["content"])])
            for t in self._turns
        ]


SCRIPT = [
    "I'd like to book a flight to Paris next month.",
    "Actually, please make it business class.",
    "What day works best, the 10th or the 12th?",
    "Let's go with the 12th then.",
    "What class did I ask for again?",
]


def ask_gemini(client: genai.Client, memory: SlidingWindowMemory, user_msg: str) -> str:
    memory.add("user", user_msg)
    resp = client.models.generate_content(
        model=MODEL,
        contents=memory.to_gemini_contents(),
    )
    reply = resp.text or ""
    memory.add("model", reply)
    return reply


def run_conversation(window_size: int):
    if not os.environ.get("GEMINI_API_KEY"):
        print("ERROR: set GEMINI_API_KEY to run this module.")
        sys.exit(1)

    client = genai.Client()
    memory = SlidingWindowMemory(window_size=window_size)
    print(f"\n=== Conversation with window_size={window_size} ===")
    for turn in SCRIPT:
        print(f"\nUser: {turn}")
        reply = ask_gemini(client, memory, turn)
        print(f"Model: {reply}")
        print(f"  [buffer holds {len(memory.get_context())} turns]")


def main():
    # Large window: the model correctly recalls "business class" at the end.
    run_conversation(window_size=10)
    # Small window: the early "business class" turn is evicted before the
    # final question, so the model can no longer answer it correctly.
    # window_size=1 (not 2) so only the single most recent turn survives —
    # with window_size=2 the model's own prior reply can still recap the
    # dropped fact, masking the forgetting effect this demo is meant to show.
    run_conversation(window_size=1)


if __name__ == "__main__":
    main()
