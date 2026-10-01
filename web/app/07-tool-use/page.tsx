"use client";
import { useState } from "react";
import { streamEvents } from "@/lib/sse";
import { ConceptPanel, ResultPanel } from "@/components/ConceptPanel";
import { Term } from "@/components/Term";
import { ChatThread, type Bubble } from "@/components/ChatThread";
import { FlowDiagram, type FlowNodeState } from "@/components/FlowDiagram";
import { TypewriterText } from "@/components/TypewriterText";

const NODES = [
  { id: "question", icon: "❓", label: "Question" },
  { id: "decides", icon: "🧠", label: "Decides" },
  { id: "tool", icon: "🔧", label: "Tool runs" },
  { id: "answer", icon: "💬", label: "Answer" },
];

function stageStates(stage: number): FlowNodeState[] {
  return NODES.map((_, i) => {
    if (stage < 0) return "pending";
    if (i < stage) return "done";
    if (i === stage) return "active";
    return "pending";
  });
}

let seq = 0;
const nextId = () => `b${seq++}`;

export default function Page() {
  const [question, setQuestion] = useState("Where is my order 7788?");
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [stage, setStage] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [resultNote, setResultNote] = useState<React.ReactNode | null>(null);

  async function run() {
    setLoading(true);
    setResultNote(null);
    setStage(0);
    setBubbles([{ id: nextId(), role: "user", body: question }]);
    let calledTool = false;
    try {
      for await (const event of streamEvents<{ type: string; text?: string; message?: string }>(
        "/api/07/ask/stream",
        { question }
      )) {
        if (event.type === "step") {
          const text = event.text ?? "";
          if (text.startsWith("Model requested tool call")) {
            calledTool = true;
            setStage(1);
            setBubbles((b) => [...b, { id: nextId(), role: "step", icon: "🧠", body: text }]);
          } else if (text.startsWith("Tool result")) {
            setStage(2);
            setBubbles((b) => [...b, { id: nextId(), role: "step", icon: "🔧", body: text }]);
          } else if (text.startsWith("Final answer")) {
            setStage(NODES.length);
            setBubbles((b) => [
              ...b,
              { id: nextId(), role: "answer", title: "Answer", body: <TypewriterText text={text.replace(/^Final answer:\s*/, "")} /> },
            ]);
          } else {
            setStage(NODES.length);
            setBubbles((b) => [
              ...b,
              {
                id: nextId(),
                role: "answer",
                title: "Answer",
                body: <TypewriterText text={text.replace(/^Final answer \(no tool needed\):\s*/, "")} />,
              },
            ]);
          }
        } else if (event.type === "error") {
          setBubbles((b) => [...b, { id: nextId(), role: "error", icon: "⚠️", body: event.message }]);
        } else if (event.type === "done") {
          setStage(NODES.length);
          setResultNote(
            calledTool ? (
              <>
                The model requested a tool call rather than answering directly — you can see the
                real data your backend returned above, and the final answer uses that real data.
                Change the order number in the question and you&apos;ll get a different real
                result, not a different guess.
              </>
            ) : (
              <>
                The model answered directly without calling the tool this time. Try a question
                that clearly references an order number to see the tool-calling path trigger.
              </>
            )
          );
        }
      }
    } catch (e) {
      setBubbles((b) => [...b, { id: nextId(), role: "error", icon: "⚠️", body: (e as Error).message }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-2">07 — MCP-Style Tool Use (Function Calling)</h1>
      <p className="text-gray-600 mb-4">Scenario: an agent answering order questions by calling a local tool instead of guessing.</p>

      <ConceptPanel
        plain={
          <>
            Ask an AI &quot;where is my order?&quot; and it has no way to actually know — unless
            it&apos;s allowed to check. This demo gives the AI access to a real lookup tool.
            Watch it decide, live, to use that tool instead of guessing, then answer using the
            real result it got back.
          </>
        }
        technical={
          <>
            This is <Term term="toolCalling">function/tool calling</Term>: the model is given a
            schema describing an available function (<code>get_order_status</code>), and when it
            judges that calling it would help, it emits a structured function-call request
            instead of plain text. The backend executes that call and feeds the result back to
            the model, which writes its final answer grounded in that real data. This is the same
            mechanism behind <Term term="mcp">MCP</Term> (Model Context Protocol) and every{" "}
            <Term term="agent">agent</Term> that can use tools.
          </>
        }
      />

      {stage >= 0 && <FlowDiagram nodes={NODES} states={stageStates(stage)} />}

      <div className="flex gap-2 mb-2">
        <input
          className="flex-1 border rounded-full px-4 py-2"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && run()}
        />
        <button onClick={run} disabled={loading} className="bg-black text-white rounded-full px-5 py-2 disabled:opacity-50">
          {loading ? "…" : "Ask"}
        </button>
      </div>

      <ChatThread bubbles={bubbles} />
      {resultNote && <ResultPanel>{resultNote}</ResultPanel>}
    </main>
  );
}
