"use client";
import { useState } from "react";
import { apiPost } from "@/lib/api";
import { ConceptPanel, ResultPanel } from "@/components/ConceptPanel";
import { Term } from "@/components/Term";

type RetrievedChunk = { source: string; score: number; raw_vector_score: number };
type AskResponse = { retrieved: RetrievedChunk[]; answer: string };

function filename(path: string): string {
  return path.split("/").pop() ?? path;
}

export default function Page() {
  const [question, setQuestion] = useState("What does this curriculum teach?");
  const [data, setData] = useState<AskResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      setData(await apiPost<AskResponse>("/api/05/ask", { question }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const topScore = data?.retrieved[0]?.raw_vector_score;
  const isWeak = topScore !== undefined && topScore < 0.3;

  return (
    <main className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-2">05 — Production RAG (Hybrid Search + Citations)</h1>
      <p className="text-gray-600 mb-4">Scenario: a documentation Q&amp;A bot over real markdown files.</p>

      <ConceptPanel
        plain={
          <>
            Instead of trusting an AI&apos;s memory for facts, this makes it look up real
            documents first, then answer using only what it found — like a research assistant
            who shows their sources instead of answering from vague recollection. Ask a
            question and you&apos;ll see exactly which document chunks it pulled up before it
            wrote its answer.
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
            module 06 makes that refusal logic explicit.
          </>
        }
      />

      <input className="w-full border rounded px-3 py-2 mb-2" value={question} onChange={(e) => setQuestion(e.target.value)} />
      <button onClick={run} disabled={loading} className="bg-black text-white rounded px-4 py-2 disabled:opacity-50">
        {loading ? "Running..." : "Run RAG pipeline"}
      </button>
      {error && <p className="text-red-600 mt-4">{error}</p>}
      {data && (
        <div className="mt-4">
          <h2 className="font-semibold mb-2">Retrieved chunks (most relevant first)</h2>
          <ul className="space-y-1 mb-4 text-sm">
            {data.retrieved.map((r, i) => (
              <li key={i}>
                relevance={r.raw_vector_score.toFixed(3)} — <span className="font-mono">{filename(r.source)}</span>
              </li>
            ))}
          </ul>
          <h2 className="font-semibold mb-2">Answer</h2>
          <p className="border rounded p-3 bg-white whitespace-pre-wrap">{data.answer}</p>

          <ResultPanel>
            {isWeak ? (
              <>
                The best match only scored <strong>{topScore?.toFixed(3)}</strong> in relevance
                — fairly weak. Notice the answer above said so rather than confidently making
                something up; that&apos;s the retrieval-confidence check working as intended,
                not a bug.
              </>
            ) : (
              <>
                The top chunk scored <strong>{topScore?.toFixed(3)}</strong> in relevance —
                strong enough that the system trusted it. Every claim in the answer above should
                trace back to one of the numbered chunks listed, not the model&apos;s general
                knowledge. That&apos;s the whole point of RAG: answers grounded in documents you
                can actually check.
              </>
            )}
          </ResultPanel>
        </div>
      )}
    </main>
  );
}
