import os

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from ..module_loader import load_module
from ..streaming import sse

router = APIRouter(prefix="/api/11", tags=["11-observability-tracing"])
_mod = load_module("11-observability-tracing")


class TraceRequest(BaseModel):
    question: str


@router.post("/trace/stream")
def trace_stream(req: TraceRequest):
    api_key = os.environ.get("GEMINI_API_KEY")

    def gen():
        if not api_key:
            yield sse({"type": "error", "message": "GEMINI_API_KEY is not set on the server"})
            return
        try:
            from google import genai
            client = genai.Client(api_key=api_key)
            spans, answer = _mod.run_traced(client, req.question)
        except Exception as e:
            yield sse({"type": "error", "message": str(e)})
            return

        for span in spans:
            yield sse({"type": "step", "label": "span", **span})

        total_ms = round(sum(s["duration_ms"] for s in spans), 1)
        total_cost_usd = round(sum(s["cost_usd"] for s in spans), 6)
        yield sse({
            "type": "done",
            "answer": answer,
            "spans": spans,
            "total_ms": total_ms,
            "total_cost_usd": total_cost_usd,
        })

    return StreamingResponse(gen(), media_type="text/event-stream")
