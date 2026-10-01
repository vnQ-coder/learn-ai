"use client";
import { useState } from "react";
import { apiPost } from "@/lib/api";
import { ConceptPanel, ResultPanel } from "@/components/ConceptPanel";
import { Term } from "@/components/Term";
import { ChatThread, type Bubble } from "@/components/ChatThread";

type SearchResult = { text: string; score: number; match: boolean };
type SearchResponse = { results: SearchResult[] };

let seq = 0;
const nextId = () => `b${seq++}`;

export default function Page() {
  const [query, setQuery] = useState("I was billed two times");
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [loading, setLoading] = useState(false);
  const [resultNote, setResultNote] = useState<React.ReactNode | null>(null);

  async function run() {
    setLoading(true);
    setResultNote(null);
    setBubbles([{ id: nextId(), role: "user", body: query }]);
    try {
      const data = await apiPost<SearchResponse>("/api/01/search", { query });
      const top = data.results[0];
      setBubbles((b) => [
        ...b,
        {
          id: nextId(),
          role: "answer",
          title: "TF-IDF results",
          body: (
            <ul className="space-y-1">
              {data.results.map((r, i) => (
                <li key={i} className="text-sm">
                  <span className={r.match ? "text-teal-300 font-semibold" : "text-red-400 font-semibold"}>
                    {r.match ? "MATCH" : "MISS"}
                  </span>{" "}
                  — score={r.score.toFixed(3)} — {r.text}
                </li>
              ))}
            </ul>
          ),
        },
      ]);
      setResultNote(
        top && top.score < 0.05 ? (
          <>
            The top result scored <strong>{top.score.toFixed(3)}</strong> — essentially zero.
            The search found no shared words between your query and this ticket, so it has no
            basis at all for ranking it higher than any other ticket. Try module 02 with the
            exact same query to see semantic search find the right ticket anyway.
          </>
        ) : (
          <>
            The top result scored <strong>{top?.score.toFixed(3)}</strong>, meaning your query
            shared enough literal words with that ticket for TF-IDF to find it. Try a more
            paraphrased query to see this approach fail instead.
          </>
        )
      );
    } catch (e) {
      setBubbles((b) => [...b, { id: nextId(), role: "error", icon: "⚠️", body: (e as Error).message }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold mb-2 text-neutral-100">01 — Embeddings: Normal (TF-IDF)</h1>
      <p className="text-neutral-400 mb-4">
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

      <div className="flex gap-2 mb-2">
        <input
          className="flex-1 border border-neutral-700 bg-neutral-900 text-neutral-100 placeholder-neutral-500 rounded-full px-4 py-2 focus:outline-none focus:border-teal-300/60"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && run()}
        />
        <button
          onClick={run}
          disabled={loading}
          className="bg-teal-300 text-black font-medium glow-mint-sm rounded-full px-5 py-2 disabled:opacity-50 hover:bg-teal-200 transition-colors"
        >
          {loading ? "…" : "Search"}
        </button>
      </div>

      <ChatThread bubbles={bubbles} />
      {resultNote && <ResultPanel>{resultNote}</ResultPanel>}
    </main>
  );
}
