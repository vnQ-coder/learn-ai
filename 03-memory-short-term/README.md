# 03 — Short-Term Memory (Sliding Window)

**Scenario:** a support chatbot booking a flight across several turns.
An early detail ("business class") needs to survive to the last turn.

**Concept:** sliding-window memory only keeps the last N turns. Make N
too small and the model silently loses earlier facts — this is exactly
what happens in real chat apps that truncate context naively.

**Run:**
```bash
export GEMINI_API_KEY=...
python main.py
```

**Expected output:** two conversations run back to back. With
`window_size=10` the final answer correctly recalls "business class."
With `window_size=2`, the printed buffer size shows only 2 turns held
at the end, and the final answer fails to recall the earlier detail.
