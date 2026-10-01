"use client";
import { useState } from "react";
import { apiPost } from "@/lib/api";
import { ConceptPanel, ResultPanel } from "@/components/ConceptPanel";
import { Term } from "@/components/Term";
import { FlowDiagram, type FlowNodeState } from "@/components/FlowDiagram";
import { TypewriterText } from "@/components/TypewriterText";
import { HelpCircle, Search, BarChart3 } from "lucide-react";

type ScoredText = { text: string; score: number };
type CompareResponse = { tfidf: ScoredText; semantic: ScoredText; better_match: boolean };

const NODES = [
  { id: "query", icon: HelpCircle, label: "Query" },
  { id: "match", icon: Search, label: "Best match" },
  { id: "score", icon: BarChart3, label: "Score" },
];

function ScoreBar({ score, color }: { score: number; color: string }) {
  const pct = Math.max(0, Math.min(1, score)) * 100;
  return (
    <div className="h-2 rounded-full bg-neutral-800 overflow-hidden my-1">
      <div className={"h-full rounded-full transition-all duration-700 " + color} style={{ width: `${pct}%` }} />
    </div>
  );
}

function Column({
  label,
  accent,
  barColor,
  data,
  winner,
  done,
}: {
  label: string;
  accent: string;
  barColor: string;
  data: ScoredText | null;
  winner: boolean;
  done: boolean;
}) {
  const states: FlowNodeState[] = done ? ["done", "done", "done"] : data ? ["done", "active", "pending"] : ["pending", "pending", "pending"];
  return (
    <div className={"flex-1 min-w-0 rounded-xl border p-3 " + (winner ? "border-teal-300/40 bg-teal-300/5" : "border-neutral-800 bg-neutral-900/30")}>
      <div className="flex items-center gap-2 mb-2">
        <span className={"inline-block w-2 h-2 rounded-full " + accent} />
        <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">{label}</span>
        {winner && <span className="text-xs text-teal-300 font-medium ml-auto">winner</span>}
      </div>
      <FlowDiagram nodes={NODES} states={states} compact />
      {data && (
        <>
          <div className="text-xs text-neutral-500 mb-1">
            score: <strong className="text-neutral-200">{data.score.toFixed(3)}</strong>
          </div>
          <ScoreBar score={data.score} color={barColor} />
          <div className="text-sm text-neutral-300 mt-2">
            <TypewriterText text={data.text} />
          </div>
        </>
      )}
    </div>
  );
}

export default function Page() {
  const [query, setQuery] = useState("I was billed two times");
  const [data, setData] = useState<CompareResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await apiPost<CompareResponse>("/api/02/compare", { query });
      setData(res);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const semanticWins = data ? data.semantic.score > data.tfidf.score : false;
  const tfidfWins = data ? data.tfidf.score > data.semantic.score : false;

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold mb-2 text-neutral-100">02 — Embeddings: Semantic</h1>
      <p className="text-neutral-400 mb-4">Scenario: the same ticket search, run two ways at once — old words vs. new meaning.</p>

      <ConceptPanel
        plain={
          <>
            This is the same support-ticket search from module 01, run twice on the same
            question — once the old way (matching words), once the modern way (matching
            meaning). Watch the two columns below race on a question that uses completely
            different words than the ticket it&apos;s looking for.
          </>
        }
        technical={
          <>
            Both texts are converted into an <Term term="embedding">embedding</Term> — a list of
            numbers produced by a sentence-transformer model (<code>all-MiniLM-L6-v2</code>) that
            captures meaning, not vocabulary. Comparing embeddings with cosine similarity is{" "}
            <Term term="semanticSearch">semantic search</Term>: two phrases with zero words in
            common can still score highly if they mean the same thing.
          </>
        }
      />

      <div className="flex gap-2 mb-6">
        <input
          className="flex-1 border border-neutral-700 bg-neutral-900 text-neutral-100 placeholder-neutral-500 rounded-full px-4 py-2 focus:outline-none focus:border-teal-300/60"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && run()}
        />
        <button
          onClick={run}
          disabled={loading}
          className="bg-teal-300 text-black glow-mint-sm rounded-full px-6 py-2 font-medium disabled:opacity-50 hover:bg-teal-200 transition-colors"
        >
          {loading ? "Comparing..." : "▶ Compare"}
        </button>
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      <div className="grid sm:grid-cols-2 gap-4">
        <Column label="TF-IDF (words)" accent="bg-neutral-500" barColor="bg-neutral-500" data={data?.tfidf ?? null} winner={tfidfWins} done={!!data} />
        <Column label="Semantic (meaning)" accent="bg-teal-300" barColor="bg-teal-300" data={data?.semantic ?? null} winner={semanticWins} done={!!data} />
      </div>

      {data && (
        <ResultPanel>
          {data.better_match ? (
            <>
              TF-IDF scored <strong>{data.tfidf.score.toFixed(3)}</strong>, semantic scored{" "}
              <strong>{data.semantic.score.toFixed(3)}</strong> — a gap of{" "}
              <strong>{(data.semantic.score - data.tfidf.score).toFixed(3)}</strong>. That gap is
              the AI genuinely understanding what you meant, not just which words you used.
            </>
          ) : (
            <>
              This time both approaches landed on similar tickets — your query happened to share
              enough words with the right answer that TF-IDF didn&apos;t need meaning to find it.
              Try a more paraphrased question to see the gap open up.
            </>
          )}
        </ResultPanel>
      )}
    </main>
  );
}
