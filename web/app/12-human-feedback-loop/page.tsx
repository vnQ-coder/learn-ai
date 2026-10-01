"use client";
import { useState } from "react";
import { apiPost } from "@/lib/api";
import { ConceptPanel, ResultPanel } from "@/components/ConceptPanel";

type DraftResponse = { draft: string };

type Version = {
  text: string;
  status: "pending" | "approved";
};

let seq = 0;
const nextId = () => seq++;

export default function Page() {
  const [complaint, setComplaint] = useState(
    "My order arrived broken and support hasn't responded in 3 days."
  );
  const [versions, setVersions] = useState<Version[]>([]);
  const [feedback, setFeedback] = useState("");
  const [showFeedbackBox, setShowFeedbackBox] = useState(false);
  const [loading, setLoading] = useState<"draft" | "revise" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const current = versions.length > 0 ? versions[versions.length - 1] : null;
  const currentIsFinal = current?.status === "approved";

  async function generateDraft() {
    setLoading("draft");
    setError(null);
    try {
      const data = await apiPost<DraftResponse>("/api/12/draft", { complaint });
      setVersions([{ text: data.draft, status: "pending" }]);
      setShowFeedbackBox(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(null);
    }
  }

  function updateCurrentText(text: string) {
    setVersions((vs) => {
      if (vs.length === 0) return vs;
      const next = [...vs];
      next[next.length - 1] = { ...next[next.length - 1], text };
      return next;
    });
  }

  function approve() {
    setVersions((vs) => {
      if (vs.length === 0) return vs;
      const next = [...vs];
      next[next.length - 1] = { ...next[next.length - 1], status: "approved" };
      return next;
    });
    setShowFeedbackBox(false);
  }

  async function submitRevision() {
    if (!current || !feedback.trim()) return;
    setLoading("revise");
    setError(null);
    try {
      const data = await apiPost<DraftResponse>("/api/12/revise", {
        complaint,
        previous_draft: current.text,
        feedback,
      });
      setVersions((vs) => [...vs, { text: data.draft, status: "pending" }]);
      setFeedback("");
      setShowFeedbackBox(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(null);
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold mb-2 text-neutral-100">
        12 — Human Feedback Loop (Human-in-the-Loop)
      </h1>
      <p className="text-neutral-400 mb-4">
        Scenario: an AI drafts a reply to a customer complaint, but a human must approve it before
        it&apos;s considered sent.
      </p>

      <ConceptPanel
        plain={
          <>
            Before a real agent sends something or takes an action, a human often needs to
            approve it first. This shows that approval gate live: the AI drafts a reply, you
            review it, and you can approve it, edit it yourself, or send it back for changes with
            specific feedback.
          </>
        }
        technical={
          <>
            This is <strong>human-in-the-loop (HITL)</strong>, a safety and quality pattern in
            production agent systems: the agent proposes, a human disposes. A rejected proposal
            isn&apos;t discarded — its feedback is fed back into the next generation call
            explicitly, so you can watch the output change turn over turn based on exactly what a
            reviewer asked for.
          </>
        }
      />

      <label className="block text-xs font-medium text-neutral-500 mb-1">Customer complaint</label>
      <textarea
        className="w-full border border-neutral-700 bg-neutral-900 text-neutral-100 placeholder-neutral-500 rounded-xl px-4 py-2 mb-2 focus:outline-none focus:border-teal-300/60"
        rows={2}
        value={complaint}
        onChange={(e) => setComplaint(e.target.value)}
      />
      <button
        onClick={generateDraft}
        disabled={loading !== null}
        className="bg-teal-300 text-black glow-mint-sm rounded-full px-5 py-2 disabled:opacity-50 text-sm font-medium hover:bg-teal-200 transition-colors mb-6"
      >
        {loading === "draft" ? "Generating…" : versions.length > 0 ? "Start over" : "Generate draft"}
      </button>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {versions.length > 0 && (
        <div className="space-y-3 mb-4">
          {versions.map((v, i) => {
            const isCurrent = i === versions.length - 1;
            return (
              <div
                key={i}
                className={
                  "rounded-xl border p-4 " +
                  (v.status === "approved"
                    ? "border-teal-300/40 bg-teal-300/5"
                    : "border-neutral-800 bg-neutral-900/40")
                }
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                    v{i + 1}
                  </span>
                  <span
                    className={
                      "text-[11px] rounded-full px-2 py-0.5 border " +
                      (v.status === "approved"
                        ? "border-teal-300/40 text-teal-200 bg-teal-300/10"
                        : "border-neutral-700 text-neutral-400")
                    }
                  >
                    {v.status === "approved" ? "✅ approved & sent" : "pending review"}
                  </span>
                </div>

                {isCurrent && v.status === "pending" ? (
                  <textarea
                    className="w-full border border-neutral-700 bg-neutral-950 text-neutral-100 rounded-lg px-3 py-2 text-sm leading-relaxed focus:outline-none focus:border-teal-300/60"
                    rows={4}
                    value={v.text}
                    onChange={(e) => updateCurrentText(e.target.value)}
                  />
                ) : (
                  <p className="text-sm text-neutral-200 leading-relaxed whitespace-pre-wrap">{v.text}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {current && !currentIsFinal && (
        <div className="space-y-3 mb-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={approve}
              className="bg-teal-300 text-black glow-mint-sm rounded-full px-4 py-2 text-sm font-medium hover:bg-teal-200 transition-colors"
            >
              ✅ Approve &amp; send
            </button>
            <button
              onClick={() => setShowFeedbackBox((s) => !s)}
              className="border border-neutral-700 bg-neutral-900 text-neutral-200 rounded-full px-4 py-2 text-sm hover:bg-neutral-800 transition-colors"
            >
              🔁 Request revision
            </button>
            <span className="text-xs text-neutral-500 self-center">✏️ or just edit the text above directly</span>
          </div>

          {showFeedbackBox && (
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
              <label className="block text-xs font-medium text-neutral-500 mb-1">
                What should change?
              </label>
              <textarea
                className="w-full border border-neutral-700 bg-neutral-950 text-neutral-100 placeholder-neutral-500 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:border-teal-300/60"
                rows={2}
                placeholder="e.g. too formal, make it warmer and apologize up front"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
              <button
                onClick={submitRevision}
                disabled={loading !== null || !feedback.trim()}
                className="bg-teal-300 text-black glow-mint-sm rounded-full px-4 py-2 disabled:opacity-50 text-sm font-medium hover:bg-teal-200 transition-colors"
              >
                {loading === "revise" ? "Revising…" : "Submit feedback"}
              </button>
            </div>
          )}
        </div>
      )}

      {currentIsFinal && (
        <ResultPanel>
          Nothing reached the customer until a human explicitly approved it
          {versions.length > 1 ? (
            <>
              . Notice the earlier rejected draft&apos;s feedback is baked directly into this
              final version&apos;s wording — the AI didn&apos;t just try again, it responded to
              exactly what the reviewer asked for.
            </>
          ) : (
            <>, and that approval was a single explicit click — the AI never acted on its own.</>
          )}
        </ResultPanel>
      )}
    </main>
  );
}
