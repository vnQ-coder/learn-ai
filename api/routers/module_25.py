from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..module_loader import load_module

router = APIRouter(prefix="/api/25", tags=["25-quantization"])
_mod = load_module("25-quantization")


class QuantizeRequest(BaseModel):
    num_weights: int | None = None


class QuantizeResponse(BaseModel):
    original: list[float]
    quantized_int8: list[int]
    dequantized: list[float]
    error: list[float]
    mean_abs_error: float
    max_abs_error: float
    num_weights: int
    fp32_bytes: int
    int8_bytes: int
    memory_reduction_factor: float


@router.post("/quantize", response_model=QuantizeResponse)
def quantize(req: QuantizeRequest):
    try:
        n = req.num_weights or 12
        n = max(4, min(n, 30))
        result = _mod.compute_demo(num_weights=n)
        return QuantizeResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
