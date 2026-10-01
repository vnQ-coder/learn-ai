"use client";
import { useState } from "react";
import { streamEvents } from "@/lib/sse";
import { ConceptPanel, ResultPanel } from "@/components/ConceptPanel";
import { FlowDiagram, type FlowNodeState } from "@/components/FlowDiagram";
import { HelpCircle, Search, ArrowUpDown, ListOrdered } from "lucide-react";

const NODES = [
  { id: "query", icon: HelpCircle, label: "Query" },
  { id: "search", icon: Search, label: "Vector Search" },
  { id: "rerank", icon: ArrowUpDown, label: "Rerank" },
  { id: "final", icon: ListOrdered, label: "Final Order" },
];

type Phase = "idle" | "searching" | "searched" | "reranking" | "done" | "error";

function stageStates(phase: Phase): FlowNodeState[] {
  switch (phase) {
    case "idle":
      return ["pending", "pending", "pending", "pending"];
    case "searching":
      return ["done", "active", "pending", "pending"];
    case "searched":
      return ["done", "done", "pending", "pending"];
    case "reranking":
      return ["done", "done", "active", "pending"];
    case "done":
      return ["done", "done", "done", "done"];
    case "error":
      return ["done", "fail", "pending", "pending"];
    default:
      return ["pending", "pending", "pending", "pending"];
  }
}

type InitialResult = { text: string; vector_score: number };
type RerankedResult = { text: string; vector_score: number; rerank_score: number };

export default function Page() {
  const [query, setQuery] = useState("how do I stop being double billed");
  const [phase, setPhase] = useState<Phase>("idle");
  const [loading, setLoading] = useState(false);
  const [initial, setInitial] = useState<InitialResult[]>([]);
  const [reranked, setReranked] = useState<RerankedResult[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setPhase("searching");
    setInitial([]);
    setReranked([]);
    setErrorMsg(null);
    try {
      for await (const event of streamEvents<{
        type: string;
        label?: string;
        results?: InitialResult[];
        initial?: InitialResult[];
        reranked?: RerankedResult[];
        message?: string;
      }>("/api/26/search/stream", { query })) {
        if (event.type === "step" && event.label === "initial") {
          setPhase("searched");
          setInitial(event.results ?? []);
        } else if (event.type === "step" && event.label === "reranking") {
          setPhase("reranking");
        } else if (event.type === "done") {
          setPhase("done");
          setInitial(event.initial ?? []);
          setReranked(event.reranked ?? []);
        } else if (event.type === "error") {
          setPhase("error");
          setErrorMsg(event.message ?? "Something went wrong");
        }
      }
    } catch (e) {
      setPhase("error");
      setErrorMsg((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const initialOrder = initial.map((r) => r.text);
  const rerankedOrder = reranked.map((r) => r.text);

  function rankBadge(text: string, newIndex: number) {
    const oldIndex = initialOrder.indexOf(text);
    if (oldIndex === -1) return null;
    const delta = oldIndex - newIndex;
    if (delta === 0) {
      return <span className="text-[10px] text-neutral-600 font-mono">—</span>;
    }
    const up = delta > 0;
    return (
      <span className={"text-[10px] font-mono " + (up ? "text-teal-300" : "text-neutral-500")}>
        {up ? "↑" : "↓"}
        {Math.abs(delta)}
      </span>
    );
  }

  let mostMoved: RerankedResult | null = null;
  let mostMovedDelta = 0;
  for (let newIndex = 0; newIndex < reranked.length; newIndex++) {
    const r = reranked[newIndex];
    const oldIndex = initialOrder.indexOf(r.text);
    const delta = Math.abs(oldIndex - newIndex);
    if (delta > mostMovedDelta) {
      mostMovedDelta = delta;
      mostMoved = r;
    }
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold mb-2 text-neutral-100">26 — Reranking</h1>
      <p className="text-neutral-400 mb-4">Scenario: a fast first-pass search, then a slower, smarter second look at just the top candidates.</p>

      <ConceptPanel
        plain={
          <>
            The first pass of search is fast but rough — like skimming a stack of resumes
            quickly. Reranking is a slower, more careful second look at just the top candidates,
            using a smarter judge to put them in the <em>right</em> order before you actually use
            them.
          </>
        }
        technical={
          <>
            This is the two-stage retrieval pattern used across production search and RAG
            systems: a cheap, approximate retriever (vector search) casts a wide net quickly,
            then an expensive, accurate reranker — here, an LLM scoring each candidate
            individually — re-sorts just that shortlist. Running the expensive reranker over the
            <em> whole</em> corpus would be too slow; running it over just the top-K candidates is
            affordable.
          </>
        }
      />

      {phase !== "idle" && <FlowDiagram nodes={NODES} states={stageStates(phase)} />}

      <div className="flex gap-2 mb-6">
        <input
          className="flex-1 border border-neutral-700 bg-neutral-900 text-neutral-100 placeholder-neutral-500 rounded-full px-4 py-2 focus:outline-none focus:border-teal-300/60"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && run()}
        />
        <button
          onClick={run}
          disabled={loading}
          className="bg-teal-300 text-black glow-mint-sm rounded-full px-5 py-2 disabled:opacity-50 font-medium hover:bg-teal-200 transition-colors"
        >
          {loading ? "Running..." : "▶ Run"}
        </button>
      </div>

      {errorMsg && <p className="text-red-400 text-sm mb-4">{errorMsg}</p>}

      {(initial.length > 0 || reranked.length > 0) && (
        <div className="grid sm:grid-cols-2 gap-6 border-t border-neutral-800 pt-6">
          <div>
            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">
              Initial order (vector search)
            </div>
            <div className="space-y-1.5">
              {initial.map((r, i) => (
                <div key={r.text} className="rounded-lg border border-neutral-800 panel p-2.5 text-sm">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-neutral-500 text-xs">#{i + 1}</span>
                    <span className="text-xs font-mono text-neutral-500">score {r.vector_score.toFixed(3)}</span>
                  </div>
                  <div className="text-neutral-200">{r.text}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">
              Reranked order (LLM judge)
            </div>
            <div className="space-y-1.5">
              {reranked.map((r, i) => (
                <div
                  key={r.text}
                  className={
                    "rounded-lg border p-2.5 text-sm " +
                    (initialOrder.indexOf(r.text) !== i ? "border-teal-300/40 bg-teal-300/5" : "border-neutral-800 panel")
                  }
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-neutral-500 text-xs flex items-center gap-1.5">
                      #{i + 1} {rankBadge(r.text, i)}
                    </span>
                    <span className="text-xs font-mono text-neutral-500">score {r.rerank_score}/10</span>
                  </div>
                  <div className="text-neutral-200">{r.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {phase === "done" && mostMoved && (
        <ResultPanel>
          <strong className="text-teal-300">&quot;{mostMoved.text}&quot;</strong> moved the most
          between the two rankings — the vector search undervalued it based on raw word
          similarity, but the LLM judge recognized it was actually more relevant to the question
          than its surface-level wording suggested, and moved it up accordingly.
        </ResultPanel>
      )}
    </main>
  );
}
