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
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-neutral-800/80 bg-[#0a0f0d]/90 backdrop-blur supports-[backdrop-filter]:bg-[#0a0f0d]/70">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0 group">
          <span className="w-7 h-7 rounded-md bg-emerald-400 text-black font-bold text-sm flex items-center justify-center group-hover:bg-emerald-300 transition-colors">
            L
          </span>
          <span className="font-semibold text-neutral-100 hidden sm:inline">Learn AI</span>
          <span className="text-[10px] uppercase tracking-wide text-emerald-400 bg-emerald-400/10 border border-emerald-400/30 rounded-full px-2 py-0.5 ml-1">
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
                    ? "bg-emerald-400/15 text-emerald-300 border border-emerald-400/40"
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
