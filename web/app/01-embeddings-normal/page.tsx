"use client";
import { useState } from "react";
import { apiPost } from "@/lib/api";
import { ConceptPanel, ResultPanel } from "@/components/ConceptPanel";
import { Term } from "@/components/Term";

type SearchResult = { text: string; score: number; match: boolean };
type SearchResponse = { results: SearchResult[] };

export default function Page() {
  const [query, setQuery] = useState("I was billed two times");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const data = await apiPost<SearchResponse>("/api/01/search", { query });
      setResults(data.results);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const top = results?.[0];

  return (
    <main className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-2">01 — Embeddings: Normal (TF-IDF)</h1>
      <p className="text-gray-600 mb-4">
        Scenario: a support-ticket search box that only matches literal keywords.
      </p>

      <ConceptPanel
        plain={
          <>
            This is how most search boxes worked before AI understood meaning: they only match
            the <em>exact words</em> you typed. Type a question using different words than the
            ticket actually uses, and the search comes up empty — even though a human would
            instantly see the connection.
          </>
        }
        technical={
          <>
            This uses <Term term="tfidf">TF-IDF</Term> (Term Frequency–Inverse Document
            Frequency) to turn each ticket and your query into a vector based purely on word
            overlap, then ranks results by cosine similarity. There is no concept of meaning
            here — a query that shares zero words with a ticket scores at or near 0, regardless
            of how topically related the two actually are. This is the baseline module 02 is
            built to improve on.
          </>
        }
      />

      <input
        className="w-full border rounded px-3 py-2 mb-2"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button onClick={run} disabled={loading} className="bg-black text-white rounded px-4 py-2 disabled:opacity-50">
        {loading ? "Running..." : "Run TF-IDF search"}
      </button>
      {error && <p className="text-red-600 mt-4">{error}</p>}
      {results && (
        <>
          <ul className="mt-4 space-y-2">
            {results.map((r, i) => (
              <li key={i} className="border rounded p-3">
                <span className={r.match ? "text-green-700 font-semibold" : "text-red-600 font-semibold"}>
                  {r.match ? "MATCH" : "MISS"}
                </span>{" "}
                — <Term term="vectorScore">score</Term>={r.score.toFixed(3)}
                <div className="text-sm text-gray-700">{r.text}</div>
              </li>
            ))}
          </ul>
          <ResultPanel>
            {top && top.score < 0.05 ? (
              <>
                The top result scored <strong>{top.score.toFixed(3)}</strong> — essentially
                zero. The search found no shared words between your query and this ticket, so
                it has no basis at all for ranking it higher than any other ticket. Try module
                02 with the exact same query to see semantic search find the right ticket
                anyway.
              </>
            ) : (
              <>
                The top result scored <strong>{top?.score.toFixed(3)}</strong>, meaning your
                query shared enough literal words with that ticket for TF-IDF to find it. Try a
                more paraphrased query (different words, same meaning) to see this approach
                fail instead.
              </>
            )}
          </ResultPanel>
        </>
      )}
    </main>
  );
}
