"""Shared helpers for streaming live progress out of the frozen curriculum
modules without modifying them. The modules print their own progress via
print(); this relays each printed line to the caller the moment it's
written, by running the module's function in a background thread with
stdout redirected into a queue."""
import contextlib
import io
import json
import queue
import threading
from typing import Any, Callable, Iterator

_SENTINEL = object()


class _QueueWriter(io.TextIOBase):
    def __init__(self, q: "queue.Queue[Any]"):
        self._q = q
        self._buf = ""

    def write(self, s: str) -> int:
        self._buf += s
        while "\n" in self._buf:
            line, self._buf = self._buf.split("\n", 1)
            if line.strip():
                self._q.put(line)
        return len(s)

    def flush(self) -> None:
        pass


def stream_stdout_lines(fn: Callable, *args, **kwargs) -> Iterator[tuple[str, Any]]:
    """Runs fn(*args, **kwargs) in a background thread with stdout captured
    line-by-line. Yields ("line", text) as each line is printed, then
    exactly one of ("result", return_value) or ("error", exception)."""
    q: "queue.Queue[Any]" = queue.Queue()
    holder: dict[str, Any] = {}

    def runner():
        writer = _QueueWriter(q)
        try:
            with contextlib.redirect_stdout(writer):
                result = fn(*args, **kwargs)
            if writer._buf.strip():
                q.put(writer._buf)
            holder["result"] = result
        except Exception as e:  # noqa: BLE001
            holder["error"] = e
        finally:
            q.put(_SENTINEL)

    thread = threading.Thread(target=runner, daemon=True)
    thread.start()
    while True:
        item = q.get()
        if item is _SENTINEL:
            break
        yield ("line", item)
    thread.join()
    if "error" in holder:
        yield ("error", holder["error"])
    else:
        yield ("result", holder.get("result"))


def sse(event: dict) -> str:
    """Formats a dict as one Server-Sent Events message."""
    return f"data: {json.dumps(event)}\n\n"
