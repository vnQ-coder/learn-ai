import io
import os
from contextlib import redirect_stdout

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from ..module_loader import load_module
from ..streaming import sse, stream_stdout_lines

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


@router.post("/ask/stream")
def ask_stream(req: AskRequest):
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
        lines: list[str] = []
        for kind, payload in stream_stdout_lines(_mod.run_tool_loop, client, req.question):
            if kind == "line":
                lines.append(payload)
                yield sse({"type": "step", "text": payload})
            elif kind == "error":
                yield sse({"type": "error", "message": str(payload)})
            else:
                yield sse({"type": "done", "transcript": "\n".join(lines)})

    return StreamingResponse(gen(), media_type="text/event-stream")
