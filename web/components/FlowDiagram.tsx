export type FlowNode = { id: string; icon: string; label: string };
export type FlowNodeState = "pending" | "active" | "done" | "fail";

const STATE_CLASSES: Record<FlowNodeState, string> = {
  pending: "bg-gray-100 border-gray-200 text-gray-400",
  active: "bg-blue-100 border-blue-400 text-blue-700 animate-pulse scale-110 shadow-md",
  done: "bg-green-100 border-green-500 text-green-700",
  fail: "bg-red-100 border-red-500 text-red-700",
};

function connectorClass(from: FlowNodeState, to: FlowNodeState): string {
  if (from === "done" && to === "active") return "flow-sweep";
  if (from === "done" || from === "fail") return "bg-gray-400";
  return "bg-gray-200";
}

export function FlowDiagram({
  nodes,
  states,
  compact = false,
}: {
  nodes: FlowNode[];
  states: FlowNodeState[];
  compact?: boolean;
}) {
  const circle = compact ? "w-9 h-9 text-base" : "w-12 h-12 text-xl";
  const colWidth = compact ? "w-14" : "w-20";
  const mt = compact ? "mt-[18px]" : "mt-6";

  return (
    <div className={"flex items-start " + (compact ? "mb-3" : "mb-6")}>
      {nodes.map((n, i) => (
        <div key={n.id} className="flex items-center flex-1 min-w-0">
          <div className={"flex flex-col items-center gap-1 shrink-0 " + colWidth}>
            <div
              className={
                circle +
                " rounded-full flex items-center justify-center border-2 transition-all duration-300 " +
                STATE_CLASSES[states[i]]
              }
            >
              {states[i] === "done" ? "✓" : states[i] === "fail" ? "✕" : n.icon}
            </div>
            {!compact && <div className="text-[11px] text-gray-600 text-center leading-tight">{n.label}</div>}
          </div>
          {i < nodes.length - 1 && (
            <div className={"flex-1 h-0.5 mx-1 transition-colors duration-300 " + mt + " " + connectorClass(states[i], states[i + 1])} />
          )}
        </div>
      ))}
    </div>
  );
}
