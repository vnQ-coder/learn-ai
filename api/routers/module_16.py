import os

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from ..module_loader import load_module
from ..streaming import sse

router = APIRouter(prefix="/api/16", tags=["16-langgraph-pipeline"])
_mod = load_module("16-langgraph-pipeline")


class TriageRequest(BaseModel):
    ticket: str


@router.post("/triage/stream")
def triage_stream(req: TriageRequest):
    api_key = os.environ.get("GEMINI_API_KEY")

    def gen():
        if not api_key:
            yield sse({"type": "error", "message": "GEMINI_API_KEY is not set on the server"})
            return
        try:
            final_state: dict = {}
            for node_name, output in _mod.run_graph_streaming(api_key, req.ticket):
                final_state.update(output)
                yield sse({"type": "step", "label": node_name, **output})
            yield sse({"type": "done", **final_state})
        except Exception as e:  # noqa: BLE001
            yield sse({"type": "error", "message": str(e)})

    return StreamingResponse(gen(), media_type="text/event-stream")
