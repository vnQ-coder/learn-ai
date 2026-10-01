# 13 — ReAct Architecture (Reasoning + Acting)

**Scenario:** an agent answers a multi-step math/budget question by
interleaving Thought, Action, and Observation steps, calling a real
(sandboxed) calculator tool whenever it needs to compute something,
instead of guessing the arithmetic.

**Concept:** the ReAct pattern — the model's reasoning ("Thought") and
its tool use ("Action" → "Observation") are interleaved and visible at
every step, so the final answer is grounded in real intermediate
results rather than a single opaque generation. This is implemented by
hand (no framework) so the raw loop is visible; contrast with module 14
(Plan-and-Execute, which plans everything upfront) and modules 15/16
(LangChain/LangGraph, which use real frameworks for comparison).

**Run:**
```bash
export GEMINI_API_KEY=...
python main.py
```

**Expected output:** a sequence of `Thought:` / `Action: calculator[...]`
/ `Observation:` lines, ending with a `Final Answer:` whose arithmetic
traces back to the calculator's own output above it.
