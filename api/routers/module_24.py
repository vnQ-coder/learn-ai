from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from ..module_loader import load_module

router = APIRouter(prefix="/api/24", tags=["24-kv-cache"])
_mod = load_module("24-kv-cache")


class SimulateRequest(BaseModel):
    num_tokens: int = Field(default=20, ge=1, le=200)


class Step(BaseModel):
    step: int
    naive_cumulative_ops: int
    cached_cumulative_ops: int
    cache_memory_mb: float


class SimulateResponse(BaseModel):
    steps: list[Step]
    final_naive_ops: int
    final_cached_ops: int
    speedup_factor: float
    final_cache_memory_mb: float


@router.post("/simulate", response_model=SimulateResponse)
def simulate(req: SimulateRequest):
    try:
        result = _mod.simulate(num_tokens=req.num_tokens)
        return SimulateResponse(**result)
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=str(e))
