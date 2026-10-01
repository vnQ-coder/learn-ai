from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..module_loader import load_module

router = APIRouter(prefix="/api/23", tags=["23-tokenization"])
_mod = load_module("23-tokenization")


class TokenizeRequest(BaseModel):
    text: str


class TokenizeResponse(BaseModel):
    text: str
    real_tokens: list[str]
    real_token_ids: list[int]
    real_token_count: int
    naive_tokens: list[str]
    naive_token_count: int


@router.post("/tokenize", response_model=TokenizeResponse)
def tokenize(req: TokenizeRequest):
    try:
        return TokenizeResponse(**_mod.tokenize(req.text))
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=str(e))
