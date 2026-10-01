"use client";

import Link from "next/link";

const MODULES = [
  { slug: "01-embeddings-normal", num: "01", icon: "🔤", title: "Embeddings: Normal", blurb: "Keyword search over support tickets — and where it fails." },
  { slug: "02-embeddings-semantic", num: "02", icon: "🧭", title: "Embeddings: Semantic", blurb: "The same tickets, now matched by meaning, not just words." },
  { slug: "03-short-term-memory", num: "03", icon: "💬", title: "Short-Term Memory", blurb: "A chatbot that forgets what you said a few turns ago." },
  { slug: "04-long-term-memory", num: "04", icon: "🗄️", title: "Long-Term Memory", blurb: "An assistant that remembers facts across separate sessions." },
  { slug: "05-production-rag", num: "05", icon: "📚", title: "Production RAG", blurb: "Hybrid search plus a cited, grounded answer from real docs." },
  { slug: "06-rag-guardrails", num: "06", icon: "🛡️", title: "RAG Guardrails", blurb: "Catching hallucination and refusing to answer when unsure." },
  { slug: "07-tool-use", num: "07", icon: "🔧", title: "Tool Use (MCP-style)", blurb: "An agent that calls a real tool instead of guessing." },
  { slug: "08-agent-negotiation", num: "08", icon: "🤝", title: "Agent Negotiation", blurb: "Two agents haggling over a budget via HTTP messages." },
  { slug: "09-shared-knowledge", num: "09", icon: "🧩", title: "Shared Knowledge", blurb: "Three agents collaborating through a shared blackboard." },
];

export default function Home() {
  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
      <div className="text-xs uppercase tracking-[0.2em] text-emerald-400/80 font-medium mb-4">
        typesafe learning platform
      </div>

      <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
        Learn <span className="text-emerald-400">AI</span> by running it.
      </h1>

      <p className="text-neutral-400 text-lg max-w-2xl mb-3">
        Nine runnable lessons on production RAG, embeddings, agent memory, and multi-agent
        systems. Ask questions, click run, watch it happen live — get real probabilities, not
        prose.
      </p>
      <p className="text-neutral-500 text-sm max-w-2xl mb-10">
        The Gemini API key is configured on the server. Nothing to set up — just click in and
        press Run.
      </p>

      <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 mb-12 text-sm text-neutral-400 flex flex-wrap gap-x-6 gap-y-2">
        <span>
          <strong className="text-emerald-400">💡 plain-English</strong> — what you&apos;re about
          to see and why
        </span>
        <span>
          <strong className="text-neutral-200">🔧 under the hood</strong> — the real mechanism,
          click to expand
        </span>
        <span>
          <strong className="text-emerald-400">🔍 result</strong> — what the numbers actually mean
        </span>
        <span>
          <span className="underline decoration-dotted decoration-neutral-600">underlined</span> —
          click for a definition
        </span>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MODULES.map((m) => (
          <Link
            key={m.slug}
            href={`/${m.slug}`}
            className="group relative rounded-xl border border-neutral-800 bg-neutral-900/40 p-5 hover:border-emerald-400/50 hover:bg-neutral-900/70 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{m.icon}</span>
              <span className="text-[11px] font-mono text-neutral-600 group-hover:text-emerald-400 transition-colors">
                {m.num}
              </span>
            </div>
            <div className="font-semibold text-neutral-100 mb-1 group-hover:text-emerald-300 transition-colors">
              {m.title}
            </div>
            <div className="text-sm text-neutral-500 leading-snug">{m.blurb}</div>
          </Link>
        ))}
      </div>
    </main>
  );
}
