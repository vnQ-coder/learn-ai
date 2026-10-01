"use client";

import Link from "next/link";

const MODULES = [
  { slug: "01-embeddings-normal", title: "01 — Embeddings: Normal (TF-IDF)", blurb: "Keyword search over support tickets — and where it fails." },
  { slug: "02-embeddings-semantic", title: "02 — Embeddings: Semantic", blurb: "The same tickets, now matched by meaning, not just words." },
  { slug: "03-short-term-memory", title: "03 — Short-Term Memory", blurb: "A chatbot that forgets what you said a few turns ago." },
  { slug: "04-long-term-memory", title: "04 — Long-Term Memory", blurb: "An assistant that remembers facts across separate sessions." },
  { slug: "05-production-rag", title: "05 — Production RAG", blurb: "Hybrid search plus a cited, grounded answer from real docs." },
  { slug: "06-rag-guardrails", title: "06 — RAG Guardrails", blurb: "Catching hallucination and refusing to answer when unsure." },
  { slug: "07-tool-use", title: "07 — Tool Use (MCP-style)", blurb: "An agent that calls a real tool instead of guessing." },
  { slug: "08-agent-negotiation", title: "08 — Agent Negotiation", blurb: "Two agents haggling over a budget via HTTP messages." },
  { slug: "09-shared-knowledge", title: "09 — Shared Knowledge", blurb: "Three agents collaborating through a shared blackboard." },
];

export default function Home() {
  return (
    <main className="max-w-3xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-2">AI Learning Curriculum</h1>
      <p className="text-gray-600 mb-4">
        Nine runnable lessons on production RAG, embeddings, agent memory, and multi-agent
        systems. The Gemini API key is configured on the server — nothing to set up here, just
        click in and press Run.
      </p>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 mb-8 text-sm text-gray-700">
        Every page has two layers: a <strong>💡 plain-English</strong> box explaining what
        you&apos;re about to see and why it matters, and a <strong>🔧 under the hood</strong> box
        (click to expand) with the real technical mechanism for anyone who wants it. After you
        run a demo, a <strong>🔍 result</strong> box explains what the actual numbers and output
        mean. Underlined words anywhere are clickable — click one for a one-line definition.
      </div>

      <ul className="space-y-3">
        {MODULES.map((m) => (
          <li key={m.slug}>
            <Link href={`/${m.slug}`} className="block border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition">
              <div className="font-semibold">{m.title}</div>
              <div className="text-sm text-gray-600">{m.blurb}</div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
