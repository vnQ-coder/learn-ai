"use client";
import { useState } from "react";
import { apiPost } from "@/lib/api";

type AskResponse = { transcript: string };

export default function Page() {
  const [question, setQuestion] = useState("Where is my order 7788?");
  const [transcript, setTranscript] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiPost<AskResponse>("/api/07/ask", { question }, true);
      setTranscript(data.transcript);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-2">07 — MCP-Style Tool Use (Function Calling)</h1>
      <p className="text-gray-600 mb-4">Scenario: an agent answering order questions by calling a local tool instead of guessing.</p>
      <p className="text-sm text-gray-500 mb-4">Requires a Gemini API key — set it on the home page.</p>
      <input className="w-full border rounded px-3 py-2 mb-2" value={question} onChange={(e) => setQuestion(e.target.value)} />
      <button onClick={run} disabled={loading} className="bg-black text-white rounded px-4 py-2 disabled:opacity-50">
        {loading ? "Running..." : "Run"}
      </button>
      {error && <p className="text-red-600 mt-4">{error}</p>}
      {transcript && <pre className="whitespace-pre-wrap border rounded p-3 bg-white text-sm mt-4">{transcript}</pre>}
    </main>
  );
}
