import os

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from ..module_loader import load_module
from ..streaming import sse

router = APIRouter(prefix="/api/27", tags=["27-model-evaluation"])
_mod = load_module("27-model-evaluation")


@router.post("/run/stream")
def run_stream():
    api_key = os.environ.get("GEMINI_API_KEY")

    def gen():
        if not api_key:
            yield sse({"type": "error", "message": "GEMINI_API_KEY is not set on the server"})
            return
        try:
            from google import genai
            client = genai.Client(api_key=api_key)
        except Exception as e:  # noqa: BLE001
            yield sse({"type": "error", "message": str(e)})
            return

        results = []
        try:
            for i, item in enumerate(_mod.EVAL_SET):
                r = _mod.run_eval_item(client, item)
                results.append(r)
                yield sse({
                    "type": "step",
                    "label": "eval_item",
                    "index": i,
                    "question": r["question"],
                    "response": r["response"],
                    "passed": r["passed"],
                    "expected_keywords": r["expected_keywords"],
                })
        except Exception as e:  # noqa: BLE001
            yield sse({"type": "error", "message": str(e)})
            return

        passed_count = sum(1 for r in results if r["passed"])
        total = len(_mod.EVAL_SET)
        yield sse({
            "type": "done",
            "results": results,
            "passed_count": passed_count,
            "total": total,
            "score_pct": round(passed_count / total * 100, 1),
        })

    return StreamingResponse(gen(), media_type="text/event-stream")
