"use client";

import { ConceptPanel } from "@/components/ConceptPanel";

export default function Page() {
  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold mb-2 text-neutral-100">31 — What Is an Agent Harness?</h1>
      <p className="text-neutral-400 mb-4">
        Concept: the surrounding code that gives a language model hands, eyes, and a loop to keep working in.
      </p>

      <ConceptPanel
        plain={
          <>
            A language model, on its own, can only predict the next piece of text. It cannot open
            a file, run a command, or check whether what it just did actually worked. A{" "}
            <strong className="text-neutral-200">harness</strong> is the program wrapped around the
            model that actually DOES things on its behalf: it shows the model a menu of available
            tools, notices when the model wants to use one, runs it for real, hands the result back,
            and repeats — over and over — until the task is finished or something needs a human&apos;s
            attention.
          </>
        }
        technical={
          <>
            The core distinction is: the <strong className="text-neutral-200">model</strong> is a
            pure text-in, text-out function with no side effects of its own. The{" "}
            <strong className="text-neutral-200">harness</strong> is everything around it —
            parsing the model&apos;s structured tool-call requests, actually executing them (reading
            a file, running a shell command, calling an API), feeding the real result back into the
            next turn, managing context/memory across many turns, enforcing permission and safety
            checks before risky actions, and deciding when to stop the loop. Two different harnesses
            wrapping the <em>exact same</em> underlying model can behave very differently — one
            might only be able to chat, another might be able to edit files, run tests, spawn
            sub-agents, and push code — because so much of what an agent can actually accomplish is
            determined by the harness around it, not the model&apos;s weights alone.
          </>
        }
      />

      <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
        <div className="font-semibold text-neutral-200 mb-2">The clearest example is this exact session</div>
        <p className="text-sm text-neutral-400 leading-relaxed">
          Everything that just happened while this curriculum was being built — reading existing
          files to copy their conventions, running Python scripts to verify a demo actually works
          against a real API, editing component code, spawning background agents to build modules
          in parallel, restarting a dev server, taking a screenshot in a browser to confirm a page
          renders correctly — none of that is something the underlying language model can do by
          itself. The model decided <em>what</em> to do at each step; the harness is what actually
          read the files, ran the shell commands, edited the code, and reported the real results
          back so the model could decide the next step. That loop, repeated, is what turned a
          single text-prediction model into something that could build and verify dozens of working
          application modules.
        </p>
      </div>
    </main>
  );
}
