"use client";
import { useState } from "react";
import { apiPost } from "@/lib/api";

type SearchResult = { text: string; score: number; match: boolean };
type SearchResponse = { results: SearchResult[] };

export default function Page() {
  const [query, setQuery] = useState("I was billed two times");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiPost<SearchResponse>("/api/01/search", { query });
      setResults(data.results);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-2">01 — Embeddings: Normal (TF-IDF)</h1>
      <p className="text-gray-600 mb-4">
        Scenario: a support-ticket search box that only matches literal keywords.
      </p>
      <input
        className="w-full border rounded px-3 py-2 mb-2"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button onClick={run} disabled={loading} className="bg-black text-white rounded px-4 py-2 disabled:opacity-50">
        {loading ? "Running..." : "Run TF-IDF search"}
      </button>
      {error && <p className="text-red-600 mt-4">{error}</p>}
      {results && (
        <ul className="mt-4 space-y-2">
          {results.map((r, i) => (
            <li key={i} className="border rounded p-3">
              <span className={r.match ? "text-green-700 font-semibold" : "text-red-600 font-semibold"}>
                {r.match ? "MATCH" : "MISS"}
              </span>{" "}
              — score={r.score.toFixed(3)}
              <div className="text-sm text-gray-700">{r.text}</div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
