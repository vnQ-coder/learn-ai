"use client";
import { useState } from "react";
import { apiPost } from "@/lib/api";
import { ConceptPanel, ResultPanel } from "@/components/ConceptPanel";
import { Term } from "@/components/Term";

type NegotiateResponse = { transcript: string };

export default function Page() {
  const [transcript, setTranscript] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    setError(null);
    setTranscript(null);
    try {
      const data = await apiPost<NegotiateResponse>("/api/08/negotiate", {});
      setTranscript(data.transcript);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const rounds = transcript?.match(/^Round \d+:/gm)?.length ?? 0;

  return (
    <main className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-2">08 — Agents Talking (Agent-to-Agent Negotiation)</h1>
      <p className="text-gray-600 mb-4">
        Scenario: a trip-planner agent negotiating budget with a separate budget-checker agent over HTTP.
      </p>

      <ConceptPanel
        plain={
          <>
            Two separate little programs negotiate with each other automatically — one proposes
            a price, the other accepts or counters, back and forth, until they agree. No human
            and, importantly, <strong>no AI model</strong> is involved in this particular demo —
            it&apos;s here to show the communication pattern underneath multi-agent systems in
            its simplest, most predictable form, before modules that add real AI decision-making
            on top.
          </>
        }
        technical={
          <>
            This demonstrates <Term term="agent">agent</Term>-to-agent (A2A) communication over
            plain HTTP: two independent local servers exchange structured JSON messages following
            a fixed{" "}
            <Term term="negotiationProtocol">negotiation protocol</Term> (propose → counter-offer
            → revised-propose) until they converge or hit a round limit. Each side&apos;s logic
            here is a simple deterministic rule (always counter at 80% down to a floor) rather
            than an LLM decision — real multi-agent systems often mix exactly this kind of
            protocol-level choreography with LLM-driven agents making the actual decisions at
            each step, which is what module 09 adds.
          </>
        }
      />

      <button onClick={run} disabled={loading} className="bg-black text-white rounded px-4 py-2 disabled:opacity-50">
        {loading ? "Negotiating..." : "Run negotiation"}
      </button>
      {error && <p className="text-red-600 mt-4">{error}</p>}
      {transcript && (
        <>
          <pre className="whitespace-pre-wrap border rounded p-3 bg-white text-sm mt-4">{transcript}</pre>
          <ResultPanel>
            The two agents took <strong>{rounds}</strong> round(s) to reach agreement, each one a
            real HTTP request/response between two separate local servers — not a single program
            just printing both sides. Run it again: the negotiation always converges the same
            way here because the rules are fixed, but a version of this built with real AI
            agents instead of fixed rules could reason, push back, or reject entirely.
          </ResultPanel>
        </>
      )}
    </main>
  );
}
