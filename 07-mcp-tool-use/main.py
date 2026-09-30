"""Module 07: an MCP-style function-calling loop.

Scenario: an agent answering "where is my order" by calling a local
tool (standing in for an MCP tool server) instead of guessing.
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


def get_order_status(order_id: str) -> dict:
    """The local 'tool server' — in a real MCP setup this would be a
    separate process exposing this over the MCP protocol."""
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


def run_tool_loop(client: genai.Client, user_question: str):
    user_content = types.Content(role="user", parts=[types.Part(text=user_question)])
    resp = client.models.generate_content(
        model=MODEL,
        contents=[user_content],
        config=CONFIG,
    )

    calls = resp.function_calls
    if not calls:
        print(f"Final answer (no tool needed): {resp.text}")
        return

    call = calls[0]
    if call.name != "get_order_status":
        print(f"Model requested an unsupported tool: {call.name!r}; stopping.")
        return

    call_args = dict(call.args) if call.args else {}
    if "order_id" not in call_args:
        print(f"Model's tool call is missing 'order_id': {call_args}; stopping.")
        return
    print(f"Model requested tool call: {call.name}({call_args})")

    tool_result = get_order_status(call_args["order_id"])
    print(f"Tool result: {tool_result}")

    function_response_part = types.Part.from_function_response(
        name=call.name,
        response={"result": tool_result},
    )
    contents = [
        user_content,
        resp.candidates[0].content,
        types.Content(role="user", parts=[function_response_part]),
    ]

    final = client.models.generate_content(model=MODEL, contents=contents, config=CONFIG)
    if final.function_calls:
        # Don't build a second tool-call loop here; just avoid crashing on
        # a missing/empty final.text if the model asks for the tool again.
        print(f"Model asked for another tool call instead of a final answer: {final.text or '(model returned no final text)'}")
        return
    print(f"Final answer: {final.text or '(model returned no final text)'}")


def main():
    if not os.environ.get("GEMINI_API_KEY"):
        print("ERROR: set GEMINI_API_KEY to run this module.")
        sys.exit(1)
    client = genai.Client()
    run_tool_loop(client, "Where is my order 7788?")


if __name__ == "__main__":
    main()
