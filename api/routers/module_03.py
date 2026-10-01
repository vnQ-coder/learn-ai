import io
import os
from contextlib import redirect_stdout

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from ..module_loader import load_module

router = APIRouter(prefix="/api/03", tags=["03-short-term-memory"])
_mod = load_module("03-memory-short-term")


class ConversationRequest(BaseModel):
    window_size: int = Field(ge=1, le=50)


class ConversationResponse(BaseModel):
    transcript: str


@router.post("/conversation", response_model=ConversationResponse)
def conversation(req: ConversationRequest):
    if not os.environ.get("GEMINI_API_KEY"):
        raise HTTPException(status_code=400, detail="GEMINI_API_KEY is not set on the server")

    try:
        buf = io.StringIO()
        with redirect_stdout(buf):
            _mod.run_conversation(window_size=req.window_size)
        return ConversationResponse(transcript=buf.getvalue())
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
