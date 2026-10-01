"use client";
import { useState } from "react";
import { streamEvents } from "@/lib/sse";
import { ConceptPanel, ResultPanel } from "@/components/ConceptPanel";
import { Term } from "@/components/Term";
import { FlowDiagram, type FlowNodeState } from "@/components/FlowDiagram";
import { ConfidenceGauge } from "@/components/ConfidenceGauge";
import { SourceChips } from "@/components/SourceChips";

const THRESHOLD = 0.3;

const NODES = [
  { id: "question", icon: "❓", label: "Your question" },
  { id: "search", icon: "🔎", label: "Search docs" },
  { id: "confidence", icon: "🛡️", label: "Confidence check" },
  { id: "answer", icon: "💬", label: "Answer / refuse" },
];

type Chunk = { source: string; score: number; raw_vector_score: number };

type Phase = "idle" | "searching" | "searched" | "checking" | "answered" | "refused" | "error";

export default function Page() {
  const [question, setQuestion] = useState("What does this curriculum teach?");
  const [phase, setPhase] = useState<Phase>("idle");
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [topScore, setTopScore] = useState<number | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const loading = phase === "searching" || phase === "searched" || phase === "checking";

  function nodeStates(): FlowNodeState[] {
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

  async function run(q: string) {
    setPhase("searching");
    setChunks([]);
    setTopScore(null);
    setResult(null);
    setErrorMsg(null);
    try {
      for await (const event of streamEvents<{
        type: string;
        label?: string;
        chunks?: Chunk[];
        top_raw_vector_score?: number | null;
        result?: string;
        message?: string;
      }>("/api/06/ask/stream", { question: q })) {
        if (event.type === "step" && event.label === "retrieved") {
          setPhase("searched");
          setChunks(event.chunks ?? []);
          setTopScore(event.top_raw_vector_score ?? null);
        } else if (event.type === "step" && event.label === "checking") {
          setPhase("checking");
        } else if (event.type === "done") {
          const refused = (event.result ?? "").startsWith("REFUSED");
          setPhase(refused ? "refused" : "answered");
          setResult(event.result ?? null);
        } else if (event.type === "error") {
          setPhase("error");
          setErrorMsg(event.message ?? "Something went wrong");
        }
      }
    } catch (e) {
      setPhase("error");
      setErrorMsg((e as Error).message);
    }
  }

  const passed = topScore !== null && topScore >= THRESHOLD;

  return (
    <main className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-2">06 — RAG Evaluation &amp; Guardrails</h1>
      <p className="text-gray-600 mb-4">Scenario: grading the RAG bot&apos;s own answers before trusting them.</p>

      <ConceptPanel
        plain={
          <>
            This is the safety check sitting on top of module 05. Before trusting its own
            answer, the system asks itself: &quot;did I actually find anything relevant enough
            to answer this?&quot; Watch the gauge below — if the needle lands in the red, left of
            the threshold line, the system refuses instead of making something up.
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

      <FlowDiagram nodes={NODES} states={nodeStates()} />

      <div className="flex gap-2 mb-2">
        <input
          className="flex-1 border rounded-full px-4 py-2"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && run(question)}
        />
      </div>
      <div className="flex gap-3 mb-4">
        <button onClick={() => run(question)} disabled={loading} className="bg-black text-white rounded-full px-4 py-2 disabled:opacity-50 text-sm">
          Ask on-topic question
        </button>
        <button
          onClick={() => run("what is the best pizza topping for a party?")}
          disabled={loading}
          className="bg-gray-700 text-white rounded-full px-4 py-2 disabled:opacity-50 text-sm"
        >
          Ask something unrelated
        </button>
      </div>

      {chunks.length > 0 && (
        <>
          <div className="text-sm text-gray-600 mb-1">Documents found:</div>
          <SourceChips chunks={chunks} threshold={THRESHOLD} />
        </>
      )}

      {topScore !== null && <ConfidenceGauge score={topScore} threshold={THRESHOLD} passed={passed} />}

      {errorMsg && <p className="text-red-600 mt-2">{errorMsg}</p>}

      {result && (
        <div
          className={
            "mt-4 rounded-2xl border px-4 py-3 " +
            (phase === "refused" ? "border-red-200 bg-red-50 text-red-800" : "border-gray-200 bg-white shadow-sm")
          }
        >
          <div className="font-semibold text-sm mb-1">{phase === "refused" ? "Refused" : "Answer"}</div>
          <div className="whitespace-pre-wrap">{result}</div>
        </div>
      )}

      {(phase === "answered" || phase === "refused") && (
        <ResultPanel>
          {phase === "refused" ? (
            <>
              The gauge needle landed below the threshold line, so the system refused before
              ever generating an answer. This is the guardrail working correctly — a weaker
              system would have tried to answer anyway, confidently, from general knowledge
              instead of your documents.
            </>
          ) : (
            <>
              The gauge needle cleared the threshold line, so the system trusted its retrieval
              enough to generate a grounded answer. Try the unrelated question button to see the
              exact opposite outcome on the same system.
            </>
          )}
        </ResultPanel>
      )}
    </main>
  );
}
