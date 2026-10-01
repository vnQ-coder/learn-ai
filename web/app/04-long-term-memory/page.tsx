"use client";
import { useState } from "react";
import { apiPost } from "@/lib/api";

type RememberResponse = { id: string };
type RecallResponse = { result: string | null; distance: number | null };

export default function Page() {
  const [fact, setFact] = useState("I'm vegetarian");
  const [question, setQuestion] = useState("what should I eat");
  const [rememberMsg, setRememberMsg] = useState<string | null>(null);
  const [recallResult, setRecallResult] = useState<RecallResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function remember() {
    setError(null);
    try {
      const data = await apiPost<RememberResponse>("/api/04/remember", { fact });
      setRememberMsg(`Remembered (id=${data.id}): ${fact}`);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function recall() {
    setError(null);
    try {
      setRecallResult(await apiPost<RecallResponse>("/api/04/recall", { query: question }));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <main className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-2">04 — Long-Term Memory (Persistent, Cross-Session)</h1>
      <p className="text-gray-600 mb-4">Scenario: a personal assistant that remembers facts across separate sessions.</p>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-1">Teach me a fact</label>
        <div className="flex gap-2">
          <input className="flex-1 border rounded px-3 py-2" value={fact} onChange={(e) => setFact(e.target.value)} />
          <button onClick={remember} className="bg-black text-white rounded px-4 py-2">Remember</button>
        </div>
        {rememberMsg && <p className="text-green-700 text-sm mt-2">{rememberMsg}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Ask a question</label>
        <div className="flex gap-2">
          <input className="flex-1 border rounded px-3 py-2" value={question} onChange={(e) => setQuestion(e.target.value)} />
          <button onClick={recall} className="bg-black text-white rounded px-4 py-2">Recall</button>
        </div>
        {recallResult && (
          <p className="text-sm mt-2">
            {recallResult.result
              ? `Recalled: ${recallResult.result} (distance=${recallResult.distance?.toFixed(3)})`
              : "Nothing remembered yet."}
          </p>
        )}
      </div>
      {error && <p className="text-red-600 mt-4">{error}</p>}
    </main>
  );
}
