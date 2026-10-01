"use client";
import { useState } from "react";
import { streamEvents } from "@/lib/sse";
import { ConceptPanel, ResultPanel } from "@/components/ConceptPanel";

type Span = { name: string; start_ms: number; duration_ms: number; tokens: number; cost_usd: number };

export default function Page() {
  const [question, setQuestion] = useState("What does this curriculum teach about embeddings?");
  const [spans, setSpans] = useState<Span[]>([]);
  const [answer, setAnswer] = useState<string | null>(null);
  const [totalMs, setTotalMs] = useState<number | null>(null);
  const [totalCost, setTotalCost] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    setSpans([]);
    setAnswer(null);
    setTotalMs(null);
    setTotalCost(null);
    try {
      for await (const event of streamEvents<{
        type: string;
        label?: string;
        name?: string;
        start_ms?: number;
        duration_ms?: number;
        tokens?: number;
        cost_usd?: number;
        answer?: string;
        spans?: Span[];
        total_ms?: number;
        total_cost_usd?: number;
        message?: string;
      }>("/api/11/trace/stream", { question })) {
        if (event.type === "step" && event.label === "span") {
          setSpans((s) => [
            ...s,
            {
              name: event.name ?? "",
              start_ms: event.start_ms ?? 0,
              duration_ms: event.duration_ms ?? 0,
              tokens: event.tokens ?? 0,
              cost_usd: event.cost_usd ?? 0,
            },
          ]);
        } else if (event.type === "done") {
          setAnswer(event.answer ?? "");
          setTotalMs(event.total_ms ?? null);
          setTotalCost(event.total_cost_usd ?? null);
        } else if (event.type === "error") {
          setError(event.message ?? "Something went wrong");
        }
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const total = totalMs ?? (spans.length > 0 ? Math.max(...spans.map((s) => s.start_ms + s.duration_ms)) : 1);
  const slowest = spans.length > 0 ? spans.reduce((a, b) => (b.duration_ms > a.duration_ms ? b : a)) : null;

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold mb-2 text-neutral-100">11 — Observability &amp; Tracing</h1>
      <p className="text-neutral-400 mb-4">Scenario: watching exactly what a retrieve-then-generate pipeline does under the hood.</p>

      <ConceptPanel
        plain={
          <>
            Every real AI agent call is actually several hidden steps. This is the &quot;flight
            recorder&quot; view: exactly what ran, in what order, and how long each piece took —
            instead of just waiting for a final answer with no idea what happened in between.
          </>
        }
        technical={
          <>
            This is <strong>distributed tracing</strong>: each step of the pipeline is wrapped in
            a <strong>span</strong> recording its name, start time, duration, and resource usage.
            Production agent systems instrument every LLM call this way — it&apos;s how you debug
            why a request was slow, or where cost is actually going, instead of treating the whole
            pipeline as one opaque black box.
          </>
        }
      />

      <div className="flex gap-2 mb-6">
        <input
          className="flex-1 border border-neutral-700 bg-neutral-900 text-neutral-100 placeholder-neutral-500 rounded-full px-4 py-2 focus:outline-none focus:border-teal-300/60"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && run()}
        />
        <button
          onClick={run}
          disabled={loading}
          className="bg-teal-300 text-black glow-mint-sm rounded-full px-5 py-2 disabled:opacity-50 font-medium hover:bg-teal-200 transition-colors"
        >
          {loading ? "Tracing..." : "▶ Trace"}
        </button>
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {spans.length > 0 && (
        <div className="rounded-xl border border-neutral-800 panel p-4 mb-4">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">Trace waterfall</div>
          <div className="space-y-2">
            {spans.map((span, i) => (
              <div key={i} className="relative h-8">
                <div
                  className="absolute h-8 rounded border border-teal-300/50 bg-teal-300/20 flex items-center px-2 text-xs text-teal-200 whitespace-nowrap overflow-hidden transition-all duration-500"
                  style={{
                    left: `${(span.start_ms / total) * 100}%`,
                    width: `${(span.duration_ms / total) * 100}%`,
                    minWidth: "110px",
                  }}
                >
                  {span.name} <span className="ml-1 text-teal-300/70">· {span.duration_ms}ms</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {totalMs !== null && (
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-neutral-400 mb-4">
          <span>
            total: <strong className="text-neutral-200">{totalMs}ms</strong>
          </span>
          <span>
            tokens: <strong className="text-neutral-200">{spans.reduce((a, s) => a + s.tokens, 0)}</strong>
          </span>
          <span>
            cost: <strong className="text-neutral-200">${totalCost}</strong>{" "}
            <span className="text-neutral-600">(estimated, illustrative — not real billing)</span>
          </span>
        </div>
      )}

      {answer && (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 px-3 py-2.5 text-sm text-neutral-200 mb-4">
          <div className="font-semibold text-xs mb-1 text-neutral-400">Answer</div>
          {answer}
        </div>
      )}

      {slowest && totalMs !== null && (
        <ResultPanel>
          The <strong>{slowest.name}</strong> step took {slowest.duration_ms}ms — the biggest
          share of the {totalMs}ms total. In a real system, this is exactly the kind of signal
          that tells you where to optimize first: retrieval is nearly free here, but every call
          out to the model dominates latency and cost.
        </ResultPanel>
      )}
    </main>
  );
}
