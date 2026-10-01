from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..module_loader import load_module

router = APIRouter(prefix="/api/21", tags=["21-multi-head-attention"])
_mod = load_module("21-multi-head-attention")


class MultiHeadResponse(BaseModel):
    tokens: list[str]
    num_heads: int
    per_head_weights: list[list[list[float]]]


@router.post("/compute", response_model=MultiHeadResponse)
def compute():
    try:
        result = _mod.compute_multi_head_attention()
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=str(e))
    return MultiHeadResponse(
        tokens=result["tokens"],
        num_heads=result["num_heads"],
        per_head_weights=result["per_head_weights"],
    )
