"use client";
import { useState } from "react";
import { apiPost } from "@/lib/api";
import { ConceptPanel, ResultPanel } from "@/components/ConceptPanel";
import { Term } from "@/components/Term";

type AskResponse = { transcript: string };

export default function Page() {
  const [question, setQuestion] = useState("Where is my order 7788?");
  const [transcript, setTranscript] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    setError(null);
    setTranscript(null);
    try {
      const data = await apiPost<AskResponse>("/api/07/ask", { question });
      setTranscript(data.transcript);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const calledTool = transcript?.includes("Model requested tool call");

  return (
    <main className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-2">07 — MCP-Style Tool Use (Function Calling)</h1>
      <p className="text-gray-600 mb-4">Scenario: an agent answering order questions by calling a local tool instead of guessing.</p>

      <ConceptPanel
        plain={
          <>
            Ask an AI &quot;where is my order?&quot; and it has no way to actually know — unless
            it&apos;s allowed to check. This demo gives the AI access to a real lookup tool. Watch
            it decide, on its own, to use that tool instead of guessing, then answer using the
            real result it got back.
          </>
        }
        technical={
          <>
            This is <Term term="toolCalling">function/tool calling</Term>: the model is given a
            schema describing an available function (<code>get_order_status</code>), and when it
            judges that calling it would help, it emits a structured function-call request
            instead of plain text. The backend executes that call against a real(-ish) data
            source and feeds the result back to the model, which then writes its final answer
            grounded in that real data. This is the same mechanism behind{" "}
            <Term term="mcp">MCP</Term> (Model Context Protocol) and every &quot;
            <Term term="agent">agent</Term>&quot; that can use tools — the model never actually
            runs code itself, it only ever asks your application to run something and hands back
            the result.
          </>
        }
      />

      <input className="w-full border rounded px-3 py-2 mb-2" value={question} onChange={(e) => setQuestion(e.target.value)} />
      <button onClick={run} disabled={loading} className="bg-black text-white rounded px-4 py-2 disabled:opacity-50">
        {loading ? "Running..." : "Run"}
      </button>
      {error && <p className="text-red-600 mt-4">{error}</p>}
      {transcript && (
        <>
          <pre className="whitespace-pre-wrap border rounded p-3 bg-white text-sm mt-4">{transcript}</pre>
          <ResultPanel>
            {calledTool ? (
              <>
                Look at the first line: the model requested a tool call rather than answering
                directly. The line after that is the real data your backend returned. The final
                answer uses that real data — change the order number in the question above and
                you&apos;ll get a different real result, not a different guess.
              </>
            ) : (
              <>
                The model answered directly without calling the tool this time — it may have
                judged the question didn&apos;t need a lookup. Try a question that clearly
                references an order number to see the tool-calling path trigger.
              </>
            )}
          </ResultPanel>
        </>
      )}
    </main>
  );
}
