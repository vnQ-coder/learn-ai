import os

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

from ..module_loader import load_module, REPO_ROOT
from ..streaming import sse

router = APIRouter(prefix="/api/05", tags=["05-production-rag"])
_mod = load_module("05-rag-production")
_model = SentenceTransformer("all-MiniLM-L6-v2")

_docs = _mod.load_markdown_files(str(REPO_ROOT / "ui" / "example_docs"))
_chunks = [c for path, text in _docs for c in _mod.chunk_text(path, text)]
_embeddings, _bm25 = _mod.build_index(_chunks, _model)


class AskRequest(BaseModel):
    question: str


class RetrievedChunk(BaseModel):
    source: str
    score: float
    raw_vector_score: float


class AskResponse(BaseModel):
    retrieved: list[RetrievedChunk]
    answer: str


@router.post("/ask", response_model=AskResponse)
def ask(req: AskRequest):
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=400, detail="GEMINI_API_KEY is not set on the server")
    retrieved = _mod.hybrid_search(req.question, _chunks, _embeddings, _bm25, _model)
    try:
        from google import genai
        client = genai.Client(api_key=api_key)
        answer = _mod.answer_question(client, req.question, retrieved)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
    return AskResponse(
        retrieved=[
            RetrievedChunk(source=r["source"], score=r["score"], raw_vector_score=r["raw_vector_score"])
            for r in retrieved
        ],
        answer=answer,
    )


@router.post("/ask/stream")
def ask_stream(req: AskRequest):
    api_key = os.environ.get("GEMINI_API_KEY")

    def gen():
        if not api_key:
            yield sse({"type": "error", "message": "GEMINI_API_KEY is not set on the server"})
            return
        yield sse({"type": "step", "label": "retrieving", "text": "Searching your documents..."})
        retrieved = _mod.hybrid_search(req.question, _chunks, _embeddings, _bm25, _model)
        chunks_payload = [
            {"source": r["source"], "score": r["score"], "raw_vector_score": r["raw_vector_score"]}
            for r in retrieved
        ]
        yield sse({
            "type": "step",
            "label": "retrieved",
            "text": f"Found {len(retrieved)} relevant chunk(s)",
            "chunks": chunks_payload,
        })
        yield sse({"type": "step", "label": "generating", "text": "Asking Gemini for a grounded answer..."})
        try:
            from google import genai
            client = genai.Client(api_key=api_key)
            answer = _mod.answer_question(client, req.question, retrieved)
        except Exception as e:
            yield sse({"type": "error", "message": str(e)})
            return
        yield sse({"type": "done", "retrieved": chunks_payload, "answer": answer})

    return StreamingResponse(gen(), media_type="text/event-stream")
