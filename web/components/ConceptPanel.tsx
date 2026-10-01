export function ConceptPanel({
  plain,
  technical,
}: {
  plain: React.ReactNode;
  technical: React.ReactNode;
}) {
  return (
    <div className="mb-6 space-y-2">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="font-semibold text-blue-900 mb-1">💡 In plain English</div>
        <div className="text-sm text-blue-950 leading-relaxed">{plain}</div>
      </div>
      <details className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <summary className="font-semibold cursor-pointer text-gray-800">
          🔧 Under the hood (how it actually works)
        </summary>
        <div className="text-sm text-gray-700 leading-relaxed mt-2">{technical}</div>
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
    <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
      <div className="font-semibold text-green-900 mb-1">{title}</div>
      <div className="text-sm text-green-950 leading-relaxed">{children}</div>
    </div>
  );
}
