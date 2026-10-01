import io
import os
from contextlib import redirect_stdout
from typing import Optional

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field

from ..module_loader import load_module

router = APIRouter(prefix="/api/03", tags=["03-short-term-memory"])
_mod = load_module("03-memory-short-term")


class ConversationRequest(BaseModel):
    window_size: int = Field(ge=1, le=50)


class ConversationResponse(BaseModel):
    transcript: str


@router.post("/conversation", response_model=ConversationResponse)
def conversation(req: ConversationRequest, x_gemini_api_key: Optional[str] = Header(None)):
    if not x_gemini_api_key:
        raise HTTPException(status_code=400, detail="Missing X-Gemini-Api-Key header")

    previous = os.environ.get("GEMINI_API_KEY")
    os.environ["GEMINI_API_KEY"] = x_gemini_api_key
    try:
        buf = io.StringIO()
        with redirect_stdout(buf):
            _mod.run_conversation(window_size=req.window_size)
        return ConversationResponse(transcript=buf.getvalue())
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
    finally:
        if previous is None:
            os.environ.pop("GEMINI_API_KEY", None)
        else:
            os.environ["GEMINI_API_KEY"] = previous
