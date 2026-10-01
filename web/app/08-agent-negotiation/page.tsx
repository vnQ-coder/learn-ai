"use client";
import { useState } from "react";
import { streamEvents } from "@/lib/sse";
import { ConceptPanel, ResultPanel } from "@/components/ConceptPanel";
import { Term } from "@/components/Term";
import { ChatThread, type Bubble } from "@/components/ChatThread";
import { FlowDiagram, type FlowNodeState } from "@/components/FlowDiagram";

const STAGES = ["Round 1", "Round 2", "Round 3", "Round 4+", "Agreement"];
const NODES = [
  { id: "r1", icon: "🧳", label: "Round 1" },
  { id: "r2", icon: "💰", label: "Round 2" },
  { id: "r3", icon: "🧳", label: "Round 3" },
  { id: "r4", icon: "💰", label: "Round 4+" },
  { id: "deal", icon: "🤝", label: "Agreement" },
];

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
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [stage, setStage] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [rounds, setRounds] = useState(0);

  async function run() {
    setLoading(true);
    setStage(0);
    setBubbles([]);
    let roundCount = 0;
    try {
      for await (const event of streamEvents<{ type: string; text?: string; message?: string }>(
        "/api/08/negotiate/stream",
        {}
      )) {
        if (event.type === "step") {
          const text = event.text ?? "";
          const match = text.match(/^Round (\d+):/);
          if (match) {
            roundCount = Math.max(roundCount, parseInt(match[1], 10));
            setStage(Math.min(roundCount - 1, STAGES.length - 2));
          }
          if (text.startsWith("Agreement reached")) {
            setStage(STAGES.length - 1);
            setBubbles((b) => [...b, { id: nextId(), role: "answer", title: "Agreement", body: text }]);
          } else if (text.startsWith("No agreement")) {
            setStage(STAGES.length - 1);
            setBubbles((b) => [...b, { id: nextId(), role: "error", icon: "⚠️", body: text }]);
          } else {
            const isPlanner = text.includes("TripPlanner");
            setBubbles((b) => [
              ...b,
              { id: nextId(), role: isPlanner ? "user" : "step", icon: isPlanner ? "🧳" : "💰", body: text },
            ]);
          }
        } else if (event.type === "error") {
          setBubbles((b) => [...b, { id: nextId(), role: "error", icon: "⚠️", body: event.message }]);
        } else if (event.type === "done") {
          setRounds(roundCount);
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
      <h1 className="text-2xl font-bold mb-2 text-neutral-100">08 — Agents Talking (Agent-to-Agent Negotiation)</h1>
      <p className="text-neutral-400 mb-4">
        Scenario: a trip-planner agent negotiating budget with a separate budget-checker agent over HTTP.
      </p>

      <ConceptPanel
        plain={
          <>
            Two separate little programs negotiate with each other automatically — one proposes
            a price, the other accepts or counters, back and forth, until they agree. No human
            and, importantly, <strong>no AI model</strong> is involved in this particular demo —
            it&apos;s here to show the communication pattern underneath multi-agent systems in
            its simplest form, before module 09 adds real AI decision-making on top.
          </>
        }
        technical={
          <>
            This demonstrates <Term term="agent">agent</Term>-to-agent (A2A) communication over
            plain HTTP: two independent local servers exchange structured JSON messages following
            a fixed <Term term="negotiationProtocol">negotiation protocol</Term> until they
            converge or hit a round limit. Each round below streams the moment it actually
            happens, as two genuinely separate HTTP requests complete.
          </>
        }
      />

      {stage >= 0 && <FlowDiagram nodes={NODES} states={stageStates(stage)} />}

      <button
        onClick={run}
        disabled={loading}
        className="bg-teal-300 text-black glow-mint-sm rounded-full px-5 py-2 disabled:opacity-50 mb-2 font-medium hover:bg-teal-200 transition-colors"
      >
        {loading ? "Negotiating..." : "Run negotiation"}
      </button>

      <ChatThread bubbles={bubbles} />
      {rounds > 0 && !loading && (
        <ResultPanel>
          The two agents took <strong>{rounds}</strong> round(s) to reach agreement, each one a
          real HTTP request/response between two separate local servers. Run it again: it always
          converges the same way here because the rules are fixed — a version built with real AI
          agents instead could reason, push back, or reject entirely.
        </ResultPanel>
      )}
    </main>
  );
}
