"use client";
import { useState } from "react";
import { apiPost } from "@/lib/api";
import { ConceptPanel, ResultPanel } from "@/components/ConceptPanel";
import { Term } from "@/components/Term";

type ScoredText = { text: string; score: number };
type CompareResponse = { tfidf: ScoredText; semantic: ScoredText; better_match: boolean };

export default function Page() {
  const [query, setQuery] = useState("I was billed two times");
  const [data, setData] = useState<CompareResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      setData(await apiPost<CompareResponse>("/api/02/compare", { query }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-2">02 — Embeddings: Semantic</h1>
      <p className="text-gray-600 mb-4">Scenario: the same ticket search, now using meaning instead of literal words.</p>

      <ConceptPanel
        plain={
          <>
            This is the same support-ticket search from module 01, run twice on the same
            question — once the old way (matching words), once the modern way (matching
            meaning). Watch the second score beat the first on a question that uses completely
            different words than the ticket it&apos;s looking for.
          </>
        }
        technical={
          <>
            Both texts are converted into an{" "}
            <Term term="embedding">embedding</Term> — a list of numbers produced by a
            sentence-transformer model (<code>all-MiniLM-L6-v2</code>) that captures meaning,
            not vocabulary. Comparing embeddings with cosine similarity is{" "}
            <Term term="semanticSearch">semantic search</Term>: two phrases with zero words in
            common can still score highly if they mean the same thing. This is the single idea
            underneath modern AI search, chat memory, and{" "}
            <Term term="rag">retrieval-augmented generation</Term> — everything downstream in
            this curriculum builds on it.
          </>
        }
      />

      <input className="w-full border rounded px-3 py-2 mb-2" value={query} onChange={(e) => setQuery(e.target.value)} />
      <button onClick={run} disabled={loading} className="bg-black text-white rounded px-4 py-2 disabled:opacity-50">
        {loading ? "Running..." : "Compare TF-IDF vs Semantic"}
      </button>
      {error && <p className="text-red-600 mt-4">{error}</p>}
      {data && (
        <>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="border rounded p-3">
              <div className="font-semibold">TF-IDF: {data.tfidf.score.toFixed(3)}</div>
              <div className="text-sm text-gray-700">{data.tfidf.text}</div>
            </div>
            <div className="border rounded p-3">
              <div className="font-semibold">Semantic: {data.semantic.score.toFixed(3)}</div>
              <div className="text-sm text-gray-700">{data.semantic.text}</div>
            </div>
          </div>
          <ResultPanel>
            {data.better_match ? (
              <>
                TF-IDF scored <strong>{data.tfidf.score.toFixed(3)}</strong>, semantic scored{" "}
                <strong>{data.semantic.score.toFixed(3)}</strong> — a gap of{" "}
                <strong>{(data.semantic.score - data.tfidf.score).toFixed(3)}</strong>. That gap
                is the AI genuinely understanding what you meant, not just which words you used.
                Nothing about the ticket text changed between the two columns above — only how
                the computer compared it to your question.
              </>
            ) : (
              <>
                This time both approaches landed on similar tickets — your query happened to
                share enough words with the right answer that TF-IDF didn&apos;t need meaning
                to find it. Try a more paraphrased question to see the gap open up.
              </>
            )}
          </ResultPanel>
        </>
      )}
    </main>
  );
}
