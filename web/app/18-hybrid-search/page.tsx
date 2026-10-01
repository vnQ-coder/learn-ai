"use client";
import { useState } from "react";
import { apiPost } from "@/lib/api";
import { ConceptPanel, ResultPanel } from "@/components/ConceptPanel";

type ScoredText = { text: string; score: number };
type CompareResponse = { bm25: ScoredText[]; vector: ScoredText[]; hybrid: ScoredText[] };

function ScoreBar({ score, max, color }: { score: number; max: number; color: string }) {
  const pct = max > 0 ? Math.max(0, Math.min(1, score / max)) * 100 : 0;
  return (
    <div className="h-1.5 rounded-full bg-neutral-800 overflow-hidden my-1">
      <div className={"h-full rounded-full transition-all duration-700 " + color} style={{ width: `${pct}%` }} />
    </div>
  );
}

function Column({ label, accent, barColor, results }: { label: string; accent: string; barColor: string; results: ScoredText[] | null }) {
  const max = results && results.length > 0 ? results[0].score : 0;
  return (
    <div className="flex-1 min-w-0 rounded-xl border border-neutral-800 bg-neutral-900/30 p-3">
      <div className="flex items-center gap-2 mb-3">
        <span className={"inline-block w-2 h-2 rounded-full " + accent} />
        <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">{label}</span>
      </div>
      {results && results.length > 0 ? (
        <div className="space-y-2">
          {results.map((r, i) => (
            <div
              key={i}
              className={
                "rounded-lg border px-2.5 py-2 " +
                (i === 0 ? "border-teal-300/40 bg-teal-300/5" : "border-neutral-800")
              }
            >
              <div className="flex items-center justify-between mb-1">
                {i === 0 && <span className="text-[10px] text-teal-300 font-semibold uppercase tracking-wide">top match</span>}
                <span className="text-[10px] text-neutral-500 ml-auto font-mono">{r.score.toFixed(3)}</span>
              </div>
              <ScoreBar score={r.score} max={max} color={barColor} />
              <div className="text-xs text-neutral-300 leading-snug mt-1">{r.text}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-xs text-neutral-600">Run a query to see results.</div>
      )}
    </div>
  );
}

export default function Page() {
  const [query, setQuery] = useState("how do I stop my membership from renewing automatically");
  const [data, setData] = useState<CompareResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await apiPost<CompareResponse>("/api/18/compare", { query });
      setData(res);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const bm25Top = data?.bm25[0]?.text;
  const vectorTop = data?.vector[0]?.text;
  const hybridTop = data?.hybrid[0]?.text;
  const allAgree = bm25Top && vectorTop && hybridTop && bm25Top === vectorTop && vectorTop === hybridTop;

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold mb-2 text-neutral-100">18 — Hybrid Search Explained</h1>
      <p className="text-neutral-400 mb-4">Scenario: the same query, ranked three ways — keyword, meaning, and both combined.</p>

      <ConceptPanel
        plain={
          <>
            Keyword search is great at exact terms but misses paraphrases. Meaning-based search is
            great at paraphrases, but it can sometimes drift toward a plausible-sounding answer
            that isn&apos;t actually the best one. Hybrid search runs both and blends the scores,
            so you get the precision of keywords and the flexibility of meaning at the same time.
            This is the exact technique module 05&apos;s production RAG uses under the hood —
            here it&apos;s pulled apart so you can see each piece on its own.
          </>
        }
        technical={
          <>
            <strong className="text-neutral-200">BM25</strong> ranks documents by keyword
            frequency — it has no concept of meaning. <strong className="text-neutral-200">Vector
            search</strong> ranks by cosine similarity between sentence embeddings — it understands
            paraphrases but can occasionally rank a loosely-related doc too highly. Hybrid search
            min-max normalizes both score arrays to 0–1, then combines them as{" "}
            <code>0.5 × norm(vector) + 0.5 × norm(bm25)</code> — the same formula module 05 uses,
            isolated here for inspection.
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

      <div className="grid sm:grid-cols-3 gap-4">
        <Column label="BM25 (keyword)" accent="bg-neutral-500" barColor="bg-neutral-500" results={data?.bm25 ?? null} />
        <Column label="Vector (meaning)" accent="bg-sky-400" barColor="bg-sky-400" results={data?.vector ?? null} />
        <Column label="Hybrid (combined)" accent="bg-teal-300" barColor="bg-teal-300" results={data?.hybrid ?? null} />
      </div>

      {data && (
        <ResultPanel>
          {allAgree ? (
            <>
              All three methods agreed on <strong>&quot;{hybridTop}&quot;</strong> as the top
              result — your query shared enough exact words with it that keyword search alone
              already found it.
            </>
          ) : (
            <>
              BM25 picked <strong>&quot;{bm25Top}&quot;</strong>, vector search picked{" "}
              <strong>&quot;{vectorTop}&quot;</strong>, and hybrid landed on{" "}
              <strong>&quot;{hybridTop}&quot;</strong>. When meaning-based search drifts toward a
              plausible but not-quite-right answer, keyword overlap in the hybrid score pulls the
              ranking back — exactly the failure mode production RAG systems use hybrid search to
              guard against.
            </>
          )}
        </ResultPanel>
      )}
    </main>
  );
}
