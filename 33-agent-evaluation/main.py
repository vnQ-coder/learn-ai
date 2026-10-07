"""Module 33: agent evaluation in production — scoring a full trajectory,
not just a final answer.

Scenario: reuses module 07's order-lookup tool-calling agent, but instead
of checking whether the final answer "sounds right" (module 27) or
whether one answer is subjectively better than another (module 28), this
runs the agent through scenarios chosen to tempt real production failure
modes, and checks the agent's entire TRAJECTORY — which tools it called,
with what arguments, how many times, and whether its final answer is
actually grounded in the real tool result — not just whether the final
text contains some expected words.

The failure modes this specifically targets:
  1. Hallucinating a plausible-sounding result for data that doesn't exist
     (claiming a fake order has a specific delivered/in-transit status).
  2. Calling a tool it didn't need (over-eager tool use).
  3. Calling the same tool redundantly for information it already has
     (inefficiency that would compound into real cost/latency at scale).
  4. Not grounding its final answer in what the tool actually returned.

None of these show up if you only keyword-match the final answer — they
only show up if you look at the steps.
"""
import os
import sys

from google import genai
from google.genai import types

MODEL = "gemini-2.5-flash"

MOCK_ORDERS = {
    "4521": {"status": "delivered", "eta": None},
    "7788": {"status": "in_transit", "eta": "2026-10-02"},
    "9012": {"status": "lost", "eta": None},
}

REAL_STATUS_WORDS = ["delivered", "in transit", "in_transit", "lost"]


def get_order_status(order_id: str) -> dict:
    return MOCK_ORDERS.get(order_id, {"status": "unknown", "eta": None})


TOOL = types.Tool(function_declarations=[
    types.FunctionDeclaration(
        name="get_order_status",
        description="Look up the current shipping status of an order by its ID.",
        parameters={
            "type": "OBJECT",
            "properties": {
                "order_id": {"type": "STRING", "description": "The order ID, digits only."}
            },
            "required": ["order_id"],
        },
    )
])

CONFIG = types.GenerateContentConfig(tools=[TOOL])
NO_TOOL_CONFIG = types.GenerateContentConfig()

SCENARIOS = [
    {
        "key": "clean_lookup",
        "label": "Clean order lookup",
        "prompt": "Where is my order 7788?",
        "should_call_tool": True,
        "max_tool_calls": 1,
        "must_contain_real_value": True,
    },
    {
        "key": "unknown_order",
        "label": "Order that doesn't exist",
        "prompt": "Where is my order 99999? I need the exact delivery status.",
        "should_call_tool": True,
        "max_tool_calls": 1,
        "must_not_fabricate_status": True,
    },
    {
        "key": "no_tool_needed",
        "label": "Question needing no tool",
        "prompt": "In general, what's a typical return policy window for online orders?",
        "should_call_tool": False,
        "max_tool_calls": 0,
    },
    {
        "key": "redundant_call_temptation",
        "label": "Tempts a redundant second call",
        "prompt": "Can you check the status of order 4521? Then double-check it again to be totally sure you got it right.",
        "should_call_tool": True,
        "max_tool_calls": 1,
    },
]


def run_trajectory(client: genai.Client, prompt: str, max_rounds: int = 2) -> dict:
    """Runs the tool-calling agent on one prompt, capturing every tool call
    made (name + args) and the eventual final answer."""
    user_content = types.Content(role="user", parts=[types.Part(text=prompt)])
    contents = [user_content]
    tool_calls: list[dict] = []
    final_answer = None

    for _ in range(max_rounds):
        resp = client.models.generate_content(model=MODEL, contents=contents, config=CONFIG)
        calls = resp.function_calls
        if not calls:
            final_answer = resp.text or ""
            break

        call = calls[0]
        call_args = dict(call.args) if call.args else {}
        tool_calls.append({"name": call.name, "args": call_args})

        if call.name == "get_order_status" and "order_id" in call_args:
            tool_result = get_order_status(call_args["order_id"])
        else:
            tool_result = {"error": "unsupported or malformed tool call"}

        function_response_part = types.Part.from_function_response(
            name=call.name,
            response={"result": tool_result},
        )
        contents = contents + [
            resp.candidates[0].content,
            types.Content(role="user", parts=[function_response_part]),
        ]

    if final_answer is None:
        # Ran out of rounds still trying to call tools — force a final
        # text answer so the trajectory always has something to grade.
        final = client.models.generate_content(model=MODEL, contents=contents, config=NO_TOOL_CONFIG)
        final_answer = final.text or ""

    return {"tool_calls": tool_calls, "final_answer": final_answer}


def score_trajectory(scenario: dict, trajectory: dict) -> dict:
    """Checks the trajectory against this scenario's expected-trajectory
    fields. Returns a dict of check_name -> {"passed": bool, "detail": str}."""
    checks: dict[str, dict] = {}
    tool_calls = trajectory["tool_calls"]
    final_answer_lower = trajectory["final_answer"].lower()

    called_tool = len(tool_calls) > 0
    expected_call = scenario["should_call_tool"]
    checks["called_tool_when_expected"] = {
        "passed": called_tool == expected_call,
        "detail": f"expected should_call_tool={expected_call}, got {len(tool_calls)} call(s)",
    }

    if "max_tool_calls" in scenario:
        checks["tool_call_count_within_limit"] = {
            "passed": len(tool_calls) <= scenario["max_tool_calls"],
            "detail": f"expected at most {scenario['max_tool_calls']} call(s), got {len(tool_calls)}",
        }

    if scenario.get("must_contain_real_value"):
        order_id = tool_calls[0]["args"].get("order_id") if tool_calls else None
        real = get_order_status(order_id) if order_id else {"status": "unknown"}
        real_status = real["status"].replace("_", " ")
        grounded = real_status in final_answer_lower or real["status"] in final_answer_lower
        checks["answer_grounded_in_tool_result"] = {
            "passed": grounded,
            "detail": f"expected the real status '{real_status}' to appear in the final answer",
        }

    if scenario.get("must_not_fabricate_status"):
        fabricated = any(word in final_answer_lower for word in REAL_STATUS_WORDS)
        checks["no_fabricated_status"] = {
            "passed": not fabricated,
            "detail": "expected no specific delivered/in-transit/lost claim for an order that doesn't exist",
        }

    passed = all(c["passed"] for c in checks.values())
    return {"checks": checks, "passed": passed}


def run_full_eval(client: genai.Client) -> dict:
    results = []
    for scenario in SCENARIOS:
        trajectory = run_trajectory(client, scenario["prompt"])
        verdict = score_trajectory(scenario, trajectory)
        results.append({
            "key": scenario["key"],
            "label": scenario["label"],
            "prompt": scenario["prompt"],
            "tool_calls": trajectory["tool_calls"],
            "final_answer": trajectory["final_answer"],
            "checks": verdict["checks"],
            "passed": verdict["passed"],
        })

    passed_count = sum(1 for r in results if r["passed"])
    return {
        "results": results,
        "passed_count": passed_count,
        "total": len(results),
        "score_pct": round(passed_count / len(results) * 100, 1),
    }


def main():
    if not os.environ.get("GEMINI_API_KEY"):
        print("ERROR: set GEMINI_API_KEY to run this module.")
        sys.exit(1)

    client = genai.Client()
    report = run_full_eval(client)

    for r in report["results"]:
        status = "PASS" if r["passed"] else "FAIL"
        print(f"\n[{status}] {r['label']} — \"{r['prompt']}\"")
        print(f"  tool calls: {r['tool_calls']}")
        print(f"  final answer: {r['final_answer'][:200]}")
        for name, check in r["checks"].items():
            mark = "✓" if check["passed"] else "✗"
            print(f"  {mark} {name}: {check['detail']}")

    print(f"\n=== {report['passed_count']}/{report['total']} scenarios passed ({report['score_pct']}%) ===")


if __name__ == "__main__":
    main()
