import os

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from ..module_loader import load_module
from ..streaming import sse

router = APIRouter(prefix="/api/10", tags=["10-multi-agent-orchestration"])
_mod = load_module("10-multi-agent-orchestration")


class RouteRequest(BaseModel):
    request: str


@router.post("/route/stream")
def route_stream(req: RouteRequest):
    api_key = os.environ.get("GEMINI_API_KEY")

    def gen():
        if not api_key:
            yield sse({"type": "error", "message": "GEMINI_API_KEY is not set on the server"})
            return
        try:
            from google import genai
            client = genai.Client(api_key=api_key)
        except Exception as e:
            yield sse({"type": "error", "message": str(e)})
            return

        yield sse({"type": "step", "label": "routing", "text": "Supervisor is deciding which specialist should handle this..."})
        try:
            specialist = _mod.supervisor_route(client, req.request)
        except Exception as e:
            yield sse({"type": "error", "message": str(e)})
            return
        yield sse({"type": "step", "label": "routed", "specialist": specialist})

        yield sse({"type": "step", "label": "responding", "text": f"{specialist} specialist is drafting a reply..."})
        try:
            reply = _mod.specialist_reply(client, specialist, req.request)
        except Exception as e:
            yield sse({"type": "error", "message": str(e)})
            return

        yield sse({"type": "done", "specialist": specialist, "reply": reply})

    return StreamingResponse(gen(), media_type="text/event-stream")
