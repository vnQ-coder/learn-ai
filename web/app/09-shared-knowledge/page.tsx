"use client";
import { useState } from "react";
import { streamEvents } from "@/lib/sse";
import { ConceptPanel, ResultPanel } from "@/components/ConceptPanel";
import { Term } from "@/components/Term";
import { ChatThread, type Bubble } from "@/components/ChatThread";
import { PipelineStepper } from "@/components/PipelineStepper";

const STAGES = ["Your topic", "Researcher", "Fact-checker", "Writer", "Final report"];

let seq = 0;
const nextId = () => `b${seq++}`;

export default function Page() {
  const [topic, setTopic] = useState("why hybrid search outperforms pure keyword search");
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [stage, setStage] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [hasFinal, setHasFinal] = useState(false);

  async function run() {
    setLoading(true);
    setHasFinal(false);
    setStage(0);
    setBubbles([{ id: nextId(), role: "user", body: topic }]);
    try {
      for await (const event of streamEvents<{
        type: string;
        label?: string;
        agent?: string;
        text?: string;
        message?: string;
        final_report?: string | null;
      }>("/api/09/run/stream", { topic })) {
        if (event.type === "step" && event.label === "researcher") {
          setStage(1);
          setBubbles((b) => [...b, { id: nextId(), role: "step", icon: "🔎", body: event.text }]);
        } else if (event.type === "step" && event.label === "researcher_done") {
          setBubbles((b) => [...b, { id: nextId(), role: "answer", title: "🔎 Researcher found", body: event.text }]);
        } else if (event.type === "step" && event.label === "fact_checker") {
          setStage(2);
          setBubbles((b) => [...b, { id: nextId(), role: "step", icon: "✅", body: event.text }]);
        } else if (event.type === "step" && event.label === "fact_checker_done") {
          setBubbles((b) => [...b, { id: nextId(), role: "answer", title: "✅ Fact-checker verdict", body: event.text }]);
        } else if (event.type === "step" && event.label === "writer") {
          setStage(3);
          setBubbles((b) => [...b, { id: nextId(), role: "step", icon: "✍️", body: event.text }]);
        } else if (event.type === "done") {
          setStage(4);
          if (event.final_report) {
            setHasFinal(true);
            setBubbles((b) => [...b, { id: nextId(), role: "answer", title: "✍️ Final report", body: event.final_report }]);
          }
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
      <h1 className="text-2xl font-bold mb-2">09 — Agents Sharing Knowledge (Blackboard Pattern)</h1>
      <p className="text-gray-600 mb-4">
        Scenario: a researcher, fact-checker, and writer agent collaborating through a shared knowledge store.
      </p>

      <ConceptPanel
        plain={
          <>
            Instead of one AI doing everything, this splits the work across three AI
            &quot;employees&quot; with different jobs — a researcher who gathers facts, a
            fact-checker who reviews them, and a writer who turns them into a final report. Watch
            each one complete their part live, one after another, in real time.
          </>
        }
        technical={
          <>
            This implements the <Term term="blackboard">blackboard pattern</Term> for{" "}
            <Term term="multiAgent">multi-agent</Term> collaboration: a shared data store that
            each agent reads from and writes to in sequence. No agent calls another agent
            directly — they only ever interact through the shared store. The three stages below
            stream live as each real Gemini call finishes, in the order they actually run.
          </>
        }
      />

      {stage >= 0 && <PipelineStepper stages={STAGES} activeIndex={stage} />}

      <div className="flex gap-2 mb-2">
        <input
          className="flex-1 border rounded-full px-4 py-2"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && run()}
        />
        <button onClick={run} disabled={loading} className="bg-black text-white rounded-full px-5 py-2 disabled:opacity-50">
          {loading ? "…" : "Run"}
        </button>
      </div>

      <ChatThread bubbles={bubbles} />
      {hasFinal && (
        <ResultPanel>
          Notice the writer&apos;s final report reflects both the researcher&apos;s original
          findings <em>and</em> the fact-checker&apos;s verdict above — it had access to
          everything earlier agents left on the shared blackboard, without any of the three ever
          messaging each other directly.
        </ResultPanel>
      )}
    </main>
  );
}
