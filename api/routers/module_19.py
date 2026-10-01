from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..module_loader import load_module, REPO_ROOT

router = APIRouter(prefix="/api/19", tags=["19-incremental-indexing"])
_mod = load_module("19-incremental-indexing")
_mod.DB_PATH = str(REPO_ROOT / "19-incremental-indexing" / "chroma_data")


class Doc(BaseModel):
    id: str
    text: str


class StateResponse(BaseModel):
    docs: list[Doc]


class AddRequest(BaseModel):
    id: str
    text: str


class UpdateRequest(BaseModel):
    id: str
    text: str


class DeleteRequest(BaseModel):
    id: str


class QueryRequest(BaseModel):
    question: str


class QueryResult(BaseModel):
    id: str
    text: str
    distance: float


class QueryResponse(BaseModel):
    results: list[QueryResult]


@router.post("/reset", response_model=StateResponse)
def reset():
    try:
        _mod.reset_demo()
        return StateResponse(docs=_mod.list_all())
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=str(e))


@router.get("/state", response_model=StateResponse)
def state():
    try:
        return StateResponse(docs=_mod.list_all())
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=str(e))


@router.post("/add", response_model=StateResponse)
def add(req: AddRequest):
    try:
        _mod.add_document(req.id, req.text)
        return StateResponse(docs=_mod.list_all())
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=str(e))


@router.post("/update", response_model=StateResponse)
def update(req: UpdateRequest):
    try:
        _mod.update_document(req.id, req.text)
        return StateResponse(docs=_mod.list_all())
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=str(e))


@router.post("/delete", response_model=StateResponse)
def delete(req: DeleteRequest):
    try:
        _mod.delete_document(req.id)
        return StateResponse(docs=_mod.list_all())
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=str(e))


@router.post("/query", response_model=QueryResponse)
def query(req: QueryRequest):
    try:
        return QueryResponse(results=_mod.query(req.question))
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=str(e))
