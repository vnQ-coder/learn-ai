from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

from ..module_loader import load_module

router = APIRouter(prefix="/api/18", tags=["18-hybrid-search"])
_mod = load_module("18-hybrid-search")
_model = SentenceTransformer("all-MiniLM-L6-v2")


class CompareRequest(BaseModel):
    query: str


class ScoredText(BaseModel):
    text: str
    score: float


class CompareResponse(BaseModel):
    bm25: list[ScoredText]
    vector: list[ScoredText]
    hybrid: list[ScoredText]


@router.post("/compare", response_model=CompareResponse)
def compare(req: CompareRequest):
    try:
        bm25_results = _mod.bm25_only(req.query, _mod.DOCS)
        vector_results = _mod.vector_only(req.query, _mod.DOCS, _model)
        hybrid_results = _mod.hybrid(req.query, _mod.DOCS, _model)
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=str(e))

    return CompareResponse(
        bm25=[ScoredText(**r) for r in bm25_results],
        vector=[ScoredText(**r) for r in vector_results],
        hybrid=[ScoredText(**r) for r in hybrid_results],
    )
