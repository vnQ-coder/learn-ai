from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..module_loader import load_module

router = APIRouter(prefix="/api/20", tags=["20-attention-mechanism"])
_mod = load_module("20-attention-mechanism")


class AttentionResponse(BaseModel):
    tokens: list[str]
    weights: list[list[float]]


@router.post("/compute", response_model=AttentionResponse)
def compute():
    try:
        result = _mod.compute_attention()
        return AttentionResponse(tokens=result["tokens"], weights=result["weights"])
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=str(e))
