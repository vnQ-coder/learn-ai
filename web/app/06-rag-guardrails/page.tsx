"use client";
import { useState } from "react";
import { apiPost } from "@/lib/api";
import { ConceptPanel, ResultPanel } from "@/components/ConceptPanel";
import { Term } from "@/components/Term";

type AskResponse = { top_raw_vector_score: number | null; result: string };

export default function Page() {
  const [question, setQuestion] = useState("What does this curriculum teach?");
  const [data, setData] = useState<AskResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function run(q: string) {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      setData(await apiPost<AskResponse>("/api/06/ask", { question: q }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const refused = data?.result.startsWith("REFUSED");

  return (
    <main className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-2">06 — RAG Evaluation &amp; Guardrails</h1>
      <p className="text-gray-600 mb-4">Scenario: grading the RAG bot&apos;s own answers before trusting them.</p>

      <ConceptPanel
        plain={
          <>
            This is the safety check sitting on top of module 05. Before trusting its own
            answer, the system asks itself: &quot;did I actually find anything relevant enough
            to answer this?&quot; If not, it refuses outright instead of making something up.
            Try the on-topic button, then the unrelated one, and watch the system behave
            completely differently.
          </>
        }
        technical={
          <>
            The retrieval confidence (<Term term="vectorScore">raw vector score</Term>) of the
            best-matching chunk is checked against a fixed threshold{" "}
            <em>before</em> the model is ever asked to generate an answer. Below the threshold,
            the request is refused immediately — no generation call happens at all, which both
            saves cost and structurally prevents a{" "}
            <Term term="hallucination">hallucinated</Term> answer. This kind of pre-generation{" "}
            <Term term="guardrail">guardrail</Term> is standard in production RAG systems,
            because an LLM asked a question it can&apos;t answer from context will often answer
            confidently from its own training data instead — which defeats the entire purpose of
            grounding it in your documents.
          </>
        }
      />

      <input className="w-full border rounded px-3 py-2 mb-2" value={question} onChange={(e) => setQuestion(e.target.value)} />
      <div className="flex gap-3 mb-4">
        <button onClick={() => run(question)} disabled={loading} className="bg-black text-white rounded px-4 py-2 disabled:opacity-50">
          {loading ? "Running..." : "Ask on-topic question"}
        </button>
        <button onClick={() => run("what is the best pizza topping for a party?")} disabled={loading} className="bg-black text-white rounded px-4 py-2 disabled:opacity-50">
          {loading ? "Running..." : "Ask something unrelated (should refuse)"}
        </button>
      </div>
      {error && <p className="text-red-600 mt-4">{error}</p>}
      {data && (
        <div className="mt-4">
          {data.top_raw_vector_score !== null && (
            <p className="text-sm text-gray-600 mb-2">
              relevance score={data.top_raw_vector_score.toFixed(3)}
            </p>
          )}
          <p className="border rounded p-3 bg-white whitespace-pre-wrap">{data.result}</p>

          <ResultPanel>
            {refused ? (
              <>
                The relevance score was too low, so the system refused before ever generating an
                answer. This is the guardrail working correctly — a weaker system would have
                tried to answer anyway, confidently, from the model&apos;s general knowledge
                instead of your documents.
              </>
            ) : (
              <>
                The relevance score cleared the safety threshold, so the system went ahead and
                generated a grounded answer. If you haven&apos;t already, click the unrelated
                question button above to see the exact opposite outcome on the same system.
              </>
            )}
          </ResultPanel>
        </div>
      )}
    </main>
  );
}
