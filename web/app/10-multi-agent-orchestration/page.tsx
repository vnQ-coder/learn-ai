"use client";
import { useState } from "react";
import { streamEvents } from "@/lib/sse";
import { ConceptPanel, ResultPanel } from "@/components/ConceptPanel";
import { FlowDiagram, type FlowNodeState } from "@/components/FlowDiagram";
import { TypewriterText } from "@/components/TypewriterText";
import { HelpCircle, Users, Wrench, MessageCircle } from "lucide-react";

const NODES = [
  { id: "request", icon: HelpCircle, label: "Request" },
  { id: "supervisor", icon: Users, label: "Supervisor" },
  { id: "specialist", icon: Wrench, label: "Specialist" },
  { id: "reply", icon: MessageCircle, label: "Reply" },
];

const SPECIALIST_LABELS: Record<string, string> = {
  billing: "Billing",
  technical: "Technical",
  account: "Account",
};

function stageStates(stage: number): FlowNodeState[] {
  return NODES.map((_, i) => {
    if (stage < 0) return "pending";
    if (i < stage) return "done";
    if (i === stage) return "active";
    return "pending";
  });
}

export default function Page() {
  const [request, setRequest] = useState("I was charged twice this month, please refund me");
  const [stage, setStage] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [specialist, setSpecialist] = useState<string | null>(null);
  const [reply, setReply] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setStage(0);
    setSpecialist(null);
    setReply(null);
    setErrorMsg(null);
    try {
      for await (const event of streamEvents<{
        type: string;
        label?: string;
        text?: string;
        specialist?: string;
        reply?: string;
        message?: string;
      }>("/api/10/route/stream", { request })) {
        if (event.type === "step" && event.label === "routing") {
          setStage(1);
        } else if (event.type === "step" && event.label === "routed") {
          setStage(2);
          setSpecialist(event.specialist ?? null);
        } else if (event.type === "step" && event.label === "responding") {
          setStage(3);
        } else if (event.type === "done") {
          setStage(NODES.length);
          setSpecialist(event.specialist ?? null);
          setReply(event.reply ?? null);
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
      <h1 className="text-2xl font-bold mb-2 text-neutral-100">10 — Multi-Agent Orchestration (Supervisor Pattern)</h1>
      <p className="text-neutral-400 mb-4">Scenario: a supervisor agent deciding, live, which specialist should handle a support request.</p>

      <ConceptPanel
        plain={
          <>
            Instead of following a fixed order like module 09&apos;s researcher →
            fact-checker → writer pipeline, this demo lets one AI decide in real time which
            specialist should help — billing, technical, or account — based on what the request
            actually says. Change the request and watch the routing decision change with it.
          </>
        }
        technical={
          <>
            This is the supervisor (or router-agent) pattern: an LLM classifies the incoming
            request and hands it off to the appropriate downstream agent, each with its own
            persona and prompt. The supervisor itself does no domain work — it only decides who
            should. This is the foundation most production multi-agent systems build on, where
            the set of possible specialists can grow without the supervisor&apos;s own logic
            changing.
          </>
        }
      />

      {stage >= 0 && <FlowDiagram nodes={NODES} states={stageStates(stage)} />}

      <div className="flex gap-2 mb-3">
        <input
          className="flex-1 border border-neutral-700 bg-neutral-900 text-neutral-100 placeholder-neutral-500 rounded-full px-4 py-2 focus:outline-none focus:border-teal-300/60"
          value={request}
          onChange={(e) => setRequest(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && run()}
        />
        <button
          onClick={run}
          disabled={loading}
          className="bg-teal-300 text-black glow-mint-sm rounded-full px-5 py-2 disabled:opacity-50 font-medium hover:bg-teal-200 transition-colors"
        >
          {loading ? "…" : "Run"}
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        {Object.entries(SPECIALIST_LABELS).map(([key, label]) => {
          const chosen = specialist === key;
          return (
            <span
              key={key}
              className={
                "text-xs font-semibold uppercase tracking-wide rounded-full border px-3 py-1 transition-colors " +
                (chosen ? "border-teal-300/50 bg-teal-300/10 text-teal-200" : "border-neutral-800 text-neutral-500")
              }
            >
              {label}
            </span>
          );
        })}
      </div>

      {errorMsg && <p className="text-red-400 text-sm mb-4">{errorMsg}</p>}

      {reply && (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 px-4 py-3 text-sm text-neutral-100 mb-4">
          <div className="font-semibold text-xs mb-1 uppercase tracking-wide text-teal-300">
            {specialist ? SPECIALIST_LABELS[specialist] : ""} specialist reply
          </div>
          <div className="whitespace-pre-wrap leading-relaxed">
            <TypewriterText text={reply} />
          </div>
        </div>
      )}

      {reply && specialist && (
        <ResultPanel>
          The supervisor read the request and routed it to the <strong>{SPECIALIST_LABELS[specialist]}</strong>{" "}
          specialist — a decision made fresh for this specific request, not hardcoded. Try a
          clearly technical or account-related request to see the routing (and the reply persona)
          change along with it.
        </ResultPanel>
      )}
    </main>
  );
}
