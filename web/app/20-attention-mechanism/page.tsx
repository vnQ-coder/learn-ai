"use client";
import { useState } from "react";
import { apiPost } from "@/lib/api";
import { ConceptPanel, ResultPanel } from "@/components/ConceptPanel";

type AttentionResponse = { tokens: string[]; weights: number[][] };

function findTopNonSelf(weights: number[][], tokens: string[]) {
  // pick the row (besides the diagonal) with the strongest off-diagonal weight, for a concrete example
  let best = { i: 0, j: 0, v: -1 };
  weights.forEach((row, i) => {
    row.forEach((v, j) => {
      if (i !== j && v > best.v) best = { i, j, v };
    });
  });
  return { from: tokens[best.i], to: tokens[best.j], weight: best.v };
}

export default function Page() {
  const [data, setData] = useState<AttentionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiPost<AttentionResponse>("/api/20/compute", {});
      setData(res);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const highlight = data ? findTopNonSelf(data.weights, data.tokens) : null;

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold mb-2 text-neutral-100">20 — Attention Mechanism</h1>
      <p className="text-neutral-400 mb-4">Scenario: a short sentence, and how strongly each word attends to every other word.</p>

      <ConceptPanel
        plain={
          <>
            Attention lets each word in a sentence look at every other word and decide how much
            to &quot;pay attention&quot; to it when building its own understanding. The grid below
            is a real attention weight matrix: brighter cells mean stronger attention between two
            words, darker cells mean the model is mostly ignoring that pair.
          </>
        }
        technical={
          <>
            This is scaled dot-product self-attention, computed exactly as in &quot;Attention Is
            All You Need&quot;: each token&apos;s embedding is projected into a Query, Key, and
            Value vector via learned matrices. Scores are <code>Q · K^T</code>, scaled by{" "}
            <code>1/√d_k</code> to keep gradients stable, then passed through{" "}
            <code>softmax</code> so each row sums to exactly 1 — a probability distribution over
            which tokens to draw information from. The final output is a weighted sum of the
            Value vectors using those probabilities.
          </>
        }
      />

      <button
        onClick={run}
        disabled={loading}
        className="bg-teal-300 text-black glow-mint-sm rounded-full px-5 py-2 disabled:opacity-50 font-medium hover:bg-teal-200 transition-colors mb-6"
      >
        {loading ? "Computing..." : "▶ Compute attention"}
      </button>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {data && (
        <div className="rounded-xl border border-neutral-800 panel p-4 overflow-x-auto">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">
            Attention weights (query row → key column)
          </div>
          <table className="border-collapse">
            <thead>
              <tr>
                <th className="w-16" />
                {data.tokens.map((t, j) => (
                  <th key={j} className="text-xs font-mono text-neutral-400 px-1 pb-1 text-center">
                    {t}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.weights.map((row, i) => (
                <tr key={i}>
                  <td className="text-xs font-mono text-neutral-400 pr-2 text-right whitespace-nowrap">{data.tokens[i]}</td>
                  {row.map((w, j) => (
                    <td key={j} className="p-0.5">
                      <div
                        className="w-12 h-12 rounded flex items-center justify-center text-[10px] font-mono border border-white/5"
                        style={{ backgroundColor: `rgba(94, 234, 212, ${w})`, color: w > 0.5 ? "#0a0f0d" : "#d4d4d4" }}
                      >
                        {w.toFixed(2)}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && highlight && (
        <ResultPanel>
          Notice how <strong className="text-teal-300">&quot;{highlight.from}&quot;</strong>{" "}
          attends most strongly (besides itself) to{" "}
          <strong className="text-teal-300">&quot;{highlight.to}&quot;</strong>, with a weight of{" "}
          <strong>{highlight.weight.toFixed(3)}</strong>. This is exactly how attention lets the
          model build a context-aware representation of each word — not just its own meaning in
          isolation, but a blend shaped by the other words it attends to most.
        </ResultPanel>
      )}
    </main>
  );
}
