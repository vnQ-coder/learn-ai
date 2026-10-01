import io
from contextlib import redirect_stdout
from typing import Optional

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel

from ..module_loader import load_module

router = APIRouter(prefix="/api/07", tags=["07-tool-use"])
_mod = load_module("07-mcp-tool-use")


class AskRequest(BaseModel):
    question: str


class AskResponse(BaseModel):
    transcript: str


@router.post("/ask", response_model=AskResponse)
def ask(req: AskRequest, x_gemini_api_key: Optional[str] = Header(None)):
    if not x_gemini_api_key:
        raise HTTPException(status_code=400, detail="Missing X-Gemini-Api-Key header")
    try:
        from google import genai
        client = genai.Client(api_key=x_gemini_api_key)
        buf = io.StringIO()
        with redirect_stdout(buf):
            _mod.run_tool_loop(client, req.question)
        return AskResponse(transcript=buf.getvalue())
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
