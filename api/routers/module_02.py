from fastapi import APIRouter
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

from ..module_loader import load_module

router = APIRouter(prefix="/api/02", tags=["02-embeddings-semantic"])
_mod = load_module("02-embeddings-semantic")
_model = SentenceTransformer("all-MiniLM-L6-v2")


class CompareRequest(BaseModel):
    query: str


class ScoredText(BaseModel):
    text: str
    score: float


class CompareResponse(BaseModel):
    tfidf: ScoredText
    semantic: ScoredText
    better_match: bool


@router.post("/compare", response_model=CompareResponse)
def compare(req: CompareRequest):
    tfidf_text, tfidf_score = _mod.tfidf_top1(_mod.TICKETS, [req.query])[req.query]
    sem_text, sem_score = _mod.semantic_top1(_mod.TICKETS, [req.query], _model)[req.query]
    return CompareResponse(
        tfidf=ScoredText(text=tfidf_text, score=tfidf_score),
        semantic=ScoredText(text=sem_text, score=sem_score),
        better_match=sem_score > tfidf_score + 0.15,
    )
