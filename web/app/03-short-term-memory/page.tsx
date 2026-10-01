"use client";
import { useState } from "react";
import { apiPost } from "@/lib/api";

type ConversationResponse = { transcript: string };

export default function Page() {
  const [transcript10, setTranscript10] = useState<string | null>(null);
  const [transcript1, setTranscript1] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<"10" | "1" | null>(null);

  async function run(windowSize: number, setter: (s: string | null) => void, which: "10" | "1") {
    setLoading(which);
    setError(null);
    setter(null);
    try {
      const data = await apiPost<ConversationResponse>("/api/03/conversation", { window_size: windowSize }, true);
      setter(data.transcript);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(null);
    }
  }

  return (
    <main className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-2">03 — Short-Term Memory (Sliding Window)</h1>
      <p className="text-gray-600 mb-4">
        Scenario: a support chatbot booking a flight, where an early detail must survive to the last turn.
      </p>
      <p className="text-sm text-gray-500 mb-4">Requires a Gemini API key — set it on the home page.</p>
      <div className="flex gap-3 mb-4">
        <button onClick={() => run(10, setTranscript10, "10")} disabled={loading !== null} className="bg-black text-white rounded px-4 py-2 disabled:opacity-50">
          {loading === "10" ? "Running..." : "Run with window_size=10 (remembers)"}
        </button>
        <button onClick={() => run(1, setTranscript1, "1")} disabled={loading !== null} className="bg-black text-white rounded px-4 py-2 disabled:opacity-50">
          {loading === "1" ? "Running..." : "Run with window_size=1 (forgets)"}
        </button>
      </div>
      {error && <p className="text-red-600 mt-2">{error}</p>}
      {transcript10 && (
        <div className="mb-4">
          <h2 className="font-semibold mb-1">window_size=10 (remembers)</h2>
          <pre className="whitespace-pre-wrap border rounded p-3 bg-white text-sm">{transcript10}</pre>
        </div>
      )}
      {transcript1 && (
        <div>
          <h2 className="font-semibold mb-1">window_size=1 (forgets)</h2>
          <pre className="whitespace-pre-wrap border rounded p-3 bg-white text-sm">{transcript1}</pre>
        </div>
      )}
    </main>
  );
}
