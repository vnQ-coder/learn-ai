"use client";
import { useState } from "react";
import { apiPost } from "@/lib/api";

type NegotiateResponse = { transcript: string };

export default function Page() {
  const [transcript, setTranscript] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiPost<NegotiateResponse>("/api/08/negotiate", {});
      setTranscript(data.transcript);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-2">08 — Agents Talking (Agent-to-Agent Negotiation)</h1>
      <p className="text-gray-600 mb-4">
        Scenario: a trip-planner agent negotiating budget with a separate budget-checker agent over HTTP.
      </p>
      <button onClick={run} disabled={loading} className="bg-black text-white rounded px-4 py-2 disabled:opacity-50">
        {loading ? "Negotiating..." : "Run negotiation"}
      </button>
      {error && <p className="text-red-600 mt-4">{error}</p>}
      {transcript && <pre className="whitespace-pre-wrap border rounded p-3 bg-white text-sm mt-4">{transcript}</pre>}
    </main>
  );
}
