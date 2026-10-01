"use client";
import { useState } from "react";
import { streamEvents } from "@/lib/sse";
import { ConceptPanel, ResultPanel } from "@/components/ConceptPanel";
import { Term } from "@/components/Term";
import { ChatThread, type Bubble } from "@/components/ChatThread";
import { FlowDiagram, type FlowNodeState } from "@/components/FlowDiagram";
import { MessageCircle } from "lucide-react";

const STAGES = ["Turn 1", "Turn 2", "Turn 3", "Turn 4", "Turn 5 (the test)"];
const NODES = STAGES.map((label, i) => ({ id: `t${i}`, icon: MessageCircle, label }));

function stageStates(stage: number): FlowNodeState[] {
  return STAGES.map((_, i) => {
    if (stage < 0) return "pending";
    if (i < stage) return "done";
    if (i === stage) return "active";
    return "pending";
  });
}

let seq = 0;
const nextId = () => `b${seq++}`;

export default function Page() {
  const [bubbles10, setBubbles10] = useState<Bubble[]>([]);
  const [bubbles1, setBubbles1] = useState<Bubble[]>([]);
  const [stage10, setStage10] = useState(-1);
  const [stage1, setStage1] = useState(-1);
  const [loading, setLoading] = useState<"10" | "1" | "both" | null>(null);
  const [bothRan, setBothRan] = useState(false);

  async function runBoth() {
    setLoading("both");
    await Promise.all([run(10, "10", false), run(1, "1", false)]);
    setLoading(null);
  }

  async function run(windowSize: number, which: "10" | "1", manageLoading = true) {
    const setBubbles = which === "10" ? setBubbles10 : setBubbles1;
    const setStage = which === "10" ? setStage10 : setStage1;
    if (manageLoading) setLoading(which);
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
      if (manageLoading) setLoading(null);
    }
  }

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold mb-2 text-neutral-100">03 — Short-Term Memory (Sliding Window)</h1>
      <p className="text-neutral-400 mb-4">
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

      <button
        onClick={runBoth}
        disabled={loading !== null}
        className="bg-teal-300 text-black glow-mint-sm rounded-full px-6 py-2.5 font-medium disabled:opacity-50 mb-6 hover:bg-teal-200 transition-colors"
      >
        {loading === "both" ? "Running both..." : "▶ Run both conversations"}
      </button>

      <div className="grid md:grid-cols-2 gap-6 border-t border-neutral-800 pt-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-teal-300 uppercase tracking-wide">window_size=10 (remembers)</span>
            <button
              onClick={() => run(10, "10")}
              disabled={loading !== null}
              className="text-xs text-neutral-500 underline hover:text-neutral-300 disabled:opacity-50"
            >
              run alone
            </button>
          </div>
          {stage10 >= 0 && <FlowDiagram nodes={NODES} states={stageStates(stage10)} compact />}
          <ChatThread bubbles={bubbles10} />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-red-400 uppercase tracking-wide">window_size=1 (forgets)</span>
            <button
              onClick={() => run(1, "1")}
              disabled={loading !== null}
              className="text-xs text-neutral-500 underline hover:text-neutral-300 disabled:opacity-50"
            >
              run alone
            </button>
          </div>
          {stage1 >= 0 && <FlowDiagram nodes={NODES} states={stageStates(stage1)} compact />}
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
