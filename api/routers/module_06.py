from typing import Optional

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

from ..module_loader import load_module, REPO_ROOT

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
def ask(req: AskRequest, x_gemini_api_key: Optional[str] = Header(None)):
    if not x_gemini_api_key:
        raise HTTPException(status_code=400, detail="Missing X-Gemini-Api-Key header")
    retrieved = _mod.hybrid_search(req.question, _chunks, _embeddings, _bm25, _model)
    top_score = retrieved[0]["raw_vector_score"] if retrieved else None
    try:
        from google import genai
        client = genai.Client(api_key=x_gemini_api_key)
        result = _mod.answer_with_guardrails(client, req.question, retrieved)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
    return AskResponse(top_raw_vector_score=top_score, result=result)
