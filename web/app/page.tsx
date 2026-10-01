"use client";

import Link from "next/link";
import {
  Type,
  Compass,
  MessageCircle,
  Database,
  BookOpen,
  ShieldCheck,
  Wrench,
  Handshake,
  Puzzle,
  Users,
  Activity,
  UserCheck,
  Brain,
  ListChecks,
  Link2,
  Network,
  Share2,
  Blend,
  RefreshCw,
  Eye,
  Layers,
  Waves,
  Scissors,
  Gauge,
  Shrink,
  ArrowUpDown,
  ClipboardCheck,
  Scale,
  Package,
  Cog,
  MapPin,
} from "lucide-react";

const FOUNDATIONS = [
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

const ADVANCED = [
  { slug: "10-multi-agent-orchestration", num: "10", icon: Users, title: "Multi-Agent Orchestration", blurb: "A supervisor AI dynamically routes requests to specialist agents." },
  { slug: "11-observability-tracing", num: "11", icon: Activity, title: "Observability & Tracing", blurb: "A live waterfall trace of every step, timing, and estimated cost." },
  { slug: "12-human-feedback-loop", num: "12", icon: UserCheck, title: "Human Feedback Loop", blurb: "Nothing ships until a human approves, edits, or sends it back." },
  { slug: "13-react-architecture", num: "13", icon: Brain, title: "ReAct Architecture", blurb: "Thought, Action, Observation — reasoning interleaved with real tool use." },
  { slug: "14-plan-and-execute", num: "14", icon: ListChecks, title: "Plan-and-Execute", blurb: "Plan every step upfront, then execute top to bottom — contrast with ReAct." },
  { slug: "15-langchain-pipeline", num: "15", icon: Link2, title: "LangChain Pipeline", blurb: "Real LangChain LCEL chains: prompt | llm | structured output." },
  { slug: "16-langgraph-pipeline", num: "16", icon: Network, title: "LangGraph Pipeline", blurb: "A real LangGraph StateGraph with conditional branching." },
  { slug: "17-knowledge-graph", num: "17", icon: Share2, title: "Knowledge Graph", blurb: "Multi-hop reasoning by traversing facts instead of vector search." },
];

const RAG_DEEP_DIVES = [
  { slug: "18-hybrid-search", num: "18", icon: Blend, title: "Hybrid Search Explained", blurb: "BM25 vs vector vs combined, side by side, on a query where it matters." },
  { slug: "19-incremental-indexing", num: "19", icon: RefreshCw, title: "Live-Updating Documents", blurb: "Add, edit, or delete one document — see the index update instantly." },
  { slug: "29-vector-databases", num: "29", icon: Database, title: "Vector Databases", blurb: "Brute-force vs indexed search, timed, as the corpus grows." },
];

const TRANSFORMER_INTERNALS = [
  { slug: "20-attention-mechanism", num: "20", icon: Eye, title: "Attention Mechanism", blurb: "Real scaled dot-product attention, visualized as a heatmap." },
  { slug: "21-multi-head-attention", num: "21", icon: Layers, title: "QKV Attention (Multi-Head)", blurb: "The same attention, run in parallel across several heads." },
  { slug: "22-positional-encoding", num: "22", icon: Waves, title: "Positional Encoding", blurb: "Proving attention is order-blind — until you add positions back." },
  { slug: "23-tokenization", num: "23", icon: Scissors, title: "Tokenization", blurb: "A real tokenizer splitting words into subword pieces." },
  { slug: "24-kv-cache", num: "24", icon: Gauge, title: "KV Cache", blurb: "Why generation would be quadratic-slow without caching." },
  { slug: "25-quantization", num: "25", icon: Shrink, title: "Quantization", blurb: "Shrinking real weights to int8 — and measuring the precision loss." },
];

const EVALUATION = [
  { slug: "26-reranking", num: "26", icon: ArrowUpDown, title: "Reranking", blurb: "A fast first pass, then a smarter second pass that fixes the order." },
  { slug: "27-model-evaluation", num: "27", icon: ClipboardCheck, title: "Model Evaluation", blurb: "A tiny automated eval suite, scored live against Gemini." },
  { slug: "28-llm-as-judge", num: "28", icon: Scale, title: "LLM-as-Judge", blurb: "One AI scoring two answers for helpfulness, accuracy, and clarity." },
];

const CONCEPTS = [
  { slug: "30-agent-skills", num: "30", icon: Package, title: "What Is an Agent Skill?", blurb: "Packaged, reusable instructions an agent can reach for." },
  { slug: "31-agent-harness", num: "31", icon: Cog, title: "What Is an Agent Harness?", blurb: "The execution loop that gives a model hands, using this session as the example." },
  { slug: "32-forward-deployed-engineer", num: "32", icon: MapPin, title: "What Is a Forward-Deployed Engineer?", blurb: "Embedded with one customer, building on the platform for their exact problem." },
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
        Twenty-nine runnable lessons — plus three short concept explainers — on production RAG,
        transformer internals, agent architectures, evaluation, and real LangChain/LangGraph
        pipelines. Ask questions, click run, watch it happen live — get real probabilities, not
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

      <div className="text-xs uppercase tracking-[0.2em] text-neutral-500 font-medium mb-4">Foundations</div>
      <ModuleGrid modules={FOUNDATIONS} />

      <div className="text-xs uppercase tracking-[0.2em] text-neutral-500 font-medium mb-4 mt-12">
        Advanced Architectures &amp; Frameworks
      </div>
      <ModuleGrid modules={ADVANCED} />

      <div className="text-xs uppercase tracking-[0.2em] text-neutral-500 font-medium mb-4 mt-12">RAG Deep Dives</div>
      <ModuleGrid modules={RAG_DEEP_DIVES} />

      <div className="text-xs uppercase tracking-[0.2em] text-neutral-500 font-medium mb-4 mt-12">Transformer Internals</div>
      <ModuleGrid modules={TRANSFORMER_INTERNALS} />

      <div className="text-xs uppercase tracking-[0.2em] text-neutral-500 font-medium mb-4 mt-12">Evaluation</div>
      <ModuleGrid modules={EVALUATION} />

      <div className="text-xs uppercase tracking-[0.2em] text-neutral-500 font-medium mb-4 mt-12">Concepts</div>
      <ModuleGrid modules={CONCEPTS} />
    </main>
  );
}

type ModuleCard = { slug: string; num: string; icon: typeof Type; title: string; blurb: string };

function ModuleGrid({ modules }: { modules: ModuleCard[] }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {modules.map((m) => {
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
            <div className="font-semibold text-neutral-100 group-hover:text-teal-200 transition-colors">{m.title}</div>
            <div className="text-sm text-neutral-500 leading-snug line-clamp-2">{m.blurb}</div>
          </Link>
        );
      })}
    </div>
  );
}
