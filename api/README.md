# AI Learning Curriculum API

FastAPI wrapper around the numbered curriculum modules (`0N-topic/main.py`).

## Running

From the repo root:

```bash
uvicorn api.main:app --reload --port 8000
```

## Per-request API keys

Endpoints for modules 05, 06, 07, and 09 accept an `X-Gemini-Api-Key` header
and pass the key directly into the underlying module's client construction.
This gives true per-request isolation — no shared state between concurrent
requests with different keys.

## Known exception: module 03

Module 03's underlying `03-memory-short-term/main.py` constructs its own
`genai.Client()` internally, so it can't take a key as a parameter. The
`/api/03/conversation` endpoint works around this by temporarily setting
`GEMINI_API_KEY` (and clearing/restoring `GOOGLE_API_KEY`, which the SDK
prefers if set) in the process environment for the duration of each call.

This means concurrent requests to `/api/03/conversation` using different
keys could race with each other. This is acceptable for a local,
single-user learning tool, but is not safe for concurrent multi-user use.

## stdout capture caveat

Modules 03, 07, and 08 capture their underlying module's output via a
process-wide `redirect_stdout` swap during the call. Like the env var
swap above, this has the same single-user caveat: concurrent requests to
these endpoints could interleave or steal each other's captured output.
