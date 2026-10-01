const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

/** Posts to a streaming (text/event-stream) backend endpoint and yields each
 * parsed JSON event as it arrives, in real time. */
export async function* streamEvents<T = Record<string, unknown>>(
  path: string,
  body: unknown
): AsyncGenerator<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok || !res.body) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    const detail = err.detail;
    const message =
      typeof detail === "string" ? detail : Array.isArray(detail) ? JSON.stringify(detail) : res.statusText;
    throw new Error(message || `Request failed: ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let sepIndex: number;
    while ((sepIndex = buffer.indexOf("\n\n")) !== -1) {
      const rawEvent = buffer.slice(0, sepIndex);
      buffer = buffer.slice(sepIndex + 2);
      const line = rawEvent.startsWith("data: ") ? rawEvent.slice(6) : rawEvent;
      if (line.trim()) {
        yield JSON.parse(line) as T;
      }
    }
  }
}
