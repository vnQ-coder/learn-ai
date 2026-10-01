"use client";

import { ConceptPanel } from "@/components/ConceptPanel";

export default function Page() {
  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold mb-2 text-neutral-100">30 — What Is an Agent Skill?</h1>
      <p className="text-neutral-400 mb-4">
        Concept: a packaged, reusable piece of know-how an AI agent can reach for only when it&apos;s needed.
      </p>

      <ConceptPanel
        plain={
          <>
            Imagine a single employee&apos;s handbook that tried to cover every possible job in the
            company at once — onboarding, legal compliance, database migrations, customer refunds,
            all crammed into one document everyone has to read in full before doing anything. It
            would be enormous, exhausting, and mostly irrelevant to whatever task is actually in
            front of them. A <strong className="text-neutral-200">skill</strong> is the opposite of
            that: a small, focused instruction set for ONE specific kind of task, that an agent
            pulls out and reads only when that specific task comes up — then sets back down.
          </>
        }
        technical={
          <>
            Without skills, every capability an agent needs has to live in one giant system
            prompt — which bloats fast, gets expensive to run (more tokens every single call,
            whether needed or not), and dilutes the model&apos;s focus with instructions irrelevant
            to the task at hand. A skill solves this by being{" "}
            <strong className="text-neutral-200">discoverable but not always loaded</strong>: it
            has a short name and description the agent (or an orchestrating harness — see{" "}
            <Link31 />) can scan to decide &quot;does this match what I&apos;m doing right now?&quot;,
            and only if it matches does the full instruction body get pulled into context. The
            skill itself usually contains the actual procedure, domain knowledge, or checklist for
            that task — sometimes bundled with example code, reference files, or a specific output
            format to follow.
          </>
        }
      />

      <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 mb-6">
        <div className="font-semibold text-neutral-200 mb-2">Concrete examples</div>
        <ul className="text-sm text-neutral-400 leading-relaxed list-disc list-inside space-y-1">
          <li>
            A <strong className="text-neutral-300">&quot;database migration&quot; skill</strong>{" "}
            that encodes your team&apos;s exact safe-migration checklist (backup first, run on a
            replica, check row counts, etc.) — any agent instance can follow it correctly without
            that knowledge being crammed into every single conversation&apos;s starting context,
            whether or not that conversation ever touches a database.
          </li>
          <li>
            A <strong className="text-neutral-300">&quot;brand voice&quot; skill</strong> for a
            marketing team, containing tone guidelines and example copy, loaded only when the task
            is actually writing customer-facing content.
          </li>
          <li>
            This very curriculum is, in a loose sense, a <strong className="text-neutral-300">skill
            library</strong> for AI engineering patterns: each of its 30+ modules is a focused,
            self-contained unit you reach for when you specifically need that pattern — RAG,
            tool-calling, multi-agent orchestration — rather than one overwhelming document trying
            to teach everything about AI at once.
          </li>
        </ul>
      </div>
    </main>
  );
}

function Link31() {
  return (
    <a href="/31-agent-harness" className="underline decoration-dotted decoration-teal-400/60 text-teal-200 font-medium">
      harness
    </a>
  );
}
