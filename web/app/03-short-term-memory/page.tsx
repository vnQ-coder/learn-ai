"use client";
import { useState } from "react";
import { streamEvents } from "@/lib/sse";
import { ConceptPanel, ResultPanel } from "@/components/ConceptPanel";
import { Term } from "@/components/Term";
import { ChatThread, type Bubble } from "@/components/ChatThread";
import { PipelineStepper } from "@/components/PipelineStepper";

const STAGES = ["Turn 1", "Turn 2", "Turn 3", "Turn 4", "Turn 5 (the test)"];

let seq = 0;
const nextId = () => `b${seq++}`;

export default function Page() {
  const [bubbles10, setBubbles10] = useState<Bubble[]>([]);
  const [bubbles1, setBubbles1] = useState<Bubble[]>([]);
  const [stage10, setStage10] = useState(-1);
  const [stage1, setStage1] = useState(-1);
  const [loading, setLoading] = useState<"10" | "1" | null>(null);
  const [bothRan, setBothRan] = useState(false);

  async function run(windowSize: number, which: "10" | "1") {
    const setBubbles = which === "10" ? setBubbles10 : setBubbles1;
    const setStage = which === "10" ? setStage10 : setStage1;
    setLoading(which);
    setStage(0);
    setBubbles([]);
    let turn = 0;
    try {
      for await (const event of streamEvents<{ type: string; text?: string; message?: string }>(
        "/api/03/conversation/stream",
        { window_size: windowSize }
      )) {
        if (event.type === "step") {
          const text = event.text ?? "";
          if (text.startsWith("User:")) {
            setBubbles((b) => [...b, { id: nextId(), role: "user", body: text.replace(/^User:\s*/, "") }]);
          } else if (text.startsWith("Model:")) {
            turn += 1;
            setStage(Math.min(turn, STAGES.length - 1));
            setBubbles((b) => [...b, { id: nextId(), role: "answer", body: text.replace(/^Model:\s*/, "") }]);
          } else if (text.includes("buffer holds")) {
            setBubbles((b) => [...b, { id: nextId(), role: "step", icon: "🧠", body: text.trim() }]);
          }
        } else if (event.type === "error") {
          setBubbles((b) => [...b, { id: nextId(), role: "error", icon: "⚠️", body: event.message }]);
        } else if (event.type === "done") {
          setStage(STAGES.length - 1);
          setBothRan(true);
        }
      }
    } catch (e) {
      setBubbles((b) => [...b, { id: nextId(), role: "error", icon: "⚠️", body: (e as Error).message }]);
    } finally {
      setLoading(null);
    }
  }

  return (
    <main className="max-w-3xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-2">03 — Short-Term Memory (Sliding Window)</h1>
      <p className="text-gray-600 mb-4">
        Scenario: a support chatbot booking a flight, where an early detail must survive to the last turn.
      </p>

      <ConceptPanel
        plain={
          <>
            AI chatbots don&apos;t remember a conversation the way a person does — they only see
            a limited window of recent messages on every reply. Tell it &quot;business
            class&quot; early on, then ask it to recall that detail later. Watch both
            conversations play out live, turn by turn, side by side.
          </>
        }
        technical={
          <>
            This implements a sliding-window <Term term="shortTermMemory">context buffer</Term>:
            each call to the model includes only the last N turns of conversation; everything
            older is dropped from the prompt entirely before the request is even sent. The
            model has no hidden memory of dropped turns — if it&apos;s not in the window, it
            never existed as far as that API call is concerned.
          </>
        }
      />

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <button
            onClick={() => run(10, "10")}
            disabled={loading !== null}
            className="bg-black text-white rounded-full px-4 py-2 disabled:opacity-50 mb-3 w-full text-sm"
          >
            {loading === "10" ? "Running..." : "Run with window_size=10 (remembers)"}
          </button>
          {stage10 >= 0 && <PipelineStepper stages={STAGES} activeIndex={stage10} />}
          <ChatThread bubbles={bubbles10} />
        </div>
        <div>
          <button
            onClick={() => run(1, "1")}
            disabled={loading !== null}
            className="bg-black text-white rounded-full px-4 py-2 disabled:opacity-50 mb-3 w-full text-sm"
          >
            {loading === "1" ? "Running..." : "Run with window_size=1 (forgets)"}
          </button>
          {stage1 >= 0 && <PipelineStepper stages={STAGES} activeIndex={stage1} />}
          <ChatThread bubbles={bubbles1} />
        </div>
      </div>

      {bothRan && bubbles10.length > 0 && bubbles1.length > 0 && (
        <ResultPanel>
          Compare the last answer in each column. With a window of 10 turns, the assistant
          still had &quot;business class&quot; in view and should recall it correctly. With a
          window of just 1 turn, that detail was pushed out several messages ago — the assistant
          should either admit it doesn&apos;t know or guess wrong. Same model, same conversation,
          only the <Term term="shortTermMemory">memory window</Term> changed.
        </ResultPanel>
      )}
    </main>
  );
}
