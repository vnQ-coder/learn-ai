import os
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..module_loader import load_module

router = APIRouter(prefix="/api/09", tags=["09-shared-knowledge"])
_mod = load_module("09-agents-shared-knowledge")


class RunRequest(BaseModel):
    topic: str


class Stage(BaseModel):
    agent: str
    key: str
    value: str


class RunResponse(BaseModel):
    stages: list[Stage]
    final_report: Optional[str]


@router.post("/run", response_model=RunResponse)
def run(req: RunRequest):
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=400, detail="GEMINI_API_KEY is not set on the server")
    try:
        from google import genai
        client = genai.Client(api_key=api_key)
        board = _mod.Blackboard()
        _mod.researcher_agent(client, board, req.topic)
        _mod.fact_checker_agent(client, board)
        _mod.writer_agent(client, board, req.topic)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
    entries = board.read_all()
    final = next((e["value"] for e in entries if e["key"] == "final_report"), None)
    return RunResponse(
        stages=[Stage(agent=e["agent"], key=e["key"], value=e["value"]) for e in entries],
        final_report=final,
    )
