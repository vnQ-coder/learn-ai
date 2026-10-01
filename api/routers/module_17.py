import os

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from ..module_loader import load_module
from ..streaming import sse

router = APIRouter(prefix="/api/17", tags=["17-knowledge-graph"])
_mod = load_module("17-knowledge-graph")


class AskRequest(BaseModel):
    question: str


@router.get("/source")
def source():
    return {"text": _mod.SOURCE_TEXT}


@router.post("/ask/stream")
def ask_stream(req: AskRequest):
    api_key = os.environ.get("GEMINI_API_KEY")

    def gen():
        if not api_key:
            yield sse({"type": "error", "message": "GEMINI_API_KEY is not set on the server"})
            return
        try:
            from google import genai
            client = genai.Client(api_key=api_key)

            triples = _mod.extract_triples(client, _mod.SOURCE_TEXT)
            yield sse({"type": "step", "label": "extracting", "triples": triples})

            graph = _mod.build_graph(triples)
            entities = _mod.find_relevant_entities(req.question, graph)
            used_triples = _mod.traverse(graph, entities)
            yield sse({"type": "step", "label": "traversing", "entities": entities, "used_triples": used_triples})

            answer = _mod.answer_with_graph(client, req.question, used_triples)
            yield sse({
                "type": "done",
                "answer": answer,
                "triples": triples,
                "used_triples": used_triples,
            })
        except Exception as e:
            yield sse({"type": "error", "message": str(e)})

    return StreamingResponse(gen(), media_type="text/event-stream")
