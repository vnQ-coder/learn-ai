"""Module 13: the ReAct pattern (Reasoning + Acting).

Scenario: an agent solves a multi-step question by interleaving explicit
Thought / Action / Observation steps, using a real calculator tool, looping
until it reaches a final answer. This is deliberately hand-rolled (no
framework) so the raw mechanism is visible — contrast with module 15
(LangChain) and module 16 (LangGraph), which use real frameworks, and with
module 14 (Plan-and-Execute), which plans upfront instead of looping
reactively.
"""
import ast
import os
import re
import sys
from google import genai

MODEL = "gemini-2.5-flash"

_ALLOWED_BIN_OPS = (ast.Add, ast.Sub, ast.Mult, ast.Div, ast.Pow)
_ALLOWED_UNARY_OPS = (ast.UAdd, ast.USub)


def _eval_node(node: ast.AST) -> float:
    if isinstance(node, ast.Expression):
        return _eval_node(node.body)
    if isinstance(node, ast.Constant):
        if isinstance(node.value, (int, float)):
            return node.value
        raise ValueError(f"disallowed constant: {node.value!r}")
    if isinstance(node, ast.BinOp):
        if not isinstance(node.op, _ALLOWED_BIN_OPS):
            raise ValueError(f"disallowed operator: {type(node.op).__name__}")
        return _eval_node_op(node.op, _eval_node(node.left), _eval_node(node.right))
    if isinstance(node, ast.UnaryOp):
        if not isinstance(node.op, _ALLOWED_UNARY_OPS):
            raise ValueError(f"disallowed unary operator: {type(node.op).__name__}")
        value = _eval_node(node.operand)
        return value if isinstance(node.op, ast.UAdd) else -value
    raise ValueError(f"disallowed expression: {type(node).__name__}")


def _eval_node_op(op: ast.operator, left: float, right: float) -> float:
    if isinstance(op, ast.Add):
        return left + right
    if isinstance(op, ast.Sub):
        return left - right
    if isinstance(op, ast.Mult):
        return left * right
    if isinstance(op, ast.Div):
        return left / right
    if isinstance(op, ast.Pow):
        return left**right
    raise ValueError(f"disallowed operator: {type(op).__name__}")


def safe_calculator(expression: str) -> str:
    """Safely evaluates a simple arithmetic expression without using eval()."""
    try:
        tree = ast.parse(expression, mode="eval")
        result = _eval_node(tree)
        return str(result)
    except Exception as e:  # noqa: BLE001
        return f"Error: {e}"


def _call_model(client: genai.Client, transcript: str, question: str) -> str:
    prompt = (
        "You are solving a question step by step using the ReAct pattern. "
        "You have access to one tool: calculator[expression], which evaluates "
        "a basic arithmetic expression (+ - * / ** and parentheses only).\n\n"
        "Respond in EXACTLY one of these two formats, nothing else:\n\n"
        "Thought: <your reasoning>\n"
        "Action: calculator[<arithmetic expression>]\n\n"
        "OR, once you have enough information to answer:\n\n"
        "Thought: <your reasoning>\n"
        "Final Answer: <your answer>\n\n"
        f"Question: {question}\n\n"
        f"{transcript}"
    )
    resp = client.models.generate_content(model=MODEL, contents=prompt)
    return resp.text or ""


def react_loop(client: genai.Client, question: str, max_steps: int = 5) -> list[dict]:
    steps: list[dict] = []
    transcript = ""

    for _ in range(max_steps):
        reply = _call_model(client, transcript, question)

        thought_match = re.search(r"Thought:\s*(.+?)(?:\n|$)", reply)
        action_match = re.search(r"Action:\s*calculator\[(.*?)\]", reply, re.DOTALL)
        final_match = re.search(r"Final Answer:\s*(.+)", reply, re.DOTALL)

        thought_text = thought_match.group(1).strip() if thought_match else ""
        if thought_text:
            steps.append({"type": "thought", "text": thought_text})
            transcript += f"Thought: {thought_text}\n"

        if final_match:
            answer_text = final_match.group(1).strip()
            steps.append({"type": "final", "text": answer_text})
            return steps

        if action_match:
            expression = action_match.group(1).strip()
            steps.append({"type": "action", "tool": "calculator", "input": expression})
            transcript += f"Action: calculator[{expression}]\n"

            result = safe_calculator(expression)
            steps.append({"type": "observation", "text": result})
            transcript += f"Observation: {result}\n"
            continue

        # Neither an action nor a final answer could be parsed — stop rather
        # than loop forever on an unparseable reply.
        break

    steps.append({"type": "final", "text": "Could not reach a final answer in time."})
    return steps


def main():
    if not os.environ.get("GEMINI_API_KEY"):
        print("ERROR: set GEMINI_API_KEY to run this module.")
        sys.exit(1)

    client = genai.Client()
    question = (
        "A server costs $0.02 per request. We get 45000 requests a day. "
        "How much do we spend in a 31-day month, and is that above a "
        "$30,000 monthly budget?"
    )

    for step in react_loop(client, question):
        if step["type"] == "thought":
            print(f"Thought: {step['text']}")
        elif step["type"] == "action":
            print(f"Action: {step['tool']}[{step['input']}]")
        elif step["type"] == "observation":
            print(f"Observation: {step['text']}")
        elif step["type"] == "final":
            print(f"Final Answer: {step['text']}")


if __name__ == "__main__":
    main()
