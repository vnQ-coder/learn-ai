"use client";
import { useState } from "react";
import { streamEvents } from "@/lib/sse";
import { ConceptPanel, ResultPanel } from "@/components/ConceptPanel";
import { Term } from "@/components/Term";
import { CheckCircle2, XCircle, Circle } from "lucide-react";

type EvalItem = {
  question: string;
  expectedKeywords: string[];
  response: string | null;
  passed: boolean | null;
};

export default function Page() {
  const [items, setItems] = useState<EvalItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [summary, setSummary] = useState<{ passedCount: number; total: number; scorePct: number } | null>(null);

  async function run() {
    setLoading(true);
    setErrorMsg(null);
    setSummary(null);
    setItems([]);
    try {
      for await (const event of streamEvents<{
        type: string;
        label?: string;
        index?: number;
        question?: string;
        response?: string;
        passed?: boolean;
        expected_keywords?: string[];
        passed_count?: number;
        total?: number;
        score_pct?: number;
        message?: string;
      }>("/api/27/run/stream", {})) {
        if (event.type === "step" && event.label === "eval_item") {
          const idx = event.index ?? 0;
          setItems((prev) => {
            const next = [...prev];
            next[idx] = {
              question: event.question ?? "",
              expectedKeywords: event.expected_keywords ?? [],
              response: event.response ?? "",
              passed: event.passed ?? false,
            };
            return next;
          });
        } else if (event.type === "done") {
          setSummary({
            passedCount: event.passed_count ?? 0,
            total: event.total ?? 0,
            scorePct: event.score_pct ?? 0,
          });
        } else if (event.type === "error") {
          setErrorMsg(event.message ?? "Something went wrong");
        }
      }
    } catch (e) {
      setErrorMsg((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold mb-2 text-neutral-100">27 — Model Evaluation</h1>
      <p className="text-neutral-400 mb-4">Scenario: a fixed suite of test questions, run automatically and scored.</p>

      <ConceptPanel
        plain={
          <>
            When you change a prompt or swap models, how do you know if you made things better or
            worse? You don&apos;t just eyeball one example — you run a fixed set of test questions
            with known-good answers every time, automatically, and track the pass rate. This is a
            tiny real example of that.
          </>
        }
        technical={
          <>
            This is an automated <Term term="agent">eval harness</Term>: a fixed &quot;golden
            set&quot; of inputs, each with an expected property of a correct answer — here, a set
            of required keywords. Real production evals often use more sophisticated checks like
            exact match, semantic similarity, or another LLM acting as a judge (see module 28).
            Running this suite automatically means changes to a prompt, model, or pipeline can be
            regression-tested the same way code changes are tested.
          </>
        }
      />

      <button
        onClick={run}
        disabled={loading}
        className="bg-teal-300 text-black glow-mint-sm rounded-full px-5 py-2 disabled:opacity-50 font-medium hover:bg-teal-200 transition-colors mb-4"
      >
        {loading ? "Running eval suite..." : "▶ Run eval suite"}
      </button>

      {errorMsg && <p className="text-red-400 text-sm mb-4">{errorMsg}</p>}

      <ol className="space-y-3 mb-4">
        {Array.from({ length: 5 }).map((_, i) => {
          const item = items[i];
          return (
            <li key={i} className="rounded-xl border border-neutral-800 panel p-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0">
                  {!item ? (
                    <Circle size={18} className="text-neutral-700" />
                  ) : item.passed ? (
                    <CheckCircle2 size={18} className="text-teal-300" />
                  ) : (
                    <XCircle size={18} className="text-red-400" />
                  )}
                </span>
                <div className="flex-1">
                  <div className={item ? "text-neutral-100" : "text-neutral-500"}>
                    {item?.question ?? `Eval item ${i + 1}`}
                  </div>
                  {item?.response && (
                    <div className="text-sm text-neutral-500 mt-1 leading-relaxed line-clamp-3">{item.response}</div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {summary && (
        <div className="rounded-xl border border-neutral-800 panel p-4 mb-4 text-center">
          <div className="text-2xl font-bold text-teal-300">
            {summary.passedCount} / {summary.total} passed
          </div>
          <div className="text-sm text-neutral-500">{summary.scorePct}%</div>
        </div>
      )}

      {summary && (
        <ResultPanel>
          This run scored <strong className="text-teal-300">{summary.scorePct}%</strong> on the
          eval suite. A dropping score across runs is exactly the signal that tells you a prompt
          or model change made things worse — this same pattern scales to hundreds of test cases
          in a real eval pipeline, not just 5.
        </ResultPanel>
      )}
    </main>
  );
}
