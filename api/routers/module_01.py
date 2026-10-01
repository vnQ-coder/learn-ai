from fastapi import APIRouter
from pydantic import BaseModel

from ..module_loader import load_module

router = APIRouter(prefix="/api/01", tags=["01-embeddings-normal"])
_mod = load_module("01-embeddings-normal")


class SearchRequest(BaseModel):
    query: str


class SearchResult(BaseModel):
    text: str
    score: float
    match: bool


class SearchResponse(BaseModel):
    results: list[SearchResult]


@router.post("/search", response_model=SearchResponse)
def search(req: SearchRequest):
    raw = _mod.search(_mod.TICKETS, [req.query])[req.query]
    results = [SearchResult(text=t, score=s, match=s > 0.05) for t, s in raw]
    return SearchResponse(results=results)
