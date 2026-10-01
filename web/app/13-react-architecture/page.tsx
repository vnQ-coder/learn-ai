"use client";
import { useState } from "react";
import { streamEvents } from "@/lib/sse";
import { ConceptPanel, ResultPanel } from "@/components/ConceptPanel";
import { ChatThread, type Bubble } from "@/components/ChatThread";
import { FlowDiagram, type FlowNodeState } from "@/components/FlowDiagram";
import { TypewriterText } from "@/components/TypewriterText";
import { Brain, Zap, Eye, MessageCircle } from "lucide-react";

const NODES = [
  { id: "thought", icon: Brain, label: "Thought" },
  { id: "action", icon: Zap, label: "Action" },
  { id: "observation", icon: Eye, label: "Observation" },
  { id: "answer", icon: MessageCircle, label: "Answer" },
];

function statesForKind(kind: string | null, done: boolean): FlowNodeState[] {
  if (done) return ["done", "done", "done", "done"];
  if (kind === "thought") return ["active", "pending", "pending", "pending"];
  if (kind === "action") return ["done", "active", "pending", "pending"];
  if (kind === "observation") return ["done", "done", "active", "pending"];
  if (kind === "final") return ["done", "done", "done", "active"];
  return ["pending", "pending", "pending", "pending"];
}

let seq = 0;
const nextId = () => `b${seq++}`;

export default function Page() {
  const [question, setQuestion] = useState(
    "A server costs $0.02 per request. We get 45000 requests a day. How much do we spend in a 31-day month, and is that above a $30,000 monthly budget?"
  );
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [started, setStarted] = useState(false);
  const [currentKind, setCurrentKind] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resultNote, setResultNote] = useState<React.ReactNode | null>(null);

  async function run() {
    setLoading(true);
    setStarted(true);
    setDone(false);
    setCurrentKind(null);
    setResultNote(null);
    setBubbles([{ id: nextId(), role: "user", body: question }]);
    try {
      for await (const event of streamEvents<{
        type: string;
        kind?: string;
        text?: string;
        tool?: string;
        input?: string;
        final_answer?: string;
        message?: string;
      }>("/api/13/ask/stream", { question })) {
        if (event.type === "step") {
          setCurrentKind(event.kind ?? null);
          if (event.kind === "thought") {
            setBubbles((b) => [...b, { id: nextId(), role: "step", icon: "🧠", body: event.text }]);
          } else if (event.kind === "action") {
            setBubbles((b) => [
              ...b,
              { id: nextId(), role: "step", icon: "⚡", body: `calculator[${event.input}]` },
            ]);
          } else if (event.kind === "observation") {
            setBubbles((b) => [...b, { id: nextId(), role: "step", icon: "👁️", body: event.text }]);
          } else if (event.kind === "final") {
            setBubbles((b) => [
              ...b,
              { id: nextId(), role: "answer", title: "Answer", body: <TypewriterText text={event.text ?? ""} /> },
            ]);
          }
        } else if (event.type === "error") {
          setBubbles((b) => [...b, { id: nextId(), role: "error", icon: "⚠️", body: event.message }]);
        } else if (event.type === "done") {
          setDone(true);
          setResultNote(
            <>
              The math in the final answer above traces back to the real{" "}
              <code>calculator</code> observation it produced along the way — not a guess. Every
              step the agent took is visible above, in the order it actually reasoned through
              them.
            </>
          );
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
      <h1 className="text-2xl font-bold mb-2 text-neutral-100">13 — ReAct Architecture (Reasoning + Acting)</h1>
      <p className="text-neutral-400 mb-4">
        Scenario: an agent solving a multi-step math question by thinking, acting, and checking its own work.
      </p>

      <ConceptPanel
        plain={
          <>
            This agent thinks out loud, decides to use a calculator when it needs real math
            instead of guessing, checks the result, and keeps going until it&apos;s confident.
            Watch the thinking happen step by step below, instead of getting a single black-box
            answer.
          </>
        }
        technical={
          <>
            This is the <em>ReAct</em> pattern: interleaved Thought / Action / Observation steps
            let the model ground its reasoning in real tool results rather than hallucinating a
            computation. Each loop, the model either calls the calculator tool and reads back a
            real observation, or decides it has enough information and gives a final answer. This
            is the opposite of <em>Plan-and-Execute</em> (module 14), which commits to a full plan
            upfront instead of reacting one step at a time.
          </>
        }
      />

      {started && <FlowDiagram nodes={NODES} states={statesForKind(currentKind, done)} />}

      <div className="flex gap-2 mb-2">
        <input
          className="flex-1 border border-neutral-700 bg-neutral-900 text-neutral-100 placeholder-neutral-500 rounded-full px-4 py-2 focus:outline-none focus:border-teal-300/60"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && run()}
        />
        <button
          onClick={run}
          disabled={loading}
          className="bg-teal-300 text-black glow-mint-sm rounded-full px-5 py-2 disabled:opacity-50 font-medium hover:bg-teal-200 transition-colors"
        >
          {loading ? "…" : "Ask"}
        </button>
      </div>

      <ChatThread bubbles={bubbles} />
      {resultNote && <ResultPanel>{resultNote}</ResultPanel>}
    </main>
  );
}
