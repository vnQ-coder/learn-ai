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
With `window_size=1`, the printed buffer size shows only 1 turn held
at the end, and the final answer fails to recall the earlier detail.
`window_size=1` (rather than 2) is used for the small-window demo
because with a window of 2 the model's own prior reply can still recap
the dropped fact, masking the forgetting effect this demo is meant to
show.
