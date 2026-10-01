"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const MODULES = [
  { slug: "01-embeddings-normal", num: "01" },
  { slug: "02-embeddings-semantic", num: "02" },
  { slug: "03-short-term-memory", num: "03" },
  { slug: "04-long-term-memory", num: "04" },
  { slug: "05-production-rag", num: "05" },
  { slug: "06-rag-guardrails", num: "06" },
  { slug: "07-tool-use", num: "07" },
  { slug: "08-agent-negotiation", num: "08" },
  { slug: "09-shared-knowledge", num: "09" },
  { slug: "10-multi-agent-orchestration", num: "10" },
  { slug: "11-observability-tracing", num: "11" },
  { slug: "12-human-feedback-loop", num: "12" },
  { slug: "13-react-architecture", num: "13" },
  { slug: "14-plan-and-execute", num: "14" },
  { slug: "15-langchain-pipeline", num: "15" },
  { slug: "16-langgraph-pipeline", num: "16" },
  { slug: "17-knowledge-graph", num: "17" },
  { slug: "18-hybrid-search", num: "18" },
  { slug: "19-incremental-indexing", num: "19" },
  { slug: "20-attention-mechanism", num: "20" },
  { slug: "21-multi-head-attention", num: "21" },
  { slug: "22-positional-encoding", num: "22" },
  { slug: "23-tokenization", num: "23" },
  { slug: "24-kv-cache", num: "24" },
  { slug: "25-quantization", num: "25" },
  { slug: "26-reranking", num: "26" },
  { slug: "27-model-evaluation", num: "27" },
  { slug: "28-llm-as-judge", num: "28" },
  { slug: "29-vector-databases", num: "29" },
  { slug: "30-agent-skills", num: "30" },
  { slug: "31-agent-harness", num: "31" },
  { slug: "32-forward-deployed-engineer", num: "32" },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-[#060908]/85 backdrop-blur supports-[backdrop-filter]:bg-[#060908]/70">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0 group">
          <span className="w-7 h-7 rounded-md bg-teal-300 text-black font-bold text-sm flex items-center justify-center glow-mint-sm group-hover:bg-teal-200 transition-colors">
            L
          </span>
          <span className="font-semibold text-neutral-100 hidden sm:inline">Learn AI</span>
          <span className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-teal-300 bg-teal-300/10 border border-teal-300/30 rounded-full px-2 py-0.5 ml-1">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-300 animate-pulse" />
            live
          </span>
        </Link>

        <nav className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          {MODULES.map((m) => {
            const active = pathname === `/${m.slug}`;
            return (
              <Link
                key={m.slug}
                href={`/${m.slug}`}
                title={m.slug}
                className={
                  "shrink-0 px-2.5 py-1.5 rounded-md text-xs font-mono transition-colors " +
                  (active
                    ? "bg-teal-300/15 text-teal-200 border border-teal-300/40 glow-mint-sm"
                    : "text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800/60 border border-transparent")
                }
              >
                {m.num}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
