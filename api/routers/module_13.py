import os

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from ..module_loader import load_module
from ..streaming import sse

router = APIRouter(prefix="/api/13", tags=["13-react-architecture"])
_mod = load_module("13-react-architecture")


class AskRequest(BaseModel):
    question: str


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
            steps = _mod.react_loop(client, req.question)
        except Exception as e:
            yield sse({"type": "error", "message": str(e)})
            return

        for step in steps:
            kind = step["type"]
            if kind == "action":
                yield sse({"type": "step", "kind": "action", "tool": step["tool"], "input": step["input"]})
            else:
                yield sse({"type": "step", "kind": kind, "text": step.get("text", "")})

        final_answer = steps[-1]["text"] if steps and steps[-1]["type"] == "final" else None
        yield sse({"type": "done", "steps": steps, "final_answer": final_answer})

    return StreamingResponse(gen(), media_type="text/event-stream")
