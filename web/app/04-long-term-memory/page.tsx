"use client";
import { useState } from "react";
import { apiPost } from "@/lib/api";
import { ConceptPanel, ResultPanel } from "@/components/ConceptPanel";
import { Term } from "@/components/Term";
import { ChatThread, type Bubble } from "@/components/ChatThread";

type RememberResponse = { id: string };
type RecallResponse = { result: string | null; distance: number | null };

let seq = 0;
const nextId = () => `b${seq++}`;

export default function Page() {
  const [fact, setFact] = useState("I'm vegetarian");
  const [question, setQuestion] = useState("what should I eat");
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [resultNote, setResultNote] = useState<React.ReactNode | null>(null);
  const [loading, setLoading] = useState<"remember" | "recall" | null>(null);

  async function remember() {
    setLoading("remember");
    setBubbles((b) => [...b, { id: nextId(), role: "user", icon: "📝", body: `Remember: ${fact}` }]);
    try {
      const data = await apiPost<RememberResponse>("/api/04/remember", { fact });
      setBubbles((b) => [...b, { id: nextId(), role: "step", icon: "💾", body: `Saved (id=${data.id})` }]);
    } catch (e) {
      setBubbles((b) => [...b, { id: nextId(), role: "error", icon: "⚠️", body: (e as Error).message }]);
    } finally {
      setLoading(null);
    }
  }

  async function recall() {
    setLoading("recall");
    setResultNote(null);
    setBubbles((b) => [...b, { id: nextId(), role: "user", icon: "❓", body: question }]);
    try {
      const data = await apiPost<RecallResponse>("/api/04/recall", { query: question });
      setBubbles((b) => [
        ...b,
        {
          id: nextId(),
          role: "answer",
          body: data.result ? `${data.result} (distance=${data.distance?.toFixed(3)})` : "Nothing remembered yet.",
        },
      ]);
      setResultNote(
        data.result ? (
          <>
            The assistant found <strong>&quot;{data.result}&quot;</strong> with a distance of{" "}
            <strong>{data.distance?.toFixed(3)}</strong>. Distance works the opposite of a
            similarity score — the lower the number, the closer the match in meaning. Notice
            your question didn&apos;t need to share any words with the fact you taught it.
          </>
        ) : (
          <>
            Nothing has been taught yet, or nothing close enough to your question was found.
            Click &quot;Remember&quot; first, then try recalling again.
          </>
        )
      );
    } catch (e) {
      setBubbles((b) => [...b, { id: nextId(), role: "error", icon: "⚠️", body: (e as Error).message }]);
    } finally {
      setLoading(null);
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold mb-2 text-neutral-100">04 — Long-Term Memory (Persistent, Cross-Session)</h1>
      <p className="text-neutral-400 mb-4">Scenario: a personal assistant that remembers facts across separate sessions.</p>

      <ConceptPanel
        plain={
          <>
            Unlike module 03&apos;s short memory, this is like a notebook the assistant can
            write to and read from later — even after the conversation has completely ended.
            Teach it a fact below, then ask a related question in a totally different wording.
          </>
        }
        technical={
          <>
            Facts are converted into an <Term term="embedding">embedding</Term> and saved in a
            persistent vector database (Chroma) on disk — it survives even restarting the whole
            application. Recall works by embedding your question and finding the <em>nearest</em>{" "}
            stored fact by vector distance, exactly like{" "}
            <Term term="semanticSearch">semantic search</Term> in module 02, just backed by
            permanent storage.
          </>
        }
      />

      <ChatThread bubbles={bubbles} />

      <div className="flex gap-2 mb-2">
        <input
          className="flex-1 border border-neutral-700 bg-neutral-900 text-neutral-100 placeholder-neutral-500 rounded-full px-4 py-2 focus:outline-none focus:border-teal-300/60"
          value={fact}
          onChange={(e) => setFact(e.target.value)}
        />
        <button
          onClick={remember}
          disabled={loading !== null}
          className="bg-teal-300 text-black glow-mint-sm rounded-full px-4 py-2 disabled:opacity-50 text-sm font-medium hover:bg-teal-200 transition-colors"
        >
          {loading === "remember" ? "…" : "Remember"}
        </button>
      </div>
      <div className="flex gap-2 mb-2">
        <input
          className="flex-1 border border-neutral-700 bg-neutral-900 text-neutral-100 placeholder-neutral-500 rounded-full px-4 py-2 focus:outline-none focus:border-teal-300/60"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <button
          onClick={recall}
          disabled={loading !== null}
          className="bg-neutral-800 border border-neutral-700 text-neutral-200 rounded-full px-4 py-2 disabled:opacity-50 text-sm hover:bg-neutral-700 transition-colors"
        >
          {loading === "recall" ? "…" : "Recall"}
        </button>
      </div>

      {resultNote && <ResultPanel>{resultNote}</ResultPanel>}
    </main>
  );
}
