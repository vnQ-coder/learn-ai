"use client";
import { useState } from "react";
import { streamEvents } from "@/lib/sse";
import { ConceptPanel, ResultPanel } from "@/components/ConceptPanel";
import { Term } from "@/components/Term";
import { FlowDiagram, type FlowNodeState } from "@/components/FlowDiagram";
import { TypewriterText } from "@/components/TypewriterText";
import { HelpCircle, ClipboardList, PlayCircle, Sparkles } from "lucide-react";

const NODES = [
  { id: "goal", icon: HelpCircle, label: "Goal" },
  { id: "plan", icon: ClipboardList, label: "Plan" },
  { id: "execute", icon: PlayCircle, label: "Execute" },
  { id: "synthesize", icon: Sparkles, label: "Synthesize" },
];

function stageStates(stage: number): FlowNodeState[] {
  return NODES.map((_, i) => {
    if (stage < 0) return "pending";
    if (i < stage) return "done";
    if (i === stage) return "active";
    return "pending";
  });
}

type PlanItem = { text: string; done: boolean; result: string | null };

export default function Page() {
  const [goal, setGoal] = useState("Explain what RAG is and give one real-world example");
  const [stage, setStage] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<PlanItem[]>([]);
  const [finalAnswer, setFinalAnswer] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setStage(0);
    setPlan([]);
    setFinalAnswer(null);
    setErrorMsg(null);
    try {
      for await (const event of streamEvents<{
        type: string;
        label?: string;
        steps?: string[];
        index?: number;
        step_text?: string;
        result?: string;
        final_answer?: string;
        message?: string;
      }>("/api/14/run/stream", { goal })) {
        if (event.type === "step" && event.label === "plan") {
          setStage(1);
          setPlan((event.steps ?? []).map((text) => ({ text, done: false, result: null })));
        } else if (event.type === "step" && event.label === "executing") {
          setStage(2);
        } else if (event.type === "step" && event.label === "step_done") {
          const idx = event.index ?? -1;
          const result = event.result ?? "";
          setPlan((p) => p.map((item, i) => (i === idx ? { ...item, done: true, result } : item)));
        } else if (event.type === "done") {
          setStage(NODES.length);
          setFinalAnswer(event.final_answer ?? "");
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
      <h1 className="text-2xl font-bold mb-2 text-neutral-100">14 — Plan-and-Execute Architecture</h1>
      <p className="text-neutral-400 mb-4">
        Scenario: an agent that writes its whole plan up front, then works through it top to bottom.
      </p>

      <ConceptPanel
        plain={
          <>
            Instead of figuring things out one step at a time, this agent writes its whole plan
            first — like making a to-do list before starting — then works through it top to
            bottom, checking off each step as it goes.
          </>
        }
        technical={
          <>
            This is the <Term term="agent">plan-and-execute</Term> pattern: a planner produces a
            fixed sequence of steps up front, then an executor carries each one out in order.
            Contrast this with module 13&apos;s <Term term="agent">ReAct</Term> loop — ReAct
            decides its next move reactively, one observation at a time, which can adapt mid-task
            but is harder to audit. Plan-and-execute is more predictable and the whole plan is
            visible before any work happens, at the cost of being less able to react to surprises
            partway through.
          </>
        }
      />

      {stage >= 0 && <FlowDiagram nodes={NODES} states={stageStates(stage)} />}

      <div className="flex gap-2 mb-4">
        <input
          className="flex-1 border border-neutral-700 bg-neutral-900 text-neutral-100 placeholder-neutral-500 rounded-full px-4 py-2 focus:outline-none focus:border-teal-300/60"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && run()}
        />
        <button
          onClick={run}
          disabled={loading}
          className="bg-teal-300 text-black glow-mint-sm rounded-full px-5 py-2 disabled:opacity-50 font-medium hover:bg-teal-200 transition-colors"
        >
          {loading ? "…" : "Run"}
        </button>
      </div>

      {errorMsg && <p className="text-red-400 text-sm mb-4">{errorMsg}</p>}

      {plan.length > 0 && (
        <ol className="space-y-3 mb-4">
          {plan.map((item, i) => (
            <li key={i} className="flex gap-3">
              <span
                className={
                  "mt-0.5 w-5 h-5 shrink-0 rounded-full border-2 flex items-center justify-center text-[11px] transition-colors " +
                  (item.done ? "border-teal-400 bg-teal-300/15 text-teal-200" : "border-neutral-700 text-neutral-600")
                }
              >
                {item.done ? "✓" : i + 1}
              </span>
              <div className="flex-1">
                <div className={item.done ? "text-neutral-100" : "text-neutral-400"}>{item.text}</div>
                {item.result && (
                  <div className="text-sm text-neutral-500 mt-1 leading-relaxed line-clamp-3">{item.result}</div>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}

      {finalAnswer && (
        <div className="rounded-xl border border-neutral-800 panel p-4 text-neutral-200 whitespace-pre-wrap leading-relaxed mb-4">
          <TypewriterText text={finalAnswer} />
        </div>
      )}

      {finalAnswer && (
        <ResultPanel>
          The whole plan was visible before any work happened — unlike module 13&apos;s ReAct
          loop, where each next move only gets decided after seeing the previous
          observation.
        </ResultPanel>
      )}
    </main>
  );
}
