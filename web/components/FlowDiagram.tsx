import { Check, X, type LucideIcon } from "lucide-react";

export type FlowNode = { id: string; icon: LucideIcon; label: string };
export type FlowNodeState = "pending" | "active" | "done" | "fail";

const STATE_CLASSES: Record<FlowNodeState, string> = {
  pending: "bg-neutral-900 border-neutral-700 text-neutral-600",
  active: "bg-teal-300/15 border-teal-300 text-teal-200 animate-pulse scale-110 shadow-md shadow-teal-300/10",
  done: "bg-teal-300/15 border-teal-400 text-teal-200",
  fail: "bg-red-950/40 border-red-500 text-red-400",
};

function connectorClass(from: FlowNodeState, to: FlowNodeState): string {
  if (from === "done" && to === "active") return "flow-sweep";
  if (from === "done" || from === "fail") return "bg-teal-600/60";
  return "bg-neutral-800";
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
  const circle = compact ? "w-9 h-9" : "w-12 h-12";
  const iconSize = compact ? 16 : 20;
  const colWidth = compact ? "w-14" : "w-20";
  const mt = compact ? "mt-[18px]" : "mt-6";

  return (
    <div className={"flex items-start " + (compact ? "mb-3" : "mb-6")}>
      {nodes.map((n, i) => {
        const Icon = n.icon;
        const StateIcon = states[i] === "done" ? Check : states[i] === "fail" ? X : Icon;
        return (
          <div key={n.id} className="flex items-center flex-1 min-w-0">
            <div className={"flex flex-col items-center gap-1 shrink-0 " + colWidth}>
              <div
                className={
                  circle +
                  " rounded-full flex items-center justify-center border-2 transition-all duration-300 " +
                  STATE_CLASSES[states[i]]
                }
              >
                <StateIcon size={iconSize} strokeWidth={2} />
              </div>
              {!compact && <div className="text-[11px] text-neutral-500 text-center leading-tight">{n.label}</div>}
            </div>
            {i < nodes.length - 1 && (
              <div className={"flex-1 h-0.5 mx-1 transition-colors duration-300 " + mt + " " + connectorClass(states[i], states[i + 1])} />
            )}
          </div>
        );
      })}
    </div>
  );
}
