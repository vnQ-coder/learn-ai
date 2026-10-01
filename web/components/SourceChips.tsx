type Chunk = { source: string; raw_vector_score: number };

function filename(path: string): string {
  return path.split("/").pop() ?? path;
}

export function SourceChips({
  chunks,
  threshold,
  limit,
}: {
  chunks: Chunk[];
  threshold: number;
  limit?: number;
}) {
  if (chunks.length === 0) return null;
  const shown = limit ? chunks.slice(0, limit) : chunks;
  const hidden = chunks.length - shown.length;
  return (
    <div className="flex flex-wrap gap-1.5 my-2">
      {shown.map((c, i) => {
        const pass = c.raw_vector_score >= threshold;
        return (
          <span
            key={i}
            className={
              "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs " +
              (pass ? "border-teal-300/40 bg-teal-300/10 text-teal-200" : "border-neutral-800 bg-neutral-900/50 text-neutral-500")
            }
            title={`${c.source} — relevance ${c.raw_vector_score.toFixed(3)}`}
          >
            📄 {filename(c.source)}
            <span className={"font-mono " + (pass ? "text-teal-200" : "text-neutral-600")}>
              {c.raw_vector_score.toFixed(2)}
            </span>
          </span>
        );
      })}
      {hidden > 0 && <span className="text-xs text-neutral-600 self-center">+{hidden} more</span>}
    </div>
  );
}
