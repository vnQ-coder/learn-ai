"use client";
import { useState } from "react";
import { streamEvents } from "@/lib/sse";
import { ConceptPanel, ResultPanel } from "@/components/ConceptPanel";
import { FlowDiagram, type FlowNodeState } from "@/components/FlowDiagram";
import { Scale, MessageSquareText, Gavel, Trophy } from "lucide-react";

const NODES = [
  { id: "candidates", icon: MessageSquareText, label: "Candidates" },
  { id: "judge", icon: Scale, label: "Judge" },
  { id: "verdict", icon: Gavel, label: "Verdict" },
  { id: "winner", icon: Trophy, label: "Winner" },
];

function stageStates(stage: number): FlowNodeState[] {
  return NODES.map((_, i) => {
    if (stage < 0) return "pending";
    if (i < stage) return "done";
    if (i === stage) return "active";
    return "pending";
  });
}

type Scores = { helpfulness: number; accuracy: number; clarity: number };

type DoneEvent = {
  question: string;
  candidate_a: string;
  candidate_b: string;
  score_a: Scores;
  score_b: Scores;
  winner: string;
  reasoning: string;
};

function ScoreRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-20 text-neutral-500">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-neutral-800 overflow-hidden">
        <div className="h-full rounded-full bg-teal-300" style={{ width: `${(value / 10) * 100}%` }} />
      </div>
      <span className="w-6 text-right text-neutral-300 font-mono">{value}</span>
    </div>
  );
}

export default function Page() {
  const [stage, setStage] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DoneEvent | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setStage(0);
    setResult(null);
    setErrorMsg(null);
    try {
      for await (const event of streamEvents<
        { type: string; label?: string; text?: string; message?: string } & Partial<DoneEvent>
      >("/api/28/judge/stream", {})) {
        if (event.type === "step" && event.label === "judging") {
          setStage(1);
        } else if (event.type === "done") {
          setStage(NODES.length);
          setResult({
            question: event.question ?? "",
            candidate_a: event.candidate_a ?? "",
            candidate_b: event.candidate_b ?? "",
            score_a: event.score_a ?? { helpfulness: 0, accuracy: 0, clarity: 0 },
            score_b: event.score_b ?? { helpfulness: 0, accuracy: 0, clarity: 0 },
            winner: event.winner ?? "",
            reasoning: event.reasoning ?? "",
          });
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
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold mb-2 text-neutral-100">28 — LLM-as-Judge</h1>
      <p className="text-neutral-400 mb-4">Scenario: two candidate support replies, scored and picked apart by an AI judge.</p>

      <ConceptPanel
        plain={
          <>
            Some things are hard to check automatically with simple rules — like whether an answer
            is actually <em>helpful</em>, not just factually present. This is where you use one AI
            to grade another AI&apos;s work: show it both answers, ask it to score and pick a
            winner, just like a human reviewer would, but able to do it instantly and at any scale.
          </>
        }
        technical={
          <>
            The LLM-as-judge pattern is increasingly used in production to evaluate subjective
            qualities (helpfulness, tone, coherence) that simple automated checks — like module
            27&apos;s keyword matching — can&apos;t capture. The real caveat: judge models have
            known biases (e.g. favoring longer answers, or whichever one is presented first), so
            production systems often randomize candidate order and average multiple judge calls to
            reduce bias. This simple demo always presents the same two candidates in the same
            order, so take the verdict as illustrative, not bias-free.
          </>
        }
      />

      {stage >= 0 && <FlowDiagram nodes={NODES} states={stageStates(stage)} />}

      <button
        onClick={run}
        disabled={loading}
        className="bg-teal-300 text-black glow-mint-sm rounded-full px-5 py-2 disabled:opacity-50 font-medium hover:bg-teal-200 transition-colors mb-4"
      >
        {loading ? "Judging..." : "▶ Run judge"}
      </button>

      {errorMsg && <p className="text-red-400 text-sm mb-4">{errorMsg}</p>}

      <div className="rounded-xl border border-neutral-800 panel p-4 mb-4 text-sm text-neutral-300">
        <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Question</span>
        <div className="mt-1">
          A customer asks: &quot;My order arrived three days late and the box was damaged. What should I do?&quot;
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <div
          className={
            "rounded-xl border p-4 transition-all " +
            (result?.winner === "A" ? "border-teal-300/50 glow-mint-sm" : "border-neutral-800 panel")
          }
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Candidate A</span>
            {result?.winner === "A" && (
              <span className="text-[10px] text-teal-300 bg-teal-300/10 border border-teal-300/30 rounded-full px-2 py-0.5">
                winner
              </span>
            )}
          </div>
          <div className="text-sm text-neutral-200 mb-3">
            I&apos;m really sorry about this — a late, damaged order is frustrating and that&apos;s on us to
            fix. Here&apos;s what I&apos;ll do: if you can share your order number, I&apos;ll check the shipment
            right away and get you either a free replacement or a full refund, whichever you&apos;d
            prefer. You don&apos;t need to send the damaged item back unless we ask for it. I&apos;ll also
            flag the carrier delay so we can look into why it ran late.
          </div>
          {result && (
            <div className="space-y-1.5">
              <ScoreRow label="Helpfulness" value={result.score_a.helpfulness} />
              <ScoreRow label="Accuracy" value={result.score_a.accuracy} />
              <ScoreRow label="Clarity" value={result.score_a.clarity} />
            </div>
          )}
        </div>

        <div
          className={
            "rounded-xl border p-4 transition-all " +
            (result?.winner === "B" ? "border-teal-300/50 glow-mint-sm" : "border-neutral-800 panel")
          }
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Candidate B</span>
            {result?.winner === "B" && (
              <span className="text-[10px] text-teal-300 bg-teal-300/10 border border-teal-300/30 rounded-full px-2 py-0.5">
                winner
              </span>
            )}
          </div>
          <div className="text-sm text-neutral-200 mb-3">
            Thank you for reaching out to us. We understand that issues can sometimes occur with
            shipping and we apologize for any inconvenience this may have caused you. Please know
            that customer satisfaction is very important to us. For help with your order, please
            contact our support team and they will be happy to assist you with your concern
            regarding the delivery of your package.
          </div>
          {result && (
            <div className="space-y-1.5">
              <ScoreRow label="Helpfulness" value={result.score_b.helpfulness} />
              <ScoreRow label="Accuracy" value={result.score_b.accuracy} />
              <ScoreRow label="Clarity" value={result.score_b.clarity} />
            </div>
          )}
        </div>
      </div>

      {result && (
        <div className="rounded-xl border border-neutral-800 panel p-4 mb-4">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">Judge&apos;s reasoning</div>
          <div className="text-sm text-neutral-200">{result.reasoning}</div>
        </div>
      )}

      {result && (
        <ResultPanel>
          The judge picked <strong className="text-teal-300">Candidate {result.winner}</strong> —
          notice this verdict came from scoring subjective qualities (helpfulness, clarity), not
          from checking for specific keywords like module 27 does. Remember the bias caveat above:
          a single judge call with a fixed candidate order is a simplification of how production
          LLM-as-judge pipelines actually work.
        </ResultPanel>
      )}
    </main>
  );
}
