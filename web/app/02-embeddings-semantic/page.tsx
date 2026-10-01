"use client";
import { useState } from "react";
import { apiPost } from "@/lib/api";

type ScoredText = { text: string; score: number };
type CompareResponse = { tfidf: ScoredText; semantic: ScoredText; better_match: boolean };

export default function Page() {
  const [query, setQuery] = useState("I was billed two times");
  const [data, setData] = useState<CompareResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      setData(await apiPost<CompareResponse>("/api/02/compare", { query }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-2">02 — Embeddings: Semantic</h1>
      <p className="text-gray-600 mb-4">Scenario: the same ticket search, now using meaning instead of literal words.</p>
      <input className="w-full border rounded px-3 py-2 mb-2" value={query} onChange={(e) => setQuery(e.target.value)} />
      <button onClick={run} disabled={loading} className="bg-black text-white rounded px-4 py-2 disabled:opacity-50">
        {loading ? "Running..." : "Compare TF-IDF vs Semantic"}
      </button>
      {error && <p className="text-red-600 mt-4">{error}</p>}
      {data && (
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="border rounded p-3">
            <div className="font-semibold">TF-IDF: {data.tfidf.score.toFixed(3)}</div>
            <div className="text-sm text-gray-700">{data.tfidf.text}</div>
          </div>
          <div className="border rounded p-3">
            <div className="font-semibold">Semantic: {data.semantic.score.toFixed(3)}</div>
            <div className="text-sm text-gray-700">{data.semantic.text}</div>
          </div>
          {data.better_match && (
            <p className="col-span-2 text-green-700 font-medium">
              Semantic search found a better match TF-IDF missed.
            </p>
          )}
        </div>
      )}
    </main>
  );
}
