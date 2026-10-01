import io
import os
from contextlib import redirect_stdout

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..module_loader import load_module

router = APIRouter(prefix="/api/07", tags=["07-tool-use"])
_mod = load_module("07-mcp-tool-use")


class AskRequest(BaseModel):
    question: str


class AskResponse(BaseModel):
    transcript: str


@router.post("/ask", response_model=AskResponse)
def ask(req: AskRequest):
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=400, detail="GEMINI_API_KEY is not set on the server")
    try:
        from google import genai
        client = genai.Client(api_key=api_key)
        buf = io.StringIO()
        with redirect_stdout(buf):
            _mod.run_tool_loop(client, req.question)
        return AskResponse(transcript=buf.getvalue())
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
