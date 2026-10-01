"use client";
import { useState } from "react";
import { streamEvents } from "@/lib/sse";
import { ConceptPanel, ResultPanel } from "@/components/ConceptPanel";
import { FlowDiagram, type FlowNodeState } from "@/components/FlowDiagram";
import { TypewriterText } from "@/components/TypewriterText";
import { Mail, FileText, Tags, CheckCircle2 } from "lucide-react";

const NODES = [
  { id: "email", icon: Mail, label: "Email" },
  { id: "summarize", icon: FileText, label: "Summarize" },
  { id: "classify", icon: Tags, label: "Classify" },
  { id: "result", icon: CheckCircle2, label: "Result" },
];

function stageStates(stage: number): FlowNodeState[] {
  return NODES.map((_, i) => {
    if (stage < 0) return "pending";
    if (i < stage) return "done";
    if (i === stage) return "active";
    return "pending";
  });
}

type DoneEvent = { summary: string; category: string; priority: string; sentiment: string };

export default function Page() {
  const [email, setEmail] = useState(
    "Hi, this is the third time I'm writing. My card was charged twice for the same order and nobody has refunded me. This is extremely frustrating and I need this fixed today."
  );
  const [stage, setStage] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [result, setResult] = useState<DoneEvent | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setStage(0);
    setSummary(null);
    setResult(null);
    setErrorMsg(null);
    try {
      for await (const event of streamEvents<{
        type: string;
        label?: string;
        text?: string;
        summary?: string;
        category?: string;
        priority?: string;
        sentiment?: string;
        message?: string;
      }>("/api/15/triage/stream", { email })) {
        if (event.type === "step" && event.label === "summarizing") {
          setStage(1);
        } else if (event.type === "step" && event.label === "summarized") {
          setSummary(event.text ?? "");
        } else if (event.type === "step" && event.label === "classifying") {
          setStage(2);
        } else if (event.type === "done") {
          setStage(NODES.length);
          setResult({
            summary: event.summary ?? "",
            category: event.category ?? "",
            priority: event.priority ?? "",
            sentiment: event.sentiment ?? "",
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
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold mb-2 text-neutral-100">15 — LangChain Pipeline (LCEL)</h1>
      <p className="text-neutral-400 mb-4">Scenario: triaging a raw customer email through two composed LangChain chains.</p>

      <ConceptPanel
        plain={
          <>
            Every other module in this curriculum hand-rolls its API calls so you can see the raw
            mechanism. This one is different: it uses the real{" "}
            <strong className="text-neutral-200">LangChain</strong> library — a popular framework
            for building AI pipelines out of reusable, composable pieces. Watch one email flow
            through two chained steps: first it gets summarized, then that summary gets classified
            into structured fields.
          </>
        }
        technical={
          <>
            This is LangChain&apos;s <strong className="text-neutral-200">LCEL</strong> (LangChain
            Expression Language) composition pattern: <code>prompt | llm | parser</code>. Chain 1
            pipes a prompt template into the model into a plain string parser. Chain 2 pipes a
            second prompt into <code>llm.with_structured_output(Classification)</code>, which
            forces the model&apos;s response to conform to a Pydantic schema — no manual JSON
            parsing required, unlike the hand-rolled structured-output modules elsewhere in this
            curriculum.
          </>
        }
      />

      {stage >= 0 && <FlowDiagram nodes={NODES} states={stageStates(stage)} />}

      <textarea
        className="w-full border border-neutral-700 bg-neutral-900 text-neutral-100 placeholder-neutral-500 rounded-xl px-4 py-3 mb-2 min-h-[100px] focus:outline-none focus:border-teal-300/60"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button
        onClick={run}
        disabled={loading}
        className="bg-teal-300 text-black glow-mint-sm rounded-full px-5 py-2 disabled:opacity-50 font-medium hover:bg-teal-200 transition-colors mb-4"
      >
        {loading ? "Running chains..." : "▶ Run pipeline"}
      </button>

      {errorMsg && <p className="text-red-400 text-sm mb-4">{errorMsg}</p>}

      {summary && (
        <div className="rounded-xl border border-neutral-800 panel p-4 mb-4">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">Chain 1 output — summary</div>
          <div className="text-sm text-neutral-200">{summary}</div>
        </div>
      )}

      {result && (
        <div className="rounded-xl border border-neutral-800 panel p-4">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">Chain 2 output — structured classification</div>
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[100px]">
              <div className="text-[10px] uppercase tracking-wide text-neutral-500 mb-1">Category</div>
              <div className="text-sm font-semibold text-teal-200 bg-teal-300/10 border border-teal-300/30 rounded-full px-3 py-1 inline-block">
                {result.category}
              </div>
            </div>
            <div className="flex-1 min-w-[100px]">
              <div className="text-[10px] uppercase tracking-wide text-neutral-500 mb-1">Priority</div>
              <div className="text-sm font-semibold text-teal-200 bg-teal-300/10 border border-teal-300/30 rounded-full px-3 py-1 inline-block">
                {result.priority}
              </div>
            </div>
            <div className="flex-1 min-w-[100px]">
              <div className="text-[10px] uppercase tracking-wide text-neutral-500 mb-1">Sentiment</div>
              <div className="text-sm font-semibold text-teal-200 bg-teal-300/10 border border-teal-300/30 rounded-full px-3 py-1 inline-block">
                {result.sentiment}
              </div>
            </div>
          </div>
        </div>
      )}

      {result && (
        <ResultPanel>
          <TypewriterText
            text={`The summary chain condensed the full email down to one sentence, and that summary alone was enough for the classification chain to confidently tag it as ${result.category} / ${result.priority} priority / ${result.sentiment} sentiment — each chain only ever saw the output of the one before it, composed with LangChain's pipe syntax.`}
          />
        </ResultPanel>
      )}
    </main>
  );
}
