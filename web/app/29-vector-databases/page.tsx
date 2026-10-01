"use client";
import { useState } from "react";
import { apiPost } from "@/lib/api";
import { ConceptPanel, ResultPanel } from "@/components/ConceptPanel";

type BenchmarkResult = { corpus_size: number; brute_force_ms: number; indexed_ms: number };
type BenchmarkResponse = { results: BenchmarkResult[] };

export default function Page() {
  const [result, setResult] = useState<BenchmarkResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiPost<BenchmarkResponse>("/api/29/benchmark", {});
      setResult(res);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const maxMs = result ? Math.max(...result.results.flatMap((r) => [r.brute_force_ms, r.indexed_ms])) : 1;
  const last = result ? result.results[result.results.length - 1] : null;
  const ratio = last ? Math.round((last.brute_force_ms / last.indexed_ms) * 10) / 10 : null;

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold mb-2 text-neutral-100">29 — Vector Databases</h1>
      <p className="text-neutral-400 mb-4">Scenario: timing a brute-force scan against a real indexed search as the corpus grows.</p>

      <ConceptPanel
        plain={
          <>
            Finding the most similar vectors in a small list is easy — just check every single
            one. But once you have hundreds of thousands of documents, checking every single one
            for every single search becomes slow. A vector database builds a smart index upfront
            so it can find good matches without checking everything. This demo times both
            approaches as the amount of data grows, so you can see exactly why that matters.
          </>
        }
        technical={
          <>
            Brute-force search is exact but O(n) per query — cost grows with corpus size. Vector
            databases like Chroma build an approximate nearest-neighbor index (commonly{" "}
            <strong className="text-neutral-200">HNSW</strong>, a navigable graph structure) that
            finds very-likely-correct results in roughly logarithmic time instead, trading a small
            amount of exactness for a large speed advantage at scale. At small corpus sizes,
            numpy&apos;s vectorized brute-force scan can actually beat the index — the crossover
            point below is where the index&apos;s fixed overhead stops mattering and its better
            scaling takes over. This is the real engineering reason production RAG systems (like
            modules 05 and 19 in this curriculum) use a real vector database instead of a Python
            list and a loop.
          </>
        }
      />

      <button
        onClick={run}
        disabled={loading}
        className="bg-teal-300 text-black glow-mint-sm rounded-full px-5 py-2 disabled:opacity-50 font-medium hover:bg-teal-200 transition-colors mb-1"
      >
        {loading ? "Running benchmark..." : "▶ Run benchmark"}
      </button>
      <p className="text-xs text-neutral-600 mb-4">Runs real timed searches at increasing corpus sizes — takes a few seconds.</p>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {result && (
        <div className="rounded-xl border border-neutral-800 panel p-4 mb-4 space-y-4">
          {result.results.map((r) => (
            <div key={r.corpus_size}>
              <div className="text-xs text-neutral-500 mb-1">{r.corpus_size.toLocaleString()} documents</div>
              <div className="relative h-7 rounded bg-neutral-900 mb-1">
                <div
                  className="absolute h-7 rounded border border-red-800 bg-red-900/30 flex items-center px-2 text-xs text-red-300 whitespace-nowrap transition-all duration-500"
                  style={{ width: `${Math.max((r.brute_force_ms / maxMs) * 100, 3)}%` }}
                >
                  brute force {r.brute_force_ms}ms
                </div>
              </div>
              <div className="relative h-7 rounded bg-neutral-900">
                <div
                  className="absolute h-7 rounded border border-teal-300/50 bg-teal-300/20 flex items-center px-2 text-xs text-teal-200 whitespace-nowrap transition-all duration-500"
                  style={{ width: `${Math.max((r.indexed_ms / maxMs) * 100, 3)}%` }}
                >
                  indexed {r.indexed_ms}ms
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {result && last && ratio !== null && (
        <ResultPanel>
          At {last.corpus_size.toLocaleString()} documents, brute force took{" "}
          <strong>{last.brute_force_ms}ms</strong> vs the indexed search&apos;s{" "}
          <strong>{last.indexed_ms}ms</strong> — roughly a <strong>{ratio}x</strong> difference.
          Notice brute force actually wins at the smallest corpus size above — the index&apos;s
          advantage only kicks in once the corpus gets large enough that its better scaling
          outweighs its fixed per-query overhead. That crossover point is exactly why vector
          databases matter at production scale but would be overkill for a tiny dataset.
        </ResultPanel>
      )}
    </main>
  );
}
