"use client";
import { useState } from "react";
import { apiPost } from "@/lib/api";
import { ConceptPanel, ResultPanel } from "@/components/ConceptPanel";

type SimulateResponse = {
  steps: { step: number; naive_cumulative_ops: number; cached_cumulative_ops: number; cache_memory_mb: number }[];
  final_naive_ops: number;
  final_cached_ops: number;
  speedup_factor: number;
  final_cache_memory_mb: number;
};

export default function Page() {
  const [numTokens, setNumTokens] = useState(20);
  const [result, setResult] = useState<SimulateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiPost<SimulateResponse>("/api/24/simulate", { num_tokens: numTokens });
      setResult(res);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const maxOps = result ? result.final_naive_ops : 1;
  const naiveWidth = result ? 100 : 0;
  const cachedWidth = result ? Math.max((result.final_cached_ops / maxOps) * 100, 2) : 0;

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold mb-2 text-neutral-100">24 — KV Cache</h1>
      <p className="text-neutral-400 mb-4">Scenario: generating text one token at a time — with and without caching what was already computed.</p>

      <ConceptPanel
        plain={
          <>
            When an AI generates a response one word at a time, redoing all its &quot;thinking&quot;
            about every previous word at every single step would be incredibly wasteful — like
            re-reading the whole conversation from scratch before saying each new sentence. A KV
            cache is the AI&apos;s short-term memory trick: it remembers what it already figured
            out about earlier words and only does new work for the newest one.
          </>
        }
        technical={
          <>
            During autoregressive generation, each new token&apos;s attention needs the Key and
            Value vectors for all previous tokens. Without caching, these get recomputed from
            scratch every step — work grows quadratically, O(N²) total across generating N
            tokens. With caching, each token&apos;s K/V is computed once and stored, so each step
            only computes the new token&apos;s K/V — work grows linearly, O(N) total. The
            tradeoff is the cache itself consumes memory that grows with sequence length, which is
            why long-context inference is memory-bound in production.
          </>
        }
      />

      <div className="flex gap-2 mb-6 items-center">
        <label className="text-sm text-neutral-400">tokens to generate</label>
        <input
          type="number"
          min={1}
          max={200}
          className="w-24 border border-neutral-700 bg-neutral-900 text-neutral-100 rounded-full px-4 py-2 focus:outline-none focus:border-teal-300/60"
          value={numTokens}
          onChange={(e) => setNumTokens(Math.max(1, Math.min(200, Number(e.target.value) || 1)))}
        />
        <button
          onClick={run}
          disabled={loading}
          className="bg-teal-300 text-black glow-mint-sm rounded-full px-5 py-2 disabled:opacity-50 font-medium hover:bg-teal-200 transition-colors"
        >
          {loading ? "Simulating..." : "▶ Simulate"}
        </button>
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {result && (
        <div className="rounded-xl border border-neutral-800 panel p-4 mb-4 space-y-3">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Total attention work across generation</div>

          <div>
            <div className="text-xs text-neutral-500 mb-1">without KV cache</div>
            <div className="relative h-8 rounded bg-neutral-900">
              <div
                className="absolute h-8 rounded border border-red-800 bg-red-900/30 flex items-center px-2 text-xs text-red-300 whitespace-nowrap transition-all duration-500"
                style={{ width: `${naiveWidth}%` }}
              >
                {result.final_naive_ops} ops
              </div>
            </div>
          </div>

          <div>
            <div className="text-xs text-neutral-500 mb-1">with KV cache</div>
            <div className="relative h-8 rounded bg-neutral-900">
              <div
                className="absolute h-8 rounded border border-teal-300/50 bg-teal-300/20 flex items-center px-2 text-xs text-teal-200 whitespace-nowrap transition-all duration-500"
                style={{ width: `${cachedWidth}%` }}
              >
                {result.final_cached_ops} ops
              </div>
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-neutral-400 mb-4">
          <span>
            speedup: <strong className="text-teal-300">{result.speedup_factor}x</strong>
          </span>
          <span>
            cache memory needed: <strong className="text-neutral-200">{result.final_cache_memory_mb} MB</strong>
          </span>
        </div>
      )}

      {result && (
        <ResultPanel>
          Generating {numTokens} tokens without a cache does <strong>{result.speedup_factor}x</strong> more
          attention work in total than generating with a cache — the gap only widens as you generate
          more tokens, since naive recomputation grows quadratically while caching stays linear. The
          cache itself only costs <strong>{result.final_cache_memory_mb} MB</strong> of memory to
          maintain for this sequence length — cheap relative to the compute it saves, though that
          memory cost keeps growing the longer the conversation gets.
        </ResultPanel>
      )}
    </main>
  );
}
