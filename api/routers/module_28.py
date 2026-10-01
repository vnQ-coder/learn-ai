import os

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from ..module_loader import load_module
from ..streaming import sse

router = APIRouter(prefix="/api/28", tags=["28-llm-as-judge"])
_mod = load_module("28-llm-as-judge")


@router.post("/judge/stream")
def judge_stream():
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

        yield sse({"type": "step", "label": "judging", "text": "The judge model is comparing both answers..."})

        try:
            verdict = _mod.judge(client, _mod.QUESTION, _mod.CANDIDATE_A, _mod.CANDIDATE_B)
        except Exception as e:
            yield sse({"type": "error", "message": str(e)})
            return

        yield sse({
            "type": "done",
            "question": _mod.QUESTION,
            "candidate_a": _mod.CANDIDATE_A,
            "candidate_b": _mod.CANDIDATE_B,
            **verdict,
        })

    return StreamingResponse(gen(), media_type="text/event-stream")
