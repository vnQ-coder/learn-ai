"use client";
import { Fragment, useState } from "react";
import { apiPost } from "@/lib/api";
import { ConceptPanel, ResultPanel } from "@/components/ConceptPanel";

type MultiHeadResponse = {
  tokens: string[];
  num_heads: number;
  per_head_weights: number[][][];
};

function HeadHeatmap({ tokens, weights, label }: { tokens: string[]; weights: number[][]; label: string }) {
  const n = tokens.length;
  return (
    <div className="rounded-xl border border-neutral-800 panel p-3">
      <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">{label}</div>
      <div
        className="grid gap-[2px]"
        style={{ gridTemplateColumns: `minmax(32px, auto) repeat(${n}, 1fr)` }}
      >
        <div />
        {tokens.map((t, j) => (
          <div key={`col-${j}`} className="text-[10px] text-neutral-500 text-center truncate px-0.5">
            {t}
          </div>
        ))}
        {weights.map((row, i) => (
          <Fragment key={`row-${i}`}>
            <div className="text-[10px] text-neutral-500 flex items-center justify-end pr-1 truncate">
              {tokens[i]}
            </div>
            {row.map((w, j) => (
              <div
                key={`cell-${i}-${j}`}
                className="aspect-square rounded-sm flex items-center justify-center text-[9px] text-neutral-100"
                style={{ backgroundColor: `rgba(94, 234, 212, ${Math.max(w, 0.04)})` }}
                title={`${tokens[i]} -> ${tokens[j]}: ${w.toFixed(3)}`}
              >
                {w >= 0.1 ? w.toFixed(1) : ""}
              </div>
            ))}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

function strongestOffDiagonal(weights: number[][]): { i: number; j: number; v: number } {
  let best = { i: 0, j: 0, v: -1 };
  weights.forEach((row, i) => {
    row.forEach((v, j) => {
      if (i !== j && v > best.v) best = { i, j, v };
    });
  });
  return best;
}

export default function Page() {
  const [data, setData] = useState<MultiHeadResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiPost<MultiHeadResponse>("/api/21/compute", {});
      setData(res);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function label(idx: number, tokens: string[]): string {
    const word = tokens[idx];
    const repeated = tokens.filter((t) => t === word).length > 1;
    return repeated ? `${word}[${idx}]` : word;
  }

  const head0 = data?.per_head_weights[0];
  const head1 = data?.per_head_weights[1];

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold mb-2 text-neutral-100">21 — QKV Attention (Multi-Head)</h1>
      <p className="text-neutral-400 mb-4">Scenario: the same sentence, attended to by several independent heads at once.</p>

      <ConceptPanel
        plain={
          <>
            One attention pattern can only capture one kind of relationship between words at a
            time. Multi-head attention runs several smaller attention calculations in parallel,
            each potentially learning a different kind of relationship — like grammar structure,
            or which pronoun refers to which noun — then combines them. This is the same
            scaled dot-product attention from module 20, just run several times in parallel on
            smaller slices of the embedding.
          </>
        }
        technical={
          <>
            The embedding dimension is split evenly across heads. Each head gets its own learned
            Q/K/V projections and computes independent attention, then all heads&apos; outputs
            are concatenated and passed through one final output projection{" "}
            <code>W_o</code> to mix information back together — this is the literal{" "}
            <code>MultiHeadAttention</code> layer used in every transformer.
          </>
        }
      />

      <button
        onClick={run}
        disabled={loading}
        className="bg-teal-300 text-black glow-mint-sm rounded-full px-6 py-2 font-medium disabled:opacity-50 hover:bg-teal-200 transition-colors mb-6"
      >
        {loading ? "Computing..." : "▶ Compute multi-head attention"}
      </button>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {data && (
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          {data.per_head_weights.map((weights, h) => (
            <HeadHeatmap key={h} tokens={data.tokens} weights={weights} label={`Head ${h}`} />
          ))}
        </div>
      )}

      {head0 && head1 && data && (
        <ResultPanel>
          {(() => {
            const s0 = strongestOffDiagonal(head0);
            const s1 = strongestOffDiagonal(head1);
            return (
              <>
                Head 0&apos;s strongest attention (besides a token attending to itself) is{" "}
                <strong>
                  {label(s0.i, data.tokens)} → {label(s0.j, data.tokens)}
                </strong>{" "}
                ({s0.v.toFixed(2)}), while head 1&apos;s strongest is{" "}
                <strong>
                  {label(s1.i, data.tokens)} → {label(s1.j, data.tokens)}
                </strong>{" "}
                ({s1.v.toFixed(2)}). Same sentence, same model layer — but each head genuinely
                attends differently, which is exactly why transformers use several heads instead
                of one.
              </>
            );
          })()}
        </ResultPanel>
      )}
    </main>
  );
}
