"use client";
import { useState } from "react";
import { streamEvents } from "@/lib/sse";
import { ConceptPanel, ResultPanel } from "@/components/ConceptPanel";
import { Term } from "@/components/Term";
import { FlowDiagram, type FlowNodeState } from "@/components/FlowDiagram";
import { ConfidenceGauge } from "@/components/ConfidenceGauge";
import { SourceChips } from "@/components/SourceChips";
import { TypewriterText } from "@/components/TypewriterText";

const THRESHOLD = 0.3;

const NODES = [
  { id: "question", icon: "❓", label: "Question" },
  { id: "search", icon: "🔎", label: "Search" },
  { id: "confidence", icon: "🛡️", label: "Confidence" },
  { id: "answer", icon: "💬", label: "Answer" },
];

type Chunk = { source: string; score: number; raw_vector_score: number };
type Phase = "idle" | "searching" | "searched" | "checking" | "answered" | "refused" | "error";

type ColumnState = {
  phase: Phase;
  chunks: Chunk[];
  topScore: number | null;
  result: string | null;
  errorMsg: string | null;
};

const IDLE: ColumnState = { phase: "idle", chunks: [], topScore: null, result: null, errorMsg: null };

function nodeStates(phase: Phase): FlowNodeState[] {
  switch (phase) {
    case "idle":
      return ["pending", "pending", "pending", "pending"];
    case "searching":
      return ["done", "active", "pending", "pending"];
    case "searched":
      return ["done", "done", "pending", "pending"];
    case "checking":
      return ["done", "done", "active", "pending"];
    case "answered":
      return ["done", "done", "done", "done"];
    case "refused":
      return ["done", "done", "done", "fail"];
    case "error":
      return ["done", "fail", "pending", "pending"];
    default:
      return ["pending", "pending", "pending", "pending"];
  }
}

function Column({ label, accent, question, state }: { label: string; accent: string; question: string; state: ColumnState }) {
  const passed = state.topScore !== null && state.topScore >= THRESHOLD;
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-2">
        <span className={"inline-block w-2 h-2 rounded-full " + accent} />
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-sm text-gray-700 mb-3 truncate" title={question}>
        &quot;{question}&quot;
      </div>

      <FlowDiagram nodes={NODES} states={nodeStates(state.phase)} compact />

      {state.chunks.length > 0 && <SourceChips chunks={state.chunks} threshold={THRESHOLD} limit={3} />}
      {state.topScore !== null && <ConfidenceGauge score={state.topScore} threshold={THRESHOLD} passed={passed} width={220} />}
      {state.errorMsg && <p className="text-red-600 text-sm mt-2">{state.errorMsg}</p>}

      {state.result && (
        <div
          className={
            "mt-3 rounded-xl border px-3 py-2.5 text-sm animate-[fadeIn_0.3s_ease-out] " +
            (state.phase === "refused" ? "border-red-200 bg-red-50 text-red-800" : "border-gray-200 bg-white shadow-sm")
          }
        >
          <div className="font-semibold text-xs mb-1">{state.phase === "refused" ? "Refused" : "Answered"}</div>
          <div className="whitespace-pre-wrap">
            <TypewriterText text={state.result} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  const [topicQuestion, setTopicQuestion] = useState("What does this curriculum teach?");
  const [offTopicQuestion, setOffTopicQuestion] = useState("what is the best pizza topping for a party?");
  const [left, setLeft] = useState<ColumnState>(IDLE);
  const [right, setRight] = useState<ColumnState>(IDLE);
  const [loading, setLoading] = useState(false);

  async function runColumn(question: string, setState: (updater: (s: ColumnState) => ColumnState) => void) {
    setState(() => ({ ...IDLE, phase: "searching" }));
    try {
      for await (const event of streamEvents<{
        type: string;
        label?: string;
        chunks?: Chunk[];
        top_raw_vector_score?: number | null;
        result?: string;
        message?: string;
      }>("/api/06/ask/stream", { question })) {
        if (event.type === "step" && event.label === "retrieved") {
          setState((s) => ({ ...s, phase: "searched", chunks: event.chunks ?? [], topScore: event.top_raw_vector_score ?? null }));
        } else if (event.type === "step" && event.label === "checking") {
          setState((s) => ({ ...s, phase: "checking" }));
        } else if (event.type === "done") {
          const refused = (event.result ?? "").startsWith("REFUSED");
          setState((s) => ({ ...s, phase: refused ? "refused" : "answered", result: event.result ?? null }));
        } else if (event.type === "error") {
          setState((s) => ({ ...s, phase: "error", errorMsg: event.message ?? "Something went wrong" }));
        }
      }
    } catch (e) {
      setState((s) => ({ ...s, phase: "error", errorMsg: (e as Error).message }));
    }
  }

  async function runComparison() {
    setLoading(true);
    setLeft(IDLE);
    setRight(IDLE);
    await Promise.all([runColumn(topicQuestion, setLeft), runColumn(offTopicQuestion, setRight)]);
    setLoading(false);
  }

  const bothDone = (left.phase === "answered" || left.phase === "refused") && (right.phase === "answered" || right.phase === "refused");

  return (
    <main className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-2">06 — RAG Evaluation &amp; Guardrails</h1>
      <p className="text-gray-600 mb-4">Scenario: grading the RAG bot&apos;s own answers before trusting them — watch both outcomes at once.</p>

      <ConceptPanel
        plain={
          <>
            This is the safety check sitting on top of module 05. Before trusting its own
            answer, the system asks itself: &quot;did I actually find anything relevant enough
            to answer this?&quot; Below, the <em>same system</em> runs two questions side by
            side at the same time — watch one gauge land in the green and the other in the red.
          </>
        }
        technical={
          <>
            The retrieval confidence (<Term term="vectorScore">raw vector score</Term>) of the
            best-matching chunk is checked against a fixed threshold <em>before</em> the model is
            ever asked to generate an answer. Below the threshold, the request is refused
            immediately — no generation call happens at all, which both saves cost and
            structurally prevents a <Term term="hallucination">hallucinated</Term> answer.
          </>
        }
      />

      <div className="grid sm:grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">On-topic question</label>
          <input
            className="w-full border rounded-full px-4 py-2 text-sm"
            value={topicQuestion}
            onChange={(e) => setTopicQuestion(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Off-topic question</label>
          <input
            className="w-full border rounded-full px-4 py-2 text-sm"
            value={offTopicQuestion}
            onChange={(e) => setOffTopicQuestion(e.target.value)}
          />
        </div>
      </div>

      <button
        onClick={runComparison}
        disabled={loading}
        className="bg-black text-white rounded-full px-6 py-2.5 font-medium disabled:opacity-50 mb-6 hover:bg-gray-800 transition-colors"
      >
        {loading ? "Running both..." : "▶ Run comparison"}
      </button>

      <div className="grid sm:grid-cols-2 gap-6 border-t pt-6">
        <Column label="On-topic" accent="bg-green-500" question={topicQuestion} state={left} />
        <Column label="Off-topic" accent="bg-gray-400" question={offTopicQuestion} state={right} />
      </div>

      {bothDone && (
        <ResultPanel>
          Same system, same {THRESHOLD.toFixed(2)} confidence threshold, two different outcomes.
          The on-topic question scored{" "}
          <strong>{left.topScore?.toFixed(3)}</strong> — {left.phase === "answered" ? "cleared the bar and got a real answer" : "still got refused"}. The off-topic
          question scored <strong>{right.topScore?.toFixed(3)}</strong> —{" "}
          {right.phase === "refused" ? "fell short and was correctly refused instead of guessing" : "surprisingly cleared the bar too — try a more clearly unrelated question"}.
        </ResultPanel>
      )}
    </main>
  );
}
