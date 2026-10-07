"use client";
import { useState } from "react";
import { streamEvents } from "@/lib/sse";
import { ConceptPanel, ResultPanel } from "@/components/ConceptPanel";
import { Term } from "@/components/Term";
import { CheckCircle2, XCircle, Circle, Wrench } from "lucide-react";

type Check = { passed: boolean; detail: string };
type ToolCall = { name: string; args: Record<string, string> };

type ScenarioResult = {
  key: string;
  label: string;
  prompt: string;
  toolCalls: ToolCall[];
  finalAnswer: string;
  checks: Record<string, Check>;
  passed: boolean;
};

export default function Page() {
  const [results, setResults] = useState<ScenarioResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [summary, setSummary] = useState<{ passedCount: number; total: number; scorePct: number } | null>(null);

  async function run() {
    setLoading(true);
    setErrorMsg(null);
    setSummary(null);
    setResults([]);
    try {
      for await (const event of streamEvents<{
        type: string;
        step_kind?: string;
        label?: string;
        index?: number;
        key?: string;
        prompt?: string;
        tool_calls?: ToolCall[];
        final_answer?: string;
        checks?: Record<string, Check>;
        passed?: boolean;
        passed_count?: number;
        total?: number;
        score_pct?: number;
        message?: string;
      }>("/api/33/run/stream", {})) {
        if (event.type === "step" && event.step_kind === "scenario") {
          const idx = event.index ?? 0;
          setResults((prev) => {
            const next = [...prev];
            next[idx] = {
              key: event.key ?? "",
              label: event.label ?? "",
              prompt: event.prompt ?? "",
              toolCalls: event.tool_calls ?? [],
              finalAnswer: event.final_answer ?? "",
              checks: event.checks ?? {},
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
      <h1 className="text-2xl font-bold mb-2 text-neutral-100">33 — Agent Evaluation in Production</h1>
      <p className="text-neutral-400 mb-4">Scenario: the same order-lookup agent from module 07, scored on its full trajectory — not just its final answer.</p>

      <ConceptPanel
        plain={
          <>
            A chat model only has one way to fail: saying the wrong thing. An <em>agent</em> has
            many more — it can call the wrong tool, make up a plausible-sounding answer when the
            real data doesn&apos;t exist, or check the same thing twice without noticing it already
            had the answer. None of that shows up if you only read the final reply — it reads fine
            either way. You have to look at <strong className="text-neutral-200">every step the
            agent actually took</strong>, not just what it said at the end.
          </>
        }
        technical={
          <>
            This is <Term term="agent">trajectory-level evaluation</Term>: each scenario below
            defines an expected shape for the whole interaction — should it call a tool at all, at
            most how many times, and must the final answer actually be grounded in what the tool
            returned (not a plausible fabrication). The agent is run for real, its full trajectory
            (every tool call, with its arguments, plus the final answer) is captured, and each check
            is graded independently — so a failing run tells you exactly <em>which</em> expectation
            broke, not just that something did. Contrast this with module 27 (checks only the final
            text) and module 28 (judges the quality of text someone already wrote) — this is the
            only one of the three that can catch an agent quietly calling a tool twice, or
            hallucinating a status for an order that was never found.
          </>
        }
      />

      <button
        onClick={run}
        disabled={loading}
        className="bg-teal-300 text-black glow-mint-sm rounded-full px-5 py-2 disabled:opacity-50 font-medium hover:bg-teal-200 transition-colors mb-4"
      >
        {loading ? "Running trajectory eval..." : "▶ Run agent eval suite"}
      </button>

      {errorMsg && <p className="text-red-400 text-sm mb-4">{errorMsg}</p>}

      <ol className="space-y-3 mb-4">
        {Array.from({ length: 4 }).map((_, i) => {
          const r = results[i];
          return (
            <li key={i} className="rounded-xl border border-neutral-800 panel p-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0">
                  {!r ? (
                    <Circle size={18} className="text-neutral-700" />
                  ) : r.passed ? (
                    <CheckCircle2 size={18} className="text-teal-300" />
                  ) : (
                    <XCircle size={18} className="text-red-400" />
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <div className={r ? "text-neutral-100 font-medium" : "text-neutral-500"}>
                    {r?.label ?? `Scenario ${i + 1}`}
                  </div>
                  {r && (
                    <>
                      <div className="text-sm text-neutral-500 italic mt-0.5">&quot;{r.prompt}&quot;</div>

                      <div className="flex items-center gap-1.5 mt-2 text-xs text-neutral-400">
                        <Wrench size={13} />
                        {r.toolCalls.length === 0 ? (
                          <span>no tool calls</span>
                        ) : (
                          <span>
                            {r.toolCalls.length} tool call{r.toolCalls.length > 1 ? "s" : ""}:{" "}
                            {r.toolCalls.map((tc, j) => (
                              <span key={j} className="font-mono text-teal-200/80">
                                {tc.name}({Object.values(tc.args).join(", ")}){j < r.toolCalls.length - 1 ? ", " : ""}
                              </span>
                            ))}
                          </span>
                        )}
                      </div>

                      <div className="text-sm text-neutral-400 mt-2 leading-relaxed">{r.finalAnswer}</div>

                      <div className="mt-3 space-y-1">
                        {Object.entries(r.checks).map(([name, check]) => (
                          <div key={name} className="flex items-start gap-1.5 text-xs">
                            {check.passed ? (
                              <CheckCircle2 size={13} className="text-teal-300 mt-0.5 shrink-0" />
                            ) : (
                              <XCircle size={13} className="text-red-400 mt-0.5 shrink-0" />
                            )}
                            <span className={check.passed ? "text-neutral-500" : "text-red-300"}>
                              <span className="font-mono">{name}</span> — {check.detail}
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
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
          {summary.passedCount < summary.total ? (
            <>
              At least one scenario failed above — scroll up and check which specific condition
              broke (a red ✗ line). That&apos;s the entire point: the final answer in a failing
              scenario can still read perfectly fine in isolation. It&apos;s only checking the
              trajectory — how many times the tool was called, whether the answer traces back to a
              real result — that catches it.
            </>
          ) : (
            <>
              All {summary.total} scenarios passed this run. Run it again (or after changing the
              prompt) and the exact same checks apply — that repeatability is what turns &quot;it
              seemed fine when I tried it&quot; into an objective signal you can actually trust.
            </>
          )}
        </ResultPanel>
      )}
    </main>
  );
}
