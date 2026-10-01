import os

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..module_loader import load_module

router = APIRouter(prefix="/api/12", tags=["12-human-feedback-loop"])
_mod = load_module("12-human-feedback-loop")


class DraftRequest(BaseModel):
    complaint: str


class ReviseRequest(BaseModel):
    complaint: str
    previous_draft: str
    feedback: str


class DraftResponse(BaseModel):
    draft: str


def _require_client():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=400, detail="GEMINI_API_KEY is not set on the server")
    from google import genai
    return genai.Client(api_key=api_key)


@router.post("/draft", response_model=DraftResponse)
def draft(req: DraftRequest):
    client = _require_client()
    try:
        draft_text = _mod.draft_reply(client, req.complaint)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
    return DraftResponse(draft=draft_text)


@router.post("/revise", response_model=DraftResponse)
def revise(req: ReviseRequest):
    client = _require_client()
    try:
        revised_text = _mod.revise_reply(client, req.complaint, req.previous_draft, req.feedback)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
    return DraftResponse(draft=revised_text)
