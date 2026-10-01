"use client";

import Link from "next/link";
import { Type, Compass, MessageCircle, Database, BookOpen, ShieldCheck, Wrench, Handshake, Puzzle } from "lucide-react";

const MODULES = [
  { slug: "01-embeddings-normal", num: "01", icon: Type, title: "Embeddings: Normal", blurb: "Keyword search over support tickets — and where it fails." },
  { slug: "02-embeddings-semantic", num: "02", icon: Compass, title: "Embeddings: Semantic", blurb: "The same tickets, now matched by meaning, not just words." },
  { slug: "03-short-term-memory", num: "03", icon: MessageCircle, title: "Short-Term Memory", blurb: "A chatbot that forgets what you said a few turns ago." },
  { slug: "04-long-term-memory", num: "04", icon: Database, title: "Long-Term Memory", blurb: "An assistant that remembers facts across separate sessions." },
  { slug: "05-production-rag", num: "05", icon: BookOpen, title: "Production RAG", blurb: "Hybrid search plus a cited, grounded answer from real docs." },
  { slug: "06-rag-guardrails", num: "06", icon: ShieldCheck, title: "RAG Guardrails", blurb: "Catching hallucination and refusing to answer when unsure." },
  { slug: "07-tool-use", num: "07", icon: Wrench, title: "Tool Use (MCP-style)", blurb: "An agent that calls a real tool instead of guessing." },
  { slug: "08-agent-negotiation", num: "08", icon: Handshake, title: "Agent Negotiation", blurb: "Two agents haggling over a budget via HTTP messages." },
  { slug: "09-shared-knowledge", num: "09", icon: Puzzle, title: "Shared Knowledge", blurb: "Three agents collaborating through a shared blackboard." },
];

export default function Home() {
  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
      <div className="text-xs uppercase tracking-[0.2em] text-teal-300/80 font-medium mb-4">
        typesafe learning platform
      </div>

      <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
        Learn <span className="text-teal-300">AI</span> by running it.
      </h1>

      <p className="text-neutral-400 text-lg max-w-2xl mb-3">
        Nine runnable lessons on production RAG, embeddings, agent memory, and multi-agent
        systems. Ask questions, click run, watch it happen live — get real probabilities, not
        prose.
      </p>
      <p className="text-neutral-500 text-sm max-w-2xl mb-8">
        The Gemini API key is configured on the server. Nothing to set up — just click in and
        press Run.
      </p>

      <div className="flex flex-wrap gap-3 mb-8">
        <Link
          href="/01-embeddings-normal"
          className="inline-flex items-center gap-2 bg-teal-300 text-black font-medium rounded-full px-5 py-2.5 glow-mint hover:bg-teal-200 transition-colors"
        >
          ✦ Start module 01
        </Link>
        <Link
          href="/06-rag-guardrails"
          className="inline-flex items-center gap-2 border border-neutral-700 bg-neutral-900/60 text-neutral-200 rounded-full px-5 py-2.5 hover:border-teal-300/40 hover:text-teal-200 transition-colors"
        >
          ⚡ Try the live comparison
        </Link>
      </div>

      <div className="rounded-full border border-neutral-800 bg-neutral-900/40 px-5 py-2.5 mb-12 text-sm text-neutral-400 flex flex-wrap gap-x-6 gap-y-1 w-fit">
        <span>
          <strong className="text-teal-300">💡 plain-English</strong> — what and why
        </span>
        <span>
          <strong className="text-neutral-200">🔧 under the hood</strong> — the real mechanism
        </span>
        <span>
          <strong className="text-teal-300">🔍 result</strong> — what the numbers mean
        </span>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MODULES.map((m) => {
          const Icon = m.icon;
          return (
            <Link
              key={m.slug}
              href={`/${m.slug}`}
              className="group relative rounded-2xl border border-neutral-800 panel p-6 flex flex-col items-center text-center gap-2.5 hover:border-teal-300/60 hover:glow-mint transition-all"
            >
              <span className="absolute top-3 right-4 text-[11px] font-mono text-neutral-700 group-hover:text-teal-300/70 transition-colors">
                {m.num}
              </span>
              <span className="w-12 h-12 rounded-xl bg-neutral-800/80 border border-white/5 flex items-center justify-center text-teal-300 group-hover:border-teal-300/40 group-hover:bg-teal-300/10 transition-colors">
                <Icon size={22} strokeWidth={1.75} />
              </span>
              <div className="font-semibold text-neutral-100 group-hover:text-teal-200 transition-colors">
                {m.title}
              </div>
              <div className="text-sm text-neutral-500 leading-snug line-clamp-2">{m.blurb}</div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
