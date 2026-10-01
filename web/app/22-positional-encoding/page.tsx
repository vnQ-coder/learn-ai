"use client";
import { useState } from "react";
import { apiPost } from "@/lib/api";
import { ConceptPanel, ResultPanel } from "@/components/ConceptPanel";

type ComputeResponse = {
  tokens: string[];
  pe_matrix: number[][];
  diff_without_pe: number;
  diff_with_pe: number;
};

function PEHeatmap({ matrix }: { matrix: number[][] }) {
  return (
    <div className="overflow-x-auto">
      <div className="inline-block">
        {matrix.map((row, pos) => (
          <div key={pos} className="flex items-center gap-[2px] mb-[2px]">
            <span className="w-10 shrink-0 text-[10px] text-neutral-500 text-right pr-1">pos {pos}</span>
            {row.map((value, dim) => {
              // PE values range roughly -1..1; map to 0..1 for opacity.
              const intensity = Math.min(1, Math.abs(value));
              return (
                <div
                  key={dim}
                  title={`pos ${pos}, dim ${dim}: ${value.toFixed(3)}`}
                  className="w-5 h-5 rounded-sm border border-white/5"
                  style={{ backgroundColor: `rgba(94, 234, 212, ${intensity})` }}
                />
              );
            })}
          </div>
        ))}
        <div className="flex items-center gap-[2px] mt-1">
          <span className="w-10 shrink-0" />
          {matrix[0]?.map((_, dim) => (
            <span key={dim} className="w-5 shrink-0 text-[8px] text-neutral-600 text-center">
              {dim}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  const [data, setData] = useState<ComputeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await apiPost<ComputeResponse>("/api/22/compute", {});
      setData(res);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold mb-2 text-neutral-100">22 — Positional Encoding</h1>
      <p className="text-neutral-400 mb-4">Scenario: prove attention can&apos;t tell word order apart — until positional encoding fixes it.</p>

      <ConceptPanel
        plain={
          <>
            Attention on its own treats a sentence like a bag of words — shuffle the words and
            you&apos;d get the same understanding back, just rearranged, which is obviously wrong
            for language where order matters (&quot;dog bites man&quot; vs &quot;man bites
            dog&quot;). Positional encoding fixes this by adding a unique, position-dependent
            pattern to each word&apos;s representation before attention ever runs, so the model
            can tell &quot;first word&quot; from &quot;second word&quot; and so on.
          </>
        }
        technical={
          <>
            This uses the original sinusoidal formula from &quot;Attention Is All You
            Need&quot;: alternating sine and cosine waves at different frequencies per embedding
            dimension, so every position gets a unique signature, and nearby positions get
            similar — but not identical — encodings. (Some newer model families use learned
            positional embeddings instead, but the sinusoidal version needs no training at all.)
          </>
        }
      />

      <button
        onClick={run}
        disabled={loading}
        className="bg-teal-300 text-black glow-mint-sm rounded-full px-6 py-2 font-medium disabled:opacity-50 hover:bg-teal-200 transition-colors mb-6"
      >
        {loading ? "Running..." : "▶ Run demonstration"}
      </button>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {data && (
        <>
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">
            Positional encoding matrix (position × dimension)
          </div>
          <div className="rounded-xl border border-neutral-800 panel p-4 mb-6">
            <PEHeatmap matrix={data.pe_matrix} />
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div className="rounded-xl border border-neutral-800 panel p-4">
              <div className="text-xs text-neutral-500 uppercase tracking-wide mb-1">
                Output difference WITHOUT positional encoding
              </div>
              <div className="text-neutral-400 text-base">{data.diff_without_pe.toFixed(6)}</div>
            </div>
            <div className="rounded-xl border border-teal-300/40 bg-teal-300/5 p-4">
              <div className="text-xs text-teal-300/80 uppercase tracking-wide mb-1">
                Output difference WITH positional encoding
              </div>
              <div className="text-teal-300 font-bold text-lg">{data.diff_with_pe.toFixed(6)}</div>
            </div>
          </div>

          <ResultPanel>
            Shuffling the word order {data.diff_without_pe < 0.00001 ? "barely moved" : "moved"} the
            output ({data.diff_without_pe.toFixed(6)}) when there was no positional encoding — attention
            alone doesn&apos;t notice order. Once positional encoding was added, the exact same
            shuffle moved the output by {data.diff_with_pe.toFixed(6)} instead — a meaningful
            difference, proving the model can now tell the words apart by position, not just by
            content.
          </ResultPanel>
        </>
      )}
    </main>
  );
}
