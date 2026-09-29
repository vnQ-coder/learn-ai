# 09 — Agents Sharing Knowledge (Blackboard Pattern)

**Scenario:** a researcher agent, a fact-checker agent, and a writer
agent collaborate on a short report — reading and writing a shared
knowledge store instead of messaging each other directly.

**Concept:** the blackboard pattern. Each agent only needs to know the
shape of the shared store, not the other agents' internals — the
fact-checker can see the researcher's raw findings, and the writer can
see the fact-checker's verdict, purely through the shared board.

**Run:**
```bash
export GEMINI_API_KEY=...
python main.py
```

**Expected output:** three blackboard dumps, one after each agent runs,
each showing one more entry than before, ending with a final 3-sentence
report that reflects both the research and the fact-check.
