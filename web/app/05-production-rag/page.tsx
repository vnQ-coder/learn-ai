"use client";
import { useState } from "react";
import { streamEvents } from "@/lib/sse";
import { ConceptPanel, ResultPanel } from "@/components/ConceptPanel";
import { Term } from "@/components/Term";
import { ChatThread, type Bubble } from "@/components/ChatThread";
import { FlowDiagram, type FlowNodeState } from "@/components/FlowDiagram";
import { TypewriterText } from "@/components/TypewriterText";

type RetrievedChunk = { source: string; score: number; raw_vector_score: number };

const NODES = [
  { id: "question", icon: "❓", label: "Question" },
  { id: "search", icon: "🔎", label: "Searching" },
  { id: "chunks", icon: "📄", label: "Chunks" },
  { id: "gemini", icon: "🧠", label: "Gemini" },
  { id: "answer", icon: "💬", label: "Answer" },
];

function stageStates(stage: number): FlowNodeState[] {
  return NODES.map((_, i) => {
    if (stage < 0) return "pending";
    if (i < stage) return "done";
    if (i === stage) return "active";
    return "pending";
  });
}

function filename(path: string): string {
  return path.split("/").pop() ?? path;
}

let seq = 0;
const nextId = () => `b${seq++}`;

export default function Page() {
  const [question, setQuestion] = useState("What does this curriculum teach?");
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [stage, setStage] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [lastTopScore, setLastTopScore] = useState<number | null>(null);
  const [resultNote, setResultNote] = useState<React.ReactNode | null>(null);

  async function run() {
    setLoading(true);
    setResultNote(null);
    setStage(0);
    setBubbles([{ id: nextId(), role: "user", body: question }]);
    try {
      for await (const event of streamEvents<{
        type: string;
        label?: string;
        text?: string;
        chunks?: RetrievedChunk[];
        retrieved?: RetrievedChunk[];
        answer?: string;
        message?: string;
      }>("/api/05/ask/stream", { question })) {
        if (event.type === "step" && event.label === "retrieving") {
          setStage(1);
          setBubbles((b) => [...b, { id: nextId(), role: "step", icon: "🔎", body: event.text }]);
        } else if (event.type === "step" && event.label === "retrieved") {
          setStage(2);
          const chunks = event.chunks ?? [];
          setBubbles((b) => [
            ...b,
            {
              id: nextId(),
              role: "step",
              icon: "📄",
              body: (
                <>
                  {event.text}
                  <ul className="mt-1 text-xs text-neutral-500 list-disc list-inside">
                    {chunks.map((c, i) => (
                      <li key={i}>
                        relevance={c.raw_vector_score.toFixed(3)} — {filename(c.source)}
                      </li>
                    ))}
                  </ul>
                </>
              ),
            },
          ]);
        } else if (event.type === "step" && event.label === "generating") {
          setStage(3);
          setBubbles((b) => [...b, { id: nextId(), role: "step", icon: "🧠", body: event.text }]);
        } else if (event.type === "done") {
          setStage(NODES.length);
          const topScore = event.retrieved?.[0]?.raw_vector_score ?? null;
          setLastTopScore(topScore);
          setBubbles((b) => [
            ...b,
            { id: nextId(), role: "answer", title: "Answer", body: <TypewriterText text={event.answer ?? ""} /> },
          ]);
          setResultNote(
            topScore !== null && topScore < 0.3 ? (
              <>
                The best match only scored <strong>{topScore.toFixed(3)}</strong> in relevance —
                fairly weak. Notice the answer above said so rather than confidently making
                something up; that&apos;s the retrieval-confidence check working as intended.
              </>
            ) : (
              <>
                The top chunk scored <strong>{topScore?.toFixed(3)}</strong> in relevance —
                strong enough that the system trusted it. Every claim in the answer should trace
                back to one of the sources listed above, not the model&apos;s general knowledge.
              </>
            )
          );
        } else if (event.type === "error") {
          setBubbles((b) => [...b, { id: nextId(), role: "error", icon: "⚠️", body: event.message }]);
        }
      }
    } catch (e) {
      setBubbles((b) => [...b, { id: nextId(), role: "error", icon: "⚠️", body: (e as Error).message }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold mb-2 text-neutral-100">05 — Production RAG (Hybrid Search + Citations)</h1>
      <p className="text-neutral-400 mb-4">Scenario: a documentation Q&amp;A bot over real markdown files.</p>

      <ConceptPanel
        plain={
          <>
            Instead of trusting an AI&apos;s memory for facts, this makes it look up real
            documents first, then answer using only what it found — like a research assistant
            who shows their sources instead of answering from vague recollection. Watch each
            step happen live below: searching, finding sources, then writing the answer.
          </>
        }
        technical={
          <>
            This is <Term term="rag">RAG</Term> (Retrieval-Augmented Generation) with{" "}
            <Term term="hybridSearch">hybrid search</Term>: your question is matched against
            indexed document chunks using both <Term term="bm25">BM25</Term> keyword scoring and
            semantic <Term term="embedding">embedding</Term> similarity, combined and
            re-ranked. The top chunks are handed to the model as context, and it&apos;s
            instructed to cite them inline (<code>[1]</code>, <code>[2]</code>, etc.) rather than
            answer from its own training data. If the best match&apos;s{" "}
            <Term term="vectorScore">raw vector score</Term> falls below a confidence floor, the
            system refuses rather than risk a <Term term="hallucination">hallucination</Term> —
            module 06 makes that refusal logic explicit. Every step below is streamed live from
            the backend the moment it actually happens, not simulated.
          </>
        }
      />

      {stage >= 0 && <FlowDiagram nodes={NODES} states={stageStates(stage)} />}

      <div className="flex gap-2 mb-2">
        <input
          className="flex-1 border border-neutral-700 bg-neutral-900 text-neutral-100 placeholder-neutral-500 rounded-full px-4 py-2 focus:outline-none focus:border-emerald-400/60"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && run()}
        />
        <button
          onClick={run}
          disabled={loading}
          className="bg-emerald-400 text-black rounded-full px-5 py-2 disabled:opacity-50 font-medium hover:bg-emerald-300 transition-colors"
        >
          {loading ? "…" : "Ask"}
        </button>
      </div>

      <ChatThread bubbles={bubbles} />
      {resultNote && <ResultPanel>{resultNote}</ResultPanel>}
    </main>
  );
}
