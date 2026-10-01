export function ConceptPanel({
  plain,
  technical,
}: {
  plain: React.ReactNode;
  technical: React.ReactNode;
}) {
  return (
    <div className="mb-6 space-y-2">
      <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/5 p-4">
        <div className="font-semibold text-emerald-300 mb-1">💡 In plain English</div>
        <div className="text-sm text-neutral-300 leading-relaxed">{plain}</div>
      </div>
      <details className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
        <summary className="font-semibold cursor-pointer text-neutral-200">
          🔧 Under the hood (how it actually works)
        </summary>
        <div className="text-sm text-neutral-400 leading-relaxed mt-2">{technical}</div>
      </details>
    </div>
  );
}

export function ResultPanel({
  title = "🔍 What just happened",
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-400/5 p-4">
      <div className="font-semibold text-emerald-300 mb-1">{title}</div>
      <div className="text-sm text-neutral-300 leading-relaxed">{children}</div>
    </div>
  );
}
