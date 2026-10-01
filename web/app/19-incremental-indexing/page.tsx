"use client";
import { useEffect, useState } from "react";
import { apiPost } from "@/lib/api";
import { ConceptPanel, ResultPanel } from "@/components/ConceptPanel";

type Doc = { id: string; text: string };
type StateResponse = { docs: Doc[] };
type QueryResult = { id: string; text: string; distance: number };
type QueryResponse = { results: QueryResult[] };

let seq = 0;
const nextDocId = () => `doc-new-${++seq}`;

export default function Page() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newId, setNewId] = useState(nextDocId());
  const [newText, setNewText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const [question, setQuestion] = useState("how long does shipping take");
  const [results, setResults] = useState<QueryResult[] | null>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    apiPost<StateResponse>("/api/19/reset", {})
      .then((r) => {
        setDocs(r.docs);
        setReady(true);
      })
      .catch((e) => setError((e as Error).message));
  }, []);

  async function runQuery(q: string) {
    try {
      const r = await apiPost<QueryResponse>("/api/19/query", { question: q });
      setResults(r.results);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function afterChange(docsNext: Doc[]) {
    setDocs(docsNext);
    if (question.trim()) await runQuery(question);
  }

  async function handleAdd() {
    if (!newText.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const r = await apiPost<StateResponse>("/api/19/add", { id: newId, text: newText });
      setLastAction(`Added "${newId}" — it's immediately searchable, no reindex of anything else.`);
      setNewId(nextDocId());
      setNewText("");
      await afterChange(r.docs);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveEdit(id: string) {
    setBusy(true);
    setError(null);
    try {
      const r = await apiPost<StateResponse>("/api/19/update", { id, text: editText });
      setLastAction(`Updated "${id}" — only that one document's embedding changed.`);
      setEditingId(null);
      await afterChange(r.docs);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    setBusy(true);
    setError(null);
    try {
      const r = await apiPost<StateResponse>("/api/19/delete", { id });
      setLastAction(`Deleted "${id}" — it can no longer be matched by any query.`);
      await afterChange(r.docs);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleReset() {
    setBusy(true);
    setError(null);
    try {
      const r = await apiPost<StateResponse>("/api/19/reset", {});
      setLastAction("Reset to the 3 starter documents.");
      setResults(null);
      setDocs(r.docs);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleSearch() {
    setBusy(true);
    setError(null);
    try {
      await runQuery(question);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold mb-2 text-neutral-100">
        19 — Live-Updating Documents (Incremental Indexing)
      </h1>
      <p className="text-neutral-400 mb-4">
        Scenario: a knowledge base that keeps changing — documents get added, edited, and deleted
        while the system stays live.
      </p>

      <ConceptPanel
        plain={
          <>
            Every other demo in this curriculum pretends the documents never change. Real
            knowledge bases constantly do — someone edits a policy, writes a new FAQ, deletes an
            old one. This shows what a RAG system actually has to do about that: update just the
            one document that changed, instantly, without touching anything else.
          </>
        }
        technical={
          <>
            This uses a real persistent vector database (Chroma) with <code>add</code>,{" "}
            <code>upsert</code>, and <code>delete</code> operations scoped to a single document
            id. In production, that&apos;s the difference between an expensive nightly full
            re-index batch job and a live system where a document becomes searchable — or
            unsearchable — within seconds of being changed.
          </>
        }
      />

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      <div className="rounded-xl border border-neutral-800 panel p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
            Live index ({docs.length} document{docs.length === 1 ? "" : "s"})
          </div>
          <button
            onClick={handleReset}
            disabled={busy || !ready}
            className="border border-neutral-700 bg-neutral-900 text-neutral-300 rounded-full px-3 py-1 text-xs hover:bg-neutral-800 transition-colors disabled:opacity-50"
          >
            ↻ Reset demo
          </button>
        </div>

        <div className="space-y-2 mb-4">
          {docs.map((d) => (
            <div key={d.id} className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-mono text-neutral-500">{d.id}</span>
                {editingId !== d.id && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingId(d.id);
                        setEditText(d.text);
                      }}
                      disabled={busy}
                      className="text-xs text-teal-200 hover:text-teal-100 transition-colors disabled:opacity-50"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(d.id)}
                      disabled={busy}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                )}
              </div>
              {editingId === d.id ? (
                <div>
                  <textarea
                    className="w-full border border-neutral-700 bg-neutral-950 text-neutral-100 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:border-teal-300/60"
                    rows={2}
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveEdit(d.id)}
                      disabled={busy}
                      className="bg-teal-300 text-black glow-mint-sm rounded-full px-3 py-1 text-xs font-medium hover:bg-teal-200 transition-colors disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="border border-neutral-700 text-neutral-300 rounded-full px-3 py-1 text-xs hover:bg-neutral-800 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-neutral-200">{d.text}</p>
              )}
            </div>
          ))}
          {docs.length === 0 && <p className="text-sm text-neutral-500">Index is empty.</p>}
        </div>

        <div className="border-t border-neutral-800 pt-3">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">
            + Add document
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              className="sm:w-32 border border-neutral-700 bg-neutral-900 text-neutral-100 placeholder-neutral-500 rounded-full px-3 py-1.5 text-sm focus:outline-none focus:border-teal-300/60"
              value={newId}
              onChange={(e) => setNewId(e.target.value)}
              placeholder="id"
            />
            <input
              className="flex-1 border border-neutral-700 bg-neutral-900 text-neutral-100 placeholder-neutral-500 rounded-full px-3 py-1.5 text-sm focus:outline-none focus:border-teal-300/60"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="New document text..."
              onKeyDown={(e) => e.key === "Enter" && !busy && handleAdd()}
            />
            <button
              onClick={handleAdd}
              disabled={busy || !newText.trim()}
              className="bg-teal-300 text-black glow-mint-sm rounded-full px-4 py-1.5 text-sm font-medium hover:bg-teal-200 transition-colors disabled:opacity-50 shrink-0"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-800 panel p-4 mb-4">
        <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Search the index</div>
        <div className="flex gap-2 mb-3">
          <input
            className="flex-1 border border-neutral-700 bg-neutral-900 text-neutral-100 placeholder-neutral-500 rounded-full px-4 py-2 focus:outline-none focus:border-teal-300/60"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !busy && handleSearch()}
          />
          <button
            onClick={handleSearch}
            disabled={busy || !ready}
            className="bg-teal-300 text-black glow-mint-sm rounded-full px-5 py-2 text-sm font-medium hover:bg-teal-200 transition-colors disabled:opacity-50"
          >
            Search
          </button>
        </div>
        <div className="text-[11px] text-neutral-600 mb-2">distance (lower = closer match)</div>
        {results && results.length === 0 && <p className="text-sm text-neutral-500">No results.</p>}
        {results && results.length > 0 && (
          <div className="space-y-1.5">
            {results.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900/50 px-3 py-2"
              >
                <span className="text-sm text-neutral-200 truncate pr-3">{r.text}</span>
                <span className="text-xs font-mono text-teal-200 shrink-0">{r.distance.toFixed(3)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {lastAction && (
        <ResultPanel>
          {lastAction} Re-run the search above to see the effect reflected immediately — nothing
          else in the index had to be re-processed.
        </ResultPanel>
      )}
    </main>
  );
}
