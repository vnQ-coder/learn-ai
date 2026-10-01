"""Module 17: knowledge graph extraction and multi-hop traversal.

Scenario: extract a small knowledge graph (subject-predicate-object
triples) from a short paragraph, then answer a question that requires
walking multiple relationships — not just finding similar-sounding text.
This contrasts with module 05 (vector RAG, retrieves by similarity) and
module 02 (semantic embedding search): a knowledge graph answers by
following explicit relationships, even across facts that share no
vocabulary with the question at all.
"""
import json
import os
import re
import sys
from collections import deque

from google import genai

MODEL = "gemini-2.5-flash"

SOURCE_TEXT = (
    "Acme Corp was founded by Jane Lee in 2015. In 2020, Acme Corp acquired "
    "a smaller company called BetaSoft. BetaSoft had created a product "
    "called DataSync before the acquisition. Jane Lee currently serves as "
    "CEO of Acme Corp. DataSync integrates directly with CloudStore, a "
    "platform that Acme Corp owns and operates."
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


def extract_triples(client: genai.Client, text: str) -> list[dict]:
    prompt = (
        "Extract every factual relationship from this text as a JSON array "
        "of objects, each with exactly the keys \"subject\", \"predicate\", "
        "\"object\" (short strings, e.g. "
        '{"subject": "Acme Corp", "predicate": "founded by", "object": "Jane Lee"}'
        "). Respond with ONLY the JSON array, nothing else.\n\n"
        f"Text:\n{text}"
    )
    raw = call_gemini(client, prompt)
    try:
        data = json.loads(_strip_code_fence(raw))
        if isinstance(data, list):
            return [
                {"subject": str(t["subject"]), "predicate": str(t["predicate"]), "object": str(t["object"])}
                for t in data
                if isinstance(t, dict) and "subject" in t and "predicate" in t and "object" in t
            ]
    except (json.JSONDecodeError, KeyError, TypeError):
        pass
    return []


def build_graph(triples: list[dict]) -> dict[str, list[tuple[str, str, str]]]:
    graph: dict[str, list[tuple[str, str, str]]] = {}
    for t in triples:
        edge = (t["subject"], t["predicate"], t["object"])
        graph.setdefault(t["subject"], []).append(edge)
        graph.setdefault(t["object"], []).append(edge)
    return graph


def find_relevant_entities(question: str, graph: dict) -> list[str]:
    q_lower = question.lower()
    direct = [entity for entity in graph if entity.lower() in q_lower]
    if direct:
        return direct

    q_words = set(re.findall(r"[a-zA-Z]+", q_lower))
    fallback = []
    for entity in graph:
        entity_words = set(re.findall(r"[a-zA-Z]+", entity.lower()))
        if entity_words and len(entity_words & q_words) / len(entity_words) >= 0.5:
            fallback.append(entity)
    return fallback


def traverse(graph: dict, entities: list[str], hops: int = 3) -> list[dict]:
    visited_entities: set[str] = set(entities)
    frontier = deque(entities)
    seen_edges: set[tuple[str, str, str]] = set()
    ordered: list[dict] = []

    for _ in range(hops):
        next_frontier: deque[str] = deque()
        while frontier:
            entity = frontier.popleft()
            for edge in graph.get(entity, []):
                if edge not in seen_edges:
                    seen_edges.add(edge)
                    ordered.append({"subject": edge[0], "predicate": edge[1], "object": edge[2]})
                for neighbor in (edge[0], edge[2]):
                    if neighbor not in visited_entities:
                        visited_entities.add(neighbor)
                        next_frontier.append(neighbor)
        frontier = next_frontier

    return ordered


def answer_with_graph(client: genai.Client, question: str, used_triples: list[dict]) -> str:
    facts = "\n".join(f"- {t['subject']} {t['predicate']} {t['object']}" for t in used_triples)
    prompt = (
        "Answer the question using ONLY the facts listed below. Do not use "
        "any outside knowledge, even if you know more about the subject.\n\n"
        f"Facts:\n{facts}\n\nQuestion: {question}"
    )
    return call_gemini(client, prompt)


def main():
    if not os.environ.get("GEMINI_API_KEY"):
        print("ERROR: set GEMINI_API_KEY to run this module.")
        sys.exit(1)

    client = genai.Client()

    triples = extract_triples(client, SOURCE_TEXT)
    print("=== Extracted triples ===")
    for t in triples:
        print(f"  {t['subject']} --{t['predicate']}--> {t['object']}")

    question = "What product did the company Jane Lee leads gain by acquiring BetaSoft?"
    graph = build_graph(triples)
    entities = find_relevant_entities(question, graph)
    print(f"\n=== Entities found in question ===\n  {entities}")

    used_triples = traverse(graph, entities, hops=3)
    print("\n=== Traversed triples ===")
    for t in used_triples:
        print(f"  {t['subject']} --{t['predicate']}--> {t['object']}")

    answer = answer_with_graph(client, question, used_triples)
    print(f"\n=== Answer ===\n{answer}")


if __name__ == "__main__":
    main()
