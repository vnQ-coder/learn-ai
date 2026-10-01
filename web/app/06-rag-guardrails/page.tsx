"use client";
import { useState } from "react";
import { streamEvents } from "@/lib/sse";
import { ConceptPanel, ResultPanel } from "@/components/ConceptPanel";
import { Term } from "@/components/Term";
import { ChatThread, type Bubble } from "@/components/ChatThread";
import { PipelineStepper } from "@/components/PipelineStepper";

const STAGES = ["Your question", "Searching docs", "Checking confidence", "Answer or refuse"];

let seq = 0;
const nextId = () => `b${seq++}`;

export default function Page() {
  const [question, setQuestion] = useState("What does this curriculum teach?");
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [stage, setStage] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [resultNote, setResultNote] = useState<React.ReactNode | null>(null);

  async function run(q: string) {
    setLoading(true);
    setResultNote(null);
    setStage(0);
    setBubbles([{ id: nextId(), role: "user", body: q }]);
    try {
      for await (const event of streamEvents<{
        type: string;
        label?: string;
        text?: string;
        top_raw_vector_score?: number | null;
        result?: string;
        message?: string;
      }>("/api/06/ask/stream", { question: q })) {
        if (event.type === "step" && event.label === "retrieving") {
          setStage(1);
          setBubbles((b) => [...b, { id: nextId(), role: "step", icon: "🔎", body: event.text }]);
        } else if (event.type === "step" && event.label === "retrieved") {
          setBubbles((b) => [...b, { id: nextId(), role: "step", icon: "📄", body: event.text }]);
        } else if (event.type === "step" && event.label === "checking") {
          setStage(2);
          setBubbles((b) => [...b, { id: nextId(), role: "step", icon: "🛡️", body: event.text }]);
        } else if (event.type === "done") {
          setStage(3);
          const refused = (event.result ?? "").startsWith("REFUSED");
          setBubbles((b) => [
            ...b,
            { id: nextId(), role: refused ? "error" : "answer", title: refused ? "Refused" : "Answer", body: event.result },
          ]);
          setResultNote(
            refused ? (
              <>
                The relevance score was too low, so the system refused before ever generating an
                answer. This is the guardrail working correctly — a weaker system would have
                tried to answer anyway, confidently, from general knowledge instead of your
                documents.
              </>
            ) : (
              <>
                The relevance score cleared the safety threshold, so the system went ahead and
                generated a grounded answer. Try the unrelated question button to see the exact
                opposite outcome on the same system.
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
            best-matching chunk is checked against a fixed threshold <em>before</em> the model is
            ever asked to generate an answer. Below the threshold, the request is refused
            immediately — no generation call happens at all, which both saves cost and
            structurally prevents a <Term term="hallucination">hallucinated</Term> answer. This
            kind of pre-generation <Term term="guardrail">guardrail</Term> is standard in
            production RAG systems.
          </>
        }
      />

      {stage >= 0 && <PipelineStepper stages={STAGES} activeIndex={stage} />}

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
          {loading ? "…" : "Ask on-topic question"}
        </button>
        <button
          onClick={() => run("what is the best pizza topping for a party?")}
          disabled={loading}
          className="bg-gray-700 text-white rounded-full px-4 py-2 disabled:opacity-50 text-sm"
        >
          {loading ? "…" : "Ask something unrelated"}
        </button>
      </div>

      <ChatThread bubbles={bubbles} />
      {resultNote && <ResultPanel>{resultNote}</ResultPanel>}
    </main>
  );
}
