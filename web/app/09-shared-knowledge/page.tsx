"use client";
import { useState } from "react";
import { apiPost } from "@/lib/api";
import { ConceptPanel, ResultPanel } from "@/components/ConceptPanel";
import { Term } from "@/components/Term";

type Stage = { agent: string; key: string; value: string };
type RunResponse = { stages: Stage[]; final_report: string | null };

const AGENT_LABELS: Record<string, string> = {
  researcher: "🔎 Researcher",
  fact_checker: "✅ Fact-checker",
  writer: "✍️ Writer",
};

export default function Page() {
  const [topic, setTopic] = useState("why hybrid search outperforms pure keyword search");
  const [data, setData] = useState<RunResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      setData(await apiPost<RunResponse>("/api/09/run", { topic }));
    } catch (e) {
      setError((e as Error).message);
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
            fact-checker who reviews them, and a writer who turns them into a final report. Each
            one only sees what the previous one left behind, like passing a folder down a desk,
            not by talking to each other directly.
          </>
        }
        technical={
          <>
            This implements the <Term term="blackboard">blackboard pattern</Term> for{" "}
            <Term term="multiAgent">multi-agent</Term> collaboration: a shared data store (the
            &quot;blackboard&quot;) that each agent reads from and writes to in sequence. The
            researcher writes raw findings; the fact-checker reads those findings and writes a
            verdict; the writer reads both and produces the final report. No agent calls another
            agent directly — they only ever interact through the shared store, which is what
            makes this pattern easy to extend (add a fourth agent without touching the others)
            compared to wiring every agent directly to every other agent.
          </>
        }
      />

      <input className="w-full border rounded px-3 py-2 mb-2" value={topic} onChange={(e) => setTopic(e.target.value)} />
      <button onClick={run} disabled={loading} className="bg-black text-white rounded px-4 py-2 disabled:opacity-50">
        {loading ? "Running..." : "Run pipeline"}
      </button>
      {error && <p className="text-red-600 mt-4">{error}</p>}
      {data && (
        <div className="mt-4 space-y-2">
          {data.stages.map((s, i) => (
            <div key={i} className="border rounded p-3 text-sm">
              <span className="font-semibold">{AGENT_LABELS[s.agent] ?? s.agent} wrote &quot;{s.key}&quot;</span>
              <div className="mt-1 text-gray-700 whitespace-pre-wrap">{s.value}</div>
            </div>
          ))}
          {data.final_report ? (
            <>
              <div className="mt-4">
                <h2 className="font-semibold mb-2">Final report</h2>
                <p className="border rounded p-3 bg-white whitespace-pre-wrap">{data.final_report}</p>
              </div>
              <ResultPanel>
                Notice the writer&apos;s final report above reflects both the researcher&apos;s
                original findings <em>and</em> the fact-checker&apos;s verdict — it had access to
                everything earlier agents left on the shared blackboard, without any of the three
                ever messaging each other directly.
              </ResultPanel>
            </>
          ) : (
            <p className="text-yellow-700 mt-4">The pipeline didn&apos;t produce a final report.</p>
          )}
        </div>
      )}
    </main>
  );
}
