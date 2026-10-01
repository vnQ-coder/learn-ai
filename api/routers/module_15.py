import os

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from ..module_loader import load_module
from ..streaming import sse

router = APIRouter(prefix="/api/15", tags=["15-langchain-pipeline"])
_mod = load_module("15-langchain-pipeline")


class TriageRequest(BaseModel):
    email: str


@router.post("/triage/stream")
def triage_stream(req: TriageRequest):
    api_key = os.environ.get("GEMINI_API_KEY")

    def gen():
        if not api_key:
            yield sse({"type": "error", "message": "GEMINI_API_KEY is not set on the server"})
            return
        try:
            yield sse({"type": "step", "label": "summarizing", "text": "LangChain chain 1 (prompt | llm | parser): summarizing the email..."})
            summary = _mod.summarize(api_key, req.email)
            yield sse({"type": "step", "label": "summarized", "text": summary})

            yield sse({"type": "step", "label": "classifying", "text": "LangChain chain 2 (prompt | llm.with_structured_output): classifying..."})
            classification = _mod.classify(api_key, summary)
            yield sse({
                "type": "done",
                "summary": summary,
                "category": classification.category,
                "priority": classification.priority,
                "sentiment": classification.sentiment,
            })
        except Exception as e:  # noqa: BLE001
            yield sse({"type": "error", "message": str(e)})

    return StreamingResponse(gen(), media_type="text/event-stream")
