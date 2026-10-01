import io
import time
from contextlib import redirect_stdout

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from ..module_loader import load_module
from ..streaming import sse, stream_stdout_lines

router = APIRouter(prefix="/api/08", tags=["08-agent-negotiation"])
_mod = load_module("08-agents-talking")


class NegotiateResponse(BaseModel):
    transcript: str


@router.post("/negotiate", response_model=NegotiateResponse)
def negotiate():
    try:
        server = _mod.start_budget_checker()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Could not start negotiation server: {e}")
    try:
        time.sleep(0.2)
        buf = io.StringIO()
        with redirect_stdout(buf):
            _mod.negotiate(initial_amount=2000)
        return NegotiateResponse(transcript=buf.getvalue())
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
    finally:
        server.shutdown()
        server.server_close()


@router.post("/negotiate/stream")
def negotiate_stream():
    def gen():
        try:
            server = _mod.start_budget_checker()
        except Exception as e:
            yield sse({"type": "error", "message": f"Could not start negotiation server: {e}"})
            return
        try:
            time.sleep(0.2)
            lines: list[str] = []
            for kind, payload in stream_stdout_lines(_mod.negotiate, initial_amount=2000):
                if kind == "line":
                    lines.append(payload)
                    yield sse({"type": "step", "text": payload})
                elif kind == "error":
                    yield sse({"type": "error", "message": str(payload)})
                else:
                    yield sse({"type": "done", "transcript": "\n".join(lines)})
        finally:
            server.shutdown()
            server.server_close()

    return StreamingResponse(gen(), media_type="text/event-stream")
