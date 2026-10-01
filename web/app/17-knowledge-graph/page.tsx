"use client";
import { useEffect, useState } from "react";
import { streamEvents } from "@/lib/sse";
import { ConceptPanel, ResultPanel } from "@/components/ConceptPanel";
import { Term } from "@/components/Term";
import { FlowDiagram, type FlowNodeState } from "@/components/FlowDiagram";
import { TypewriterText } from "@/components/TypewriterText";
import { FileText, Share2, Route, MessageCircle } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

const NODES = [
  { id: "text", icon: FileText, label: "Text" },
  { id: "extract", icon: Share2, label: "Extract" },
  { id: "traverse", icon: Route, label: "Traverse" },
  { id: "answer", icon: MessageCircle, label: "Answer" },
];

type Triple = { subject: string; predicate: string; object: string };
type Phase = "idle" | "extracting" | "traversing" | "done" | "error";

function stateFor(phase: Phase): FlowNodeState[] {
  switch (phase) {
    case "idle":
      return ["pending", "pending", "pending", "pending"];
    case "extracting":
      return ["done", "active", "pending", "pending"];
    case "traversing":
      return ["done", "done", "active", "pending"];
    case "done":
      return ["done", "done", "done", "done"];
    case "error":
      return ["done", "fail", "pending", "pending"];
    default:
      return ["pending", "pending", "pending", "pending"];
  }
}

function tripleKey(t: Triple): string {
  return `${t.subject}__${t.predicate}__${t.object}`;
}

export default function Page() {
  const [sourceText, setSourceText] = useState("");
  const [question, setQuestion] = useState(
    "What product did the company Jane Lee leads gain by acquiring BetaSoft?"
  );
  const [phase, setPhase] = useState<Phase>("idle");
  const [triples, setTriples] = useState<Triple[]>([]);
  const [usedTriples, setUsedTriples] = useState<Triple[]>([]);
  const [answer, setAnswer] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/17/source`)
      .then((r) => r.json())
      .then((data) => setSourceText(data.text))
      .catch(() => setSourceText(""));
  }, []);

  async function run() {
    setLoading(true);
    setPhase("extracting");
    setTriples([]);
    setUsedTriples([]);
    setAnswer(null);
    setErrorMsg(null);
    try {
      for await (const event of streamEvents<{
        type: string;
        label?: string;
        triples?: Triple[];
        used_triples?: Triple[];
        answer?: string;
        message?: string;
      }>("/api/17/ask/stream", { question })) {
        if (event.type === "step" && event.label === "extracting") {
          setTriples(event.triples ?? []);
          setPhase("traversing");
        } else if (event.type === "step" && event.label === "traversing") {
          setUsedTriples(event.used_triples ?? []);
        } else if (event.type === "done") {
          setAnswer(event.answer ?? "");
          setTriples(event.triples ?? []);
          setUsedTriples(event.used_triples ?? []);
          setPhase("done");
        } else if (event.type === "error") {
          setErrorMsg(event.message ?? "Something went wrong");
          setPhase("error");
        }
      }
    } catch (e) {
      setErrorMsg((e as Error).message);
      setPhase("error");
    } finally {
      setLoading(false);
    }
  }

  const usedKeys = new Set(usedTriples.map(tripleKey));

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold mb-2 text-neutral-100">17 — Knowledge Graph</h1>
      <p className="text-neutral-400 mb-4">
        Scenario: answering a question that needs multiple connected facts, not just similar-sounding text.
      </p>

      <ConceptPanel
        plain={
          <>
            Instead of searching for similar-sounding text like modules 01, 02, and 05 do, this
            builds an actual map of facts and their relationships, then follows that map step by
            step to answer questions that need connecting multiple facts together — even when
            none of the facts along the way share a single word with the question.
          </>
        }
        technical={
          <>
            This extracts a <Term term="embedding">knowledge graph</Term> (subject-predicate-object
            triples) from the source text, then answers via multi-hop graph traversal. Contrast
            with <Term term="rag">vector RAG</Term> (module 05): a vector store retrieves text
            that <em>looks similar</em> to the question, while a knowledge graph traversal follows{" "}
            <em>explicit relationships</em> even when the intermediate facts share no vocabulary
            with the question at all — the only thing connecting them is the graph structure
            itself.
          </>
        }
      />

      <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 text-neutral-400 text-sm p-4 mb-4">
        {sourceText || "Loading source text..."}
      </div>

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
          className="bg-teal-300 text-black glow-mint-sm rounded-full px-5 py-2 font-medium disabled:opacity-50 hover:bg-teal-200 transition-colors"
        >
          {loading ? "…" : "Ask"}
        </button>
      </div>

      {phase !== "idle" && <FlowDiagram nodes={NODES} states={stateFor(phase)} />}

      {errorMsg && <p className="text-red-400 text-sm mb-4">{errorMsg}</p>}

      {triples.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {triples.map((t, i) => {
            const used = usedKeys.has(tripleKey(t));
            return (
              <span
                key={i}
                className={
                  "inline-flex items-center rounded-full border px-2.5 py-1 text-xs " +
                  (used
                    ? "border-teal-300/40 bg-teal-300/10 text-teal-200"
                    : "border-neutral-800 bg-neutral-900/50 text-neutral-500")
                }
              >
                {t.subject} → {t.predicate} → {t.object}
              </span>
            );
          })}
        </div>
      )}

      {answer && (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 text-neutral-100 px-4 py-3 mb-4">
          <TypewriterText text={answer} />
        </div>
      )}

      {phase === "done" && (
        <ResultPanel>
          The answer traced through the highlighted chain of facts above — each one connected to
          the next by an explicit relationship, not by shared vocabulary with the question. None
          of those intermediate facts needed to sound anything like &quot;{question}&quot; for
          the graph to find them.
        </ResultPanel>
      )}
    </main>
  );
}
