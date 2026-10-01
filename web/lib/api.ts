const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

export function getApiKey(): string {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("gemini_api_key") ?? "";
}

export function setApiKey(key: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem("gemini_api_key", key);
}

export async function apiPost<T>(path: string, body: unknown, needsKey = false): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (needsKey) {
    const key = getApiKey();
    if (key) headers["X-Gemini-Api-Key"] = key;
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? `Request failed: ${res.status}`);
  }
  return res.json();
}
