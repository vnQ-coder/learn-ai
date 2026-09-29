# AI Learning Curriculum

Runnable lessons on production RAG, embeddings, agent memory, and
multi-agent communication. Each numbered folder is standalone: read its
README, run its `main.py`.

| # | Module | Concept |
|---|--------|---------|
| 01 | embeddings-normal | TF-IDF / keyword search and its limits |
| 02 | embeddings-semantic | Semantic embeddings vs. module 01 |
| 03 | memory-short-term | Sliding-window conversation memory |
| 04 | memory-long-term | Persistent cross-session memory |
| 05 | rag-production | Full hybrid-search RAG pipeline |
| 06 | rag-evaluation-guardrails | Hallucination detection & refusal |
| 07 | mcp-tool-use | Tool/function-calling loop |
| 08 | agents-talking | Agent-to-agent negotiation protocol |
| 09 | agents-shared-knowledge | Blackboard pattern across 3 agents |

## Setup

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export GEMINI_API_KEY=...   # required for modules 03, 05, 06, 07, 09
```
