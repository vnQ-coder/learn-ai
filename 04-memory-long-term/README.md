# 04 — Long-Term Memory (Persistent, Cross-Session)

**Scenario:** a personal assistant that remembers "I'm vegetarian" and
recalls it correctly in a completely separate process run later.

**Concept:** long-term memory means writing to storage that survives
past the current process — here, a local persistent Chroma vector
store on disk — and retrieving by semantic similarity, not by exact key.

**Run (two separate invocations, on purpose):**
```bash
python main.py remember "I'm vegetarian"
python main.py recall "what should I eat"
```

**Expected output:** the second command, run as a fresh process, finds
and prints the fact stored by the first command. Running `recall`
before ever running `remember` (on a fresh `chroma_data/`) prints
"Nothing remembered yet." instead of crashing.
