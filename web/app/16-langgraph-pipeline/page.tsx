"use client";
import { useState } from "react";
import { streamEvents } from "@/lib/sse";
import { ConceptPanel, ResultPanel } from "@/components/ConceptPanel";
import { FlowDiagram, type FlowNodeState } from "@/components/FlowDiagram";
import { TypewriterText } from "@/components/TypewriterText";
import { FileText, Tags, GitBranch, MessageCircle } from "lucide-react";

const NODES = [
  { id: "ticket", icon: FileText, label: "Ticket" },
  { id: "classify", icon: Tags, label: "Classify" },
  { id: "branch", icon: GitBranch, label: "Branch" },
  { id: "response", icon: MessageCircle, label: "Response" },
];

function stageStates(stage: number): FlowNodeState[] {
  return NODES.map((_, i) => {
    if (stage < 0) return "pending";
    if (i < stage) return "done";
    if (i === stage) return "active";
    return "pending";
  });
}

export default function Page() {
  const [ticket, setTicket] = useState("URGENT: production database is down, customers cannot check out!");
  const [stage, setStage] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [urgency, setUrgency] = useState<string | null>(null);
  const [response, setResponse] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setStage(0);
    setUrgency(null);
    setResponse(null);
    setErrorMsg(null);
    try {
      for await (const event of streamEvents<{
        type: string;
        label?: string;
        urgency?: string;
        response?: string;
        message?: string;
      }>("/api/16/triage/stream", { ticket })) {
        if (event.type === "step" && event.label === "classify") {
          setStage(2);
          setUrgency(event.urgency ?? null);
        } else if (event.type === "step" && (event.label === "escalate" || event.label === "auto_reply")) {
          setStage(3);
          setResponse(event.response ?? null);
        } else if (event.type === "done") {
          setStage(NODES.length);
          setUrgency(event.urgency ?? urgency);
          setResponse(event.response ?? response);
        } else if (event.type === "error") {
          setErrorMsg(event.message ?? "Something went wrong");
        }
      }
    } catch (e) {
      setErrorMsg((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold mb-2 text-neutral-100">16 — LangGraph Pipeline (Conditional Routing)</h1>
      <p className="text-neutral-400 mb-4">Scenario: a support-ticket triage graph that branches to escalation or auto-reply.</p>

      <ConceptPanel
        plain={
          <>
            This agent is built as an actual flowchart: a classify step decides how urgent your
            ticket is, and the graph itself branches down one of two paths based on that decision
            — escalate it for a human, or send a friendly auto-reply. Watch which path lights up.
          </>
        }
        technical={
          <>
            This uses the real <strong className="text-neutral-200">LangGraph</strong> library:
            a <code>StateGraph</code> with nodes (<code>classify</code>, <code>escalate</code>,{" "}
            <code>auto_reply</code>) connected by <code>add_conditional_edges()</code>, which
            routes execution to a different node based on a router function&apos;s return value.
            Compare this to module 10&apos;s hand-rolled supervisor (plain Python if/else-style
            routing) — the same branching idea, expressed declaratively as a graph instead.
          </>
        }
      />

      {stage >= 0 && <FlowDiagram nodes={NODES} states={stageStates(stage)} />}

      <textarea
        className="w-full border border-neutral-700 bg-neutral-900 text-neutral-100 placeholder-neutral-500 rounded-xl px-4 py-3 mb-2 min-h-[90px] focus:outline-none focus:border-teal-300/60"
        value={ticket}
        onChange={(e) => setTicket(e.target.value)}
      />
      <button
        onClick={run}
        disabled={loading}
        className="bg-teal-300 text-black glow-mint-sm rounded-full px-5 py-2 disabled:opacity-50 font-medium hover:bg-teal-200 transition-colors mb-4"
      >
        {loading ? "Running graph..." : "▶ Run triage graph"}
      </button>

      {errorMsg && <p className="text-red-400 text-sm mb-4">{errorMsg}</p>}

      {urgency && (
        <div className="flex gap-3 mb-4">
          <div
            className={
              "flex-1 rounded-xl border p-3 text-center text-sm font-semibold transition-colors " +
              (urgency === "urgent" ? "border-teal-300/50 bg-teal-300/10 text-teal-200" : "border-neutral-800 text-neutral-500")
            }
          >
            🚨 escalate
          </div>
          <div
            className={
              "flex-1 rounded-xl border p-3 text-center text-sm font-semibold transition-colors " +
              (urgency === "normal" ? "border-teal-300/50 bg-teal-300/10 text-teal-200" : "border-neutral-800 text-neutral-500")
            }
          >
            💬 auto_reply
          </div>
        </div>
      )}

      {response && (
        <div className="rounded-xl border border-neutral-800 panel p-4">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">
            {urgency === "urgent" ? "Escalation note" : "Auto-reply"}
          </div>
          <div className="text-sm text-neutral-200 whitespace-pre-wrap">
            <TypewriterText text={response} />
          </div>
        </div>
      )}

      {response && (
        <ResultPanel>
          The <code>classify</code> node decided this ticket was{" "}
          <strong className="text-teal-300">{urgency}</strong>, and LangGraph&apos;s conditional
          edge routed execution straight to the <code>{urgency === "urgent" ? "escalate" : "auto_reply"}</code>{" "}
          node — the other node in the graph never ran at all for this ticket.
        </ResultPanel>
      )}
    </main>
  );
}
