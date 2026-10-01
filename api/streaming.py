"""Shared helpers for streaming live progress out of the frozen curriculum
modules without modifying them. The modules print their own progress via
print(); this relays each printed line to the caller the moment it's
written, by running the module's function in a background thread with
stdout captured into a queue.

sys.stdout is process-global, so two concurrent streamed requests cannot
each use contextlib.redirect_stdout independently without their printed
lines crossing into each other's queue. Instead, a single dispatcher is
installed as sys.stdout once; it routes each write() to the queue
registered for the calling thread, so concurrent streams never interleave."""
import io
import json
import queue
import sys
import threading
from typing import Any, Callable, Iterator

_SENTINEL = object()
_real_stdout = sys.stdout
_writers_by_thread: dict[int, "_QueueWriter"] = {}
_lock = threading.Lock()


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


class _DispatchingStdout(io.TextIOBase):
    """Routes writes to the _QueueWriter registered for the current thread,
    falling back to the real stdout for unregistered threads."""

    def write(self, s: str) -> int:
        writer = _writers_by_thread.get(threading.get_ident())
        if writer is not None:
            return writer.write(s)
        return _real_stdout.write(s)

    def flush(self) -> None:
        pass


def _ensure_dispatcher_installed() -> None:
    if not isinstance(sys.stdout, _DispatchingStdout):
        sys.stdout = _DispatchingStdout()


def stream_stdout_lines(fn: Callable, *args, **kwargs) -> Iterator[tuple[str, Any]]:
    """Runs fn(*args, **kwargs) in a background thread with stdout captured
    line-by-line. Yields ("line", text) as each line is printed, then
    exactly one of ("result", return_value) or ("error", exception)."""
    _ensure_dispatcher_installed()
    q: "queue.Queue[Any]" = queue.Queue()
    holder: dict[str, Any] = {}

    def runner():
        writer = _QueueWriter(q)
        ident = threading.get_ident()
        with _lock:
            _writers_by_thread[ident] = writer
        try:
            result = fn(*args, **kwargs)
            if writer._buf.strip():
                q.put(writer._buf)
            holder["result"] = result
        except Exception as e:  # noqa: BLE001
            holder["error"] = e
        finally:
            with _lock:
                del _writers_by_thread[ident]
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
