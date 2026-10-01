from typing import Optional

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

from ..module_loader import load_module, REPO_ROOT

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
def ask(req: AskRequest, x_gemini_api_key: Optional[str] = Header(None)):
    if not x_gemini_api_key:
        raise HTTPException(status_code=400, detail="Missing X-Gemini-Api-Key header")
    retrieved = _mod.hybrid_search(req.question, _chunks, _embeddings, _bm25, _model)
    try:
        from google import genai
        client = genai.Client(api_key=x_gemini_api_key)
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
