from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel

from ..module_loader import load_module, REPO_ROOT

router = APIRouter(prefix="/api/04", tags=["04-long-term-memory"])
_mod = load_module("04-memory-long-term")
_mod.DB_PATH = str(REPO_ROOT / "04-memory-long-term" / "chroma_data")


class RememberRequest(BaseModel):
    fact: str


class RememberResponse(BaseModel):
    id: str


class RecallRequest(BaseModel):
    query: str


class RecallResponse(BaseModel):
    result: Optional[str]
    distance: Optional[float]


@router.post("/remember", response_model=RememberResponse)
def remember(req: RememberRequest):
    next_id = str(_mod.get_collection().count())
    _mod.remember(req.fact)
    return RememberResponse(id=next_id)


@router.post("/recall", response_model=RecallResponse)
def recall(req: RecallRequest):
    coll = _mod.get_collection()
    if coll.count() == 0:
        return RecallResponse(result=None, distance=None)
    results = coll.query(query_texts=[req.query], n_results=1)
    docs = results["documents"][0]
    dists = results["distances"][0]
    if not docs:
        return RecallResponse(result=None, distance=None)
    return RecallResponse(result=docs[0], distance=dists[0])
