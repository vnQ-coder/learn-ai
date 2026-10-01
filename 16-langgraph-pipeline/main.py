"""Module 16: a real LangGraph StateGraph with conditional routing.

Scenario: triage a support ticket — classify its urgency, then branch to an
escalation node or an auto-reply node depending on the result. Unlike module
10's hand-rolled supervisor (plain if/else-style routing in Python) and
module 09's fixed sequential pipeline, this uses LangGraph's actual node /
edge / conditional-edge graph model to express the same kind of branching
logic declaratively.
"""
import os
import sys
from typing import Iterator, TypedDict

from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import END, StateGraph

MODEL = "gemini-2.5-flash"


class TicketState(TypedDict):
    ticket: str
    urgency: str
    response: str


def build_graph(api_key: str):
    llm = ChatGoogleGenerativeAI(model=MODEL, google_api_key=api_key)

    def classify(state: TicketState) -> dict:
        result = llm.invoke(
            "Classify this support ticket's urgency as exactly one word, "
            f"either 'urgent' or 'normal':\n\n{state['ticket']}"
        )
        urgency = "urgent" if "urgent" in result.content.lower() else "normal"
        return {"urgency": urgency}

    def route(state: TicketState) -> str:
        return state["urgency"]

    def escalate(state: TicketState) -> dict:
        result = llm.invoke(
            "Write a short internal escalation note (2-3 sentences) for this "
            f"urgent ticket, flagging it for immediate human attention:\n\n{state['ticket']}"
        )
        return {"response": result.content}

    def auto_reply(state: TicketState) -> dict:
        result = llm.invoke(
            "Write a short, friendly auto-reply (2-3 sentences) acknowledging "
            f"this support ticket and setting expectations for a response:\n\n{state['ticket']}"
        )
        return {"response": result.content}

    graph = StateGraph(TicketState)
    graph.add_node("classify", classify)
    graph.add_node("escalate", escalate)
    graph.add_node("auto_reply", auto_reply)
    graph.set_entry_point("classify")
    graph.add_conditional_edges("classify", route, {"urgent": "escalate", "normal": "auto_reply"})
    graph.add_edge("escalate", END)
    graph.add_edge("auto_reply", END)
    return graph.compile()


def run_graph_streaming(api_key: str, ticket: str) -> Iterator[tuple[str, dict]]:
    """Yields (node_name, node_output) for each node as the compiled graph executes."""
    compiled = build_graph(api_key)
    initial: TicketState = {"ticket": ticket, "urgency": "", "response": ""}
    for chunk in compiled.stream(initial):
        for node_name, node_output in chunk.items():
            yield node_name, node_output


def main():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("ERROR: set GEMINI_API_KEY to run this module.")
        sys.exit(1)

    ticket = "URGENT: production database is down, customers cannot check out!"
    for node_name, output in run_graph_streaming(api_key, ticket):
        print(f"[{node_name}] {output}")


if __name__ == "__main__":
    main()
