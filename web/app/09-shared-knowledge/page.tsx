"use client";
import { useState } from "react";
import { apiPost } from "@/lib/api";

type Stage = { agent: string; key: string; value: string };
type RunResponse = { stages: Stage[]; final_report: string | null };

export default function Page() {
  const [topic, setTopic] = useState("why hybrid search outperforms pure keyword search");
  const [data, setData] = useState<RunResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      setData(await apiPost<RunResponse>("/api/09/run", { topic }, true));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-2">09 — Agents Sharing Knowledge (Blackboard Pattern)</h1>
      <p className="text-gray-600 mb-4">
        Scenario: a researcher, fact-checker, and writer agent collaborating through a shared knowledge store.
      </p>
      <p className="text-sm text-gray-500 mb-4">Requires a Gemini API key — set it on the home page.</p>
      <input className="w-full border rounded px-3 py-2 mb-2" value={topic} onChange={(e) => setTopic(e.target.value)} />
      <button onClick={run} disabled={loading} className="bg-black text-white rounded px-4 py-2 disabled:opacity-50">
        {loading ? "Running..." : "Run pipeline"}
      </button>
      {error && <p className="text-red-600 mt-4">{error}</p>}
      {data && (
        <div className="mt-4 space-y-2">
          {data.stages.map((s, i) => (
            <div key={i} className="border rounded p-3 text-sm">
              <span className="font-semibold">[{s.agent}] {s.key}</span>: {s.value}
            </div>
          ))}
          {data.final_report ? (
            <div className="mt-4">
              <h2 className="font-semibold mb-2">Final report</h2>
              <p className="border rounded p-3 bg-white whitespace-pre-wrap">{data.final_report}</p>
            </div>
          ) : (
            <p className="text-yellow-700 mt-4">The pipeline didn&apos;t produce a final report.</p>
          )}
        </div>
      )}
    </main>
  );
}
