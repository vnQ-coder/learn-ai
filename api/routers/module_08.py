import io
import time
from contextlib import redirect_stdout

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..module_loader import load_module

router = APIRouter(prefix="/api/08", tags=["08-agent-negotiation"])
_mod = load_module("08-agents-talking")


class NegotiateResponse(BaseModel):
    transcript: str


@router.post("/negotiate", response_model=NegotiateResponse)
def negotiate():
    server = _mod.start_budget_checker()
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
