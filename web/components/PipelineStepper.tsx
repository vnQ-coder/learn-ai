export function PipelineStepper({ stages, activeIndex }: { stages: string[]; activeIndex: number }) {
  return (
    <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1">
      {stages.map((label, i) => (
        <div key={label} className="flex items-center gap-1.5 shrink-0">
          <div
            className={
              "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors " +
              (i < activeIndex
                ? "bg-green-100 text-green-800"
                : i === activeIndex
                ? "bg-blue-100 text-blue-800 animate-pulse"
                : "bg-gray-100 text-gray-400")
            }
          >
            <span>{i < activeIndex ? "✓" : i === activeIndex ? "●" : "○"}</span>
            <span>{label}</span>
          </div>
          {i < stages.length - 1 && <div className="w-3 h-px bg-gray-300 shrink-0" />}
        </div>
      ))}
    </div>
  );
}
