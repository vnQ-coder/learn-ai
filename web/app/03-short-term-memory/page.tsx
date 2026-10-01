"use client";
import { useState } from "react";
import { apiPost } from "@/lib/api";
import { ConceptPanel, ResultPanel } from "@/components/ConceptPanel";
import { Term } from "@/components/Term";

type ConversationResponse = { transcript: string };

export default function Page() {
  const [transcript10, setTranscript10] = useState<string | null>(null);
  const [transcript1, setTranscript1] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<"10" | "1" | null>(null);

  async function run(windowSize: number, setter: (s: string | null) => void, which: "10" | "1") {
    setLoading(which);
    setError(null);
    setter(null);
    try {
      const data = await apiPost<ConversationResponse>("/api/03/conversation", { window_size: windowSize });
      setter(data.transcript);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(null);
    }
  }

  return (
    <main className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-2">03 — Short-Term Memory (Sliding Window)</h1>
      <p className="text-gray-600 mb-4">
        Scenario: a support chatbot booking a flight, where an early detail must survive to the last turn.
      </p>

      <ConceptPanel
        plain={
          <>
            AI chatbots don&apos;t remember a conversation the way a person does — they only
            see a limited window of recent messages on every reply. Tell it &quot;business
            class&quot; early on, then ask it to recall that detail later. If too much
            conversation has happened in between, it genuinely won&apos;t know — not because
            it&apos;s being evasive, but because that message has scrolled out of what it can
            see.
          </>
        }
        technical={
          <>
            This implements a sliding-window <Term term="shortTermMemory">context buffer</Term>:
            each call to the model includes only the last N turns of conversation; everything
            older is dropped from the prompt entirely before the request is even sent. The
            model has no hidden memory of dropped turns — if it&apos;s not in the window, it
            never existed as far as that API call is concerned. This is exactly why production
            chat apps need a separate strategy (see module 04) for anything that must survive
            past a short window.
          </>
        }
      />

      <div className="flex gap-3 mb-4">
        <button onClick={() => run(10, setTranscript10, "10")} disabled={loading !== null} className="bg-black text-white rounded px-4 py-2 disabled:opacity-50">
          {loading === "10" ? "Running..." : "Run with window_size=10 (remembers)"}
        </button>
        <button onClick={() => run(1, setTranscript1, "1")} disabled={loading !== null} className="bg-black text-white rounded px-4 py-2 disabled:opacity-50">
          {loading === "1" ? "Running..." : "Run with window_size=1 (forgets)"}
        </button>
      </div>
      {error && <p className="text-red-600 mt-2">{error}</p>}
      {transcript10 && (
        <div className="mb-4">
          <h2 className="font-semibold mb-1">window_size=10 (remembers)</h2>
          <pre className="whitespace-pre-wrap border rounded p-3 bg-white text-sm">{transcript10}</pre>
        </div>
      )}
      {transcript1 && (
        <div>
          <h2 className="font-semibold mb-1">window_size=1 (forgets)</h2>
          <pre className="whitespace-pre-wrap border rounded p-3 bg-white text-sm">{transcript1}</pre>
        </div>
      )}
      {transcript10 && transcript1 && (
        <ResultPanel>
          Run both buttons and compare the final answer in each transcript. With a window of 10
          turns, the assistant still had &quot;business class&quot; in view and should recall it
          correctly. With a window of just 1 turn, that detail was pushed out several messages
          ago — the assistant should either admit it doesn&apos;t know or guess wrong. Same
          model, same conversation, only the <Term term="shortTermMemory">memory window</Term>{" "}
          changed.
        </ResultPanel>
      )}
    </main>
  );
}
