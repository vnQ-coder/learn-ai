"use client";
import { useState } from "react";
import { apiPost } from "@/lib/api";
import { ConceptPanel, ResultPanel } from "@/components/ConceptPanel";
import { Term } from "@/components/Term";

type RememberResponse = { id: string };
type RecallResponse = { result: string | null; distance: number | null };

export default function Page() {
  const [fact, setFact] = useState("I'm vegetarian");
  const [question, setQuestion] = useState("what should I eat");
  const [rememberMsg, setRememberMsg] = useState<string | null>(null);
  const [recallResult, setRecallResult] = useState<RecallResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<"remember" | "recall" | null>(null);

  async function remember() {
    setLoading("remember");
    setError(null);
    setRememberMsg(null);
    try {
      const data = await apiPost<RememberResponse>("/api/04/remember", { fact });
      setRememberMsg(`Remembered (id=${data.id}): ${fact}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(null);
    }
  }

  async function recall() {
    setLoading("recall");
    setError(null);
    setRecallResult(null);
    try {
      setRecallResult(await apiPost<RecallResponse>("/api/04/recall", { query: question }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(null);
    }
  }

  return (
    <main className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-2">04 — Long-Term Memory (Persistent, Cross-Session)</h1>
      <p className="text-gray-600 mb-4">Scenario: a personal assistant that remembers facts across separate sessions.</p>

      <ConceptPanel
        plain={
          <>
            Unlike module 03&apos;s short memory, this is like a notebook the assistant can
            write to and read from later — even after the conversation has completely ended.
            Teach it a fact below, then ask a related question in a totally different wording.
            It should still find it, because it&apos;s searching by meaning, not storing your
            exact sentence.
          </>
        }
        technical={
          <>
            Facts are converted into an <Term term="embedding">embedding</Term> and saved in a
            persistent vector database (Chroma) on disk — it survives even restarting the whole
            application. Recall works by embedding your question and finding the{" "}
            <em>nearest</em> stored fact by vector distance, exactly like{" "}
            <Term term="semanticSearch">semantic search</Term> in module 02, just backed by
            permanent storage instead of a one-off in-memory list. This pattern — embed, store,
            retrieve by similarity — is also the backbone of the{" "}
            <Term term="rag">RAG</Term> pipeline in modules 05–06.
          </>
        }
      />

      <div className="mb-6">
        <label className="block text-sm font-medium mb-1">Teach me a fact</label>
        <div className="flex gap-2">
          <input className="flex-1 border rounded px-3 py-2" value={fact} onChange={(e) => setFact(e.target.value)} />
          <button onClick={remember} disabled={loading !== null} className="bg-black text-white rounded px-4 py-2 disabled:opacity-50">
            {loading === "remember" ? "Remembering..." : "Remember"}
          </button>
        </div>
        {rememberMsg && <p className="text-green-700 text-sm mt-2">{rememberMsg}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Ask a question</label>
        <div className="flex gap-2">
          <input className="flex-1 border rounded px-3 py-2" value={question} onChange={(e) => setQuestion(e.target.value)} />
          <button onClick={recall} disabled={loading !== null} className="bg-black text-white rounded px-4 py-2 disabled:opacity-50">
            {loading === "recall" ? "Recalling..." : "Recall"}
          </button>
        </div>
        {recallResult && (
          <p className="text-sm mt-2">
            {recallResult.result
              ? `Recalled: ${recallResult.result} (distance=${recallResult.distance?.toFixed(3)})`
              : "Nothing remembered yet."}
          </p>
        )}
      </div>
      {error && <p className="text-red-600 mt-4">{error}</p>}

      {recallResult && (
        <ResultPanel>
          {recallResult.result ? (
            <>
              The assistant found <strong>&quot;{recallResult.result}&quot;</strong> with a
              distance of <strong>{recallResult.distance?.toFixed(3)}</strong>. Distance works
              the opposite of a similarity score — the lower the number, the closer the match in
              meaning. Notice your question didn&apos;t need to share any words with the fact
              you taught it; it only needed to be related in meaning.
            </>
          ) : (
            <>
              Nothing has been taught yet, or nothing close enough to your question was found.
              Click &quot;Remember&quot; above first, then try recalling again.
            </>
          )}
        </ResultPanel>
      )}
    </main>
  );
}
