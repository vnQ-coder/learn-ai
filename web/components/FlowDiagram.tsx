export type FlowNode = { id: string; icon: string; label: string };
export type FlowNodeState = "pending" | "active" | "done" | "fail";

const STATE_CLASSES: Record<FlowNodeState, string> = {
  pending: "bg-gray-100 border-gray-200 text-gray-400",
  active: "bg-blue-100 border-blue-400 text-blue-700 animate-pulse scale-110 shadow-md",
  done: "bg-green-100 border-green-500 text-green-700",
  fail: "bg-red-100 border-red-500 text-red-700",
};

export function FlowDiagram({ nodes, states }: { nodes: FlowNode[]; states: FlowNodeState[] }) {
  return (
    <div className="flex items-start mb-6">
      {nodes.map((n, i) => (
        <div key={n.id} className="flex items-center flex-1 min-w-0">
          <div className="flex flex-col items-center gap-1 shrink-0 w-20">
            <div
              className={
                "w-12 h-12 rounded-full flex items-center justify-center text-xl border-2 transition-all duration-300 " +
                STATE_CLASSES[states[i]]
              }
            >
              {states[i] === "done" ? "✓" : states[i] === "fail" ? "✕" : n.icon}
            </div>
            <div className="text-[11px] text-gray-600 text-center leading-tight">{n.label}</div>
          </div>
          {i < nodes.length - 1 && (
            <div
              className={
                "flex-1 h-0.5 mx-1 mt-6 transition-colors duration-300 " +
                (states[i] === "done" || states[i] === "fail" ? "bg-gray-400" : "bg-gray-200")
              }
            />
          )}
        </div>
      ))}
    </div>
  );
}
