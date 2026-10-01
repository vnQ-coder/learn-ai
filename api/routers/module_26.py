import os

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from ..module_loader import load_module
from ..streaming import sse

router = APIRouter(prefix="/api/26", tags=["26-reranking"])
_mod = load_module("26-reranking")


class SearchRequest(BaseModel):
    query: str


@router.post("/search/stream")
def search_stream(req: SearchRequest):
    api_key = os.environ.get("GEMINI_API_KEY")

    def gen():
        if not api_key:
            yield sse({"type": "error", "message": "GEMINI_API_KEY is not set on the server"})
            return
        try:
            initial = _mod.initial_retrieve(req.query)
            yield sse({"type": "step", "label": "initial", "results": initial})

            yield sse({"type": "step", "label": "reranking", "text": "Reranking candidates with an LLM judge..."})

            from google import genai
            client = genai.Client(api_key=api_key)
            reranked = _mod.rerank(client, req.query, initial)
            yield sse({"type": "done", "initial": initial, "reranked": reranked})
        except Exception as e:  # noqa: BLE001
            yield sse({"type": "error", "message": str(e)})

    return StreamingResponse(gen(), media_type="text/event-stream")
