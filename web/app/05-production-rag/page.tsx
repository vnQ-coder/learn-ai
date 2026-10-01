"use client";
import { useState } from "react";
import { apiPost } from "@/lib/api";

type RetrievedChunk = { source: string; score: number; raw_vector_score: number };
type AskResponse = { retrieved: RetrievedChunk[]; answer: string };

export default function Page() {
  const [question, setQuestion] = useState("What does this curriculum teach?");
  const [data, setData] = useState<AskResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      setData(await apiPost<AskResponse>("/api/05/ask", { question }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-2">05 — Production RAG (Hybrid Search + Citations)</h1>
      <p className="text-gray-600 mb-4">Scenario: a documentation Q&amp;A bot over real markdown files.</p>
      <input className="w-full border rounded px-3 py-2 mb-2" value={question} onChange={(e) => setQuestion(e.target.value)} />
      <button onClick={run} disabled={loading} className="bg-black text-white rounded px-4 py-2 disabled:opacity-50">
        {loading ? "Running..." : "Run RAG pipeline"}
      </button>
      {error && <p className="text-red-600 mt-4">{error}</p>}
      {data && (
        <div className="mt-4">
          <h2 className="font-semibold mb-2">Retrieved chunks</h2>
          <ul className="space-y-1 mb-4 text-sm">
            {data.retrieved.map((r, i) => (
              <li key={i}>raw_vector_score={r.raw_vector_score.toFixed(3)} — {r.source}</li>
            ))}
          </ul>
          <h2 className="font-semibold mb-2">Answer</h2>
          <p className="border rounded p-3 bg-white whitespace-pre-wrap">{data.answer}</p>
        </div>
      )}
    </main>
  );
}
