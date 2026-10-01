"use client";
import { useState } from "react";
import { apiPost } from "@/lib/api";
import { ConceptPanel, ResultPanel } from "@/components/ConceptPanel";

type QuantizeResponse = {
  original: number[];
  quantized_int8: number[];
  dequantized: number[];
  error: number[];
  mean_abs_error: number;
  max_abs_error: number;
  num_weights: number;
  fp32_bytes: number;
  int8_bytes: number;
  memory_reduction_factor: number;
};

export default function Page() {
  const [data, setData] = useState<QuantizeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiPost<QuantizeResponse>("/api/25/quantize", {});
      setData(res);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const fp32Pct = data ? 100 : 0;
  const int8Pct = data ? (data.int8_bytes / data.fp32_bytes) * 100 : 0;

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold mb-2 text-neutral-100">25 — Quantization</h1>
      <p className="text-neutral-400 mb-4">Scenario: shrinking real weights to int8 and measuring exactly what gets lost.</p>

      <ConceptPanel
        plain={
          <>
            AI models store millions or billions of numbers (weights) as high-precision decimals,
            which takes a lot of memory and compute. Quantization rounds those numbers down to
            much coarser, smaller integers — like rounding $19.73 to &quot;about $20&quot; —
            making the model smaller and faster to run, at the cost of a small amount of
            precision.
          </>
        }
        technical={
          <>
            This uses affine/linear quantization: map the float range <code>[min, max]</code>{" "}
            onto the integer range <code>[0, 255]</code> using a <code>scale</code> and{" "}
            <code>zero_point</code>, store only the integer, then reconstruct an approximate
            float by reversing the mapping. The reconstruction is never perfectly exact — that
            gap is the &quot;quantization error&quot; shown in the table below. Production LLM
            serving commonly uses int8 or even int4 quantization to fit larger models in less GPU
            memory.
          </>
        }
      />

      <button
        onClick={run}
        disabled={loading}
        className="bg-teal-300 text-black glow-mint-sm rounded-full px-6 py-2 font-medium disabled:opacity-50 hover:bg-teal-200 transition-colors mb-6"
      >
        {loading ? "Quantizing..." : "▶ Quantize sample weights"}
      </button>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {data && (
        <>
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/30 p-4 mb-6 overflow-x-auto">
            <table className="w-full text-sm font-mono">
              <thead>
                <tr className="text-neutral-500 text-xs uppercase tracking-wide">
                  <th className="text-left pb-2 font-sans">Original (float32)</th>
                  <th className="text-left pb-2 font-sans">Quantized (int8)</th>
                  <th className="text-left pb-2 font-sans">Dequantized</th>
                  <th className="text-left pb-2 font-sans">Error</th>
                </tr>
              </thead>
              <tbody>
                {data.original.map((o, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-neutral-900/40" : ""}>
                    <td className="py-1 text-neutral-300">{o.toFixed(4)}</td>
                    <td className="py-1 text-teal-300">{data.quantized_int8[i]}</td>
                    <td className="py-1 text-neutral-300">{data.dequantized[i].toFixed(4)}</td>
                    <td className="py-1 text-neutral-500">{data.error[i].toFixed(6)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-900/30 p-4 mb-6">
            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">Memory footprint</div>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs text-neutral-400 mb-1">
                  <span>float32</span>
                  <span>{data.fp32_bytes} bytes</span>
                </div>
                <div className="h-3 rounded-full bg-neutral-800 overflow-hidden">
                  <div className="h-full bg-neutral-500" style={{ width: `${fp32Pct}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-neutral-400 mb-1">
                  <span>int8</span>
                  <span>{data.int8_bytes} bytes</span>
                </div>
                <div className="h-3 rounded-full bg-neutral-800 overflow-hidden">
                  <div className="h-full bg-teal-300" style={{ width: `${int8Pct}%` }} />
                </div>
              </div>
            </div>
            <div className="mt-3 text-sm">
              <span className="text-teal-300 font-bold">{data.memory_reduction_factor.toFixed(0)}x smaller</span>
            </div>
          </div>

          <ResultPanel>
            The average rounding error is just <strong>{data.mean_abs_error.toFixed(6)}</strong>{" "}
            (worst case <strong>{data.max_abs_error.toFixed(6)}</strong>) — small relative to the
            typical weight magnitude shown in the table above. That&apos;s why int8 quantization
            usually doesn&apos;t noticeably hurt model quality, while cutting memory to a quarter
            of the original size.
          </ResultPanel>
        </>
      )}
    </main>
  );
}
