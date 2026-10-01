from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..module_loader import load_module, REPO_ROOT

router = APIRouter(prefix="/api/29", tags=["29-vector-databases"])
_mod = load_module("29-vector-databases")
_mod.DB_PATH = str(REPO_ROOT / "29-vector-databases" / "chroma_data")


class BenchmarkResult(BaseModel):
    corpus_size: int
    brute_force_ms: float
    indexed_ms: float


class BenchmarkResponse(BaseModel):
    results: list[BenchmarkResult]


@router.post("/benchmark", response_model=BenchmarkResponse)
def benchmark():
    try:
        return BenchmarkResponse(**_mod.benchmark())
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=str(e))
