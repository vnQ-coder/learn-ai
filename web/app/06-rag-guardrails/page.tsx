"use client";
import { useState } from "react";
import { apiPost } from "@/lib/api";

type AskResponse = { top_raw_vector_score: number | null; result: string };

export default function Page() {
  const [question, setQuestion] = useState("What does this curriculum teach?");
  const [data, setData] = useState<AskResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function run(q: string) {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      setData(await apiPost<AskResponse>("/api/06/ask", { question: q }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-2">06 — RAG Evaluation &amp; Guardrails</h1>
      <p className="text-gray-600 mb-4">Scenario: grading the RAG bot&apos;s own answers before trusting them.</p>
      <input className="w-full border rounded px-3 py-2 mb-2" value={question} onChange={(e) => setQuestion(e.target.value)} />
      <div className="flex gap-3 mb-4">
        <button onClick={() => run(question)} disabled={loading} className="bg-black text-white rounded px-4 py-2 disabled:opacity-50">
          {loading ? "Running..." : "Ask on-topic question"}
        </button>
        <button onClick={() => run("what is the best pizza topping for a party?")} disabled={loading} className="bg-black text-white rounded px-4 py-2 disabled:opacity-50">
          {loading ? "Running..." : "Ask something unrelated (should refuse)"}
        </button>
      </div>
      {error && <p className="text-red-600 mt-4">{error}</p>}
      {data && (
        <div className="mt-4">
          {data.top_raw_vector_score !== null && (
            <p className="text-sm text-gray-600 mb-2">top raw_vector_score={data.top_raw_vector_score.toFixed(3)}</p>
          )}
          <p className="border rounded p-3 bg-white whitespace-pre-wrap">{data.result}</p>
        </div>
      )}
    </main>
  );
}
