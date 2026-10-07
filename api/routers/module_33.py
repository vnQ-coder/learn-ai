import os

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from ..module_loader import load_module
from ..streaming import sse

router = APIRouter(prefix="/api/33", tags=["33-agent-evaluation"])
_mod = load_module("33-agent-evaluation")


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
            for i, scenario in enumerate(_mod.SCENARIOS):
                trajectory = _mod.run_trajectory(client, scenario["prompt"])
                verdict = _mod.score_trajectory(scenario, trajectory)
                r = {
                    "key": scenario["key"],
                    "label": scenario["label"],
                    "prompt": scenario["prompt"],
                    "tool_calls": trajectory["tool_calls"],
                    "final_answer": trajectory["final_answer"],
                    "checks": verdict["checks"],
                    "passed": verdict["passed"],
                }
                results.append(r)
                # Spread r LAST so its own "label" (the scenario's human label,
                # e.g. "Clean order lookup") doesn't get silently overwritten
                # by the envelope's "scenario" marker — and vice versa, put
                # the envelope keys after the spread so "step_kind" always wins.
                yield sse({"type": "step", **r, "step_kind": "scenario", "index": i})
        except Exception as e:  # noqa: BLE001
            yield sse({"type": "error", "message": str(e)})
            return

        passed_count = sum(1 for r in results if r["passed"])
        total = len(_mod.SCENARIOS)
        yield sse({
            "type": "done",
            "results": results,
            "passed_count": passed_count,
            "total": total,
            "score_pct": round(passed_count / total * 100, 1),
        })

    return StreamingResponse(gen(), media_type="text/event-stream")
