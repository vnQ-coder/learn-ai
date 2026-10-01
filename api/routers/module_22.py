from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..module_loader import load_module

router = APIRouter(prefix="/api/22", tags=["22-positional-encoding"])
_mod = load_module("22-positional-encoding")


class ComputeResponse(BaseModel):
    tokens: list[str]
    pe_matrix: list[list[float]]
    diff_without_pe: float
    diff_with_pe: float


@router.post("/compute", response_model=ComputeResponse)
def compute():
    try:
        result = _mod.compute_demo()
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=str(e))
    return ComputeResponse(**result)
