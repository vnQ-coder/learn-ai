import os
from typing import Optional

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

from ..module_loader import load_module, REPO_ROOT
from ..streaming import sse

router = APIRouter(prefix="/api/06", tags=["06-rag-guardrails"])
_mod = load_module("06-rag-evaluation-guardrails")
_model = SentenceTransformer("all-MiniLM-L6-v2")

_docs = _mod.load_markdown_files(str(REPO_ROOT / "ui" / "example_docs"))
_chunks = [c for path, text in _docs for c in _mod.chunk_text(path, text)]
_embeddings, _bm25 = _mod.build_index(_chunks, _model)


class AskRequest(BaseModel):
    question: str


class AskResponse(BaseModel):
    top_raw_vector_score: Optional[float]
    result: str


@router.post("/ask", response_model=AskResponse)
def ask(req: AskRequest):
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=400, detail="GEMINI_API_KEY is not set on the server")
    retrieved = _mod.hybrid_search(req.question, _chunks, _embeddings, _bm25, _model)
    top_score = retrieved[0]["raw_vector_score"] if retrieved else None
    try:
        from google import genai
        client = genai.Client(api_key=api_key)
        result = _mod.answer_with_guardrails(client, req.question, retrieved)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
    return AskResponse(top_raw_vector_score=top_score, result=result)


@router.post("/ask/stream")
def ask_stream(req: AskRequest):
    api_key = os.environ.get("GEMINI_API_KEY")

    def gen():
        if not api_key:
            yield sse({"type": "error", "message": "GEMINI_API_KEY is not set on the server"})
            return
        yield sse({"type": "step", "label": "retrieving", "text": "Searching your documents..."})
        retrieved = _mod.hybrid_search(req.question, _chunks, _embeddings, _bm25, _model)
        top_score = retrieved[0]["raw_vector_score"] if retrieved else None
        yield sse({
            "type": "step",
            "label": "retrieved",
            "text": f"Found {len(retrieved)} chunk(s), top relevance {top_score:.3f}" if top_score is not None else "No chunks found",
            "top_raw_vector_score": top_score,
        })
        yield sse({"type": "step", "label": "checking", "text": "Checking retrieval confidence before answering..."})
        try:
            from google import genai
            client = genai.Client(api_key=api_key)
            result = _mod.answer_with_guardrails(client, req.question, retrieved)
        except Exception as e:
            yield sse({"type": "error", "message": str(e)})
            return
        yield sse({"type": "done", "top_raw_vector_score": top_score, "result": result})

    return StreamingResponse(gen(), media_type="text/event-stream")
