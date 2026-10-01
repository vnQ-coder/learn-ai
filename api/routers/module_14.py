import os

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from ..module_loader import load_module
from ..streaming import sse

router = APIRouter(prefix="/api/14", tags=["14-plan-and-execute"])
_mod = load_module("14-plan-and-execute")


class RunRequest(BaseModel):
    goal: str


@router.post("/run/stream")
def run_stream(req: RunRequest):
    api_key = os.environ.get("GEMINI_API_KEY")

    def gen():
        if not api_key:
            yield sse({"type": "error", "message": "GEMINI_API_KEY is not set on the server"})
            return
        try:
            from google import genai
            client = genai.Client(api_key=api_key)
        except Exception as e:
            yield sse({"type": "error", "message": str(e)})
            return

        try:
            plan = _mod.make_plan(client, req.goal)
        except Exception as e:
            yield sse({"type": "error", "message": str(e)})
            return
        yield sse({"type": "step", "label": "plan", "steps": plan})

        results: list[str] = []
        for i, step in enumerate(plan):
            yield sse({"type": "step", "label": "executing", "index": i, "step_text": step})
            try:
                prior_context = "\n".join(results)
                result = _mod.execute_step(client, req.goal, step, prior_context)
            except Exception as e:
                yield sse({"type": "error", "message": str(e)})
                return
            results.append(result)
            yield sse({"type": "step", "label": "step_done", "index": i, "result": result})

        try:
            final_answer = _mod.synthesize(client, req.goal, results)
        except Exception as e:
            yield sse({"type": "error", "message": str(e)})
            return

        yield sse({
            "type": "done",
            "plan": plan,
            "results": results,
            "final_answer": final_answer,
        })

    return StreamingResponse(gen(), media_type="text/event-stream")
