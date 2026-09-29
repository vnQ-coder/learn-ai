# 07 — MCP-Style Tool Use (Function Calling)

**Scenario:** an agent that answers "where is my order" by calling a
local tool for real data, standing in for an MCP tool server, instead
of guessing from training data.

**Concept:** the function-calling loop — the model decides to call a
tool, your code executes it and returns structured data, and the model
uses that result (not its own guess) to answer.

**Run:**
```bash
export GEMINI_API_KEY=...
python main.py
```

**Expected output:** the raw tool call the model requested, the tool's
returned result, and a final answer that correctly reflects that
result (e.g. "in transit, arriving 2026-10-02").
