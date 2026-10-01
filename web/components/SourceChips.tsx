type Chunk = { source: string; raw_vector_score: number };

function filename(path: string): string {
  return path.split("/").pop() ?? path;
}

export function SourceChips({ chunks, threshold }: { chunks: Chunk[]; threshold: number }) {
  if (chunks.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 my-2">
      {chunks.map((c, i) => {
        const pass = c.raw_vector_score >= threshold;
        return (
          <span
            key={i}
            className={
              "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs " +
              (pass ? "border-green-300 bg-green-50 text-green-800" : "border-gray-200 bg-gray-50 text-gray-500")
            }
            title={`${c.source} — relevance ${c.raw_vector_score.toFixed(3)}`}
          >
            📄 {filename(c.source)}
            <span className={"font-mono " + (pass ? "text-green-700" : "text-gray-400")}>
              {c.raw_vector_score.toFixed(2)}
            </span>
          </span>
        );
      })}
    </div>
  );
}
