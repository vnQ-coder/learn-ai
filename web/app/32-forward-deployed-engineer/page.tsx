"use client";

import { ConceptPanel } from "@/components/ConceptPanel";

export default function Page() {
  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold mb-2 text-neutral-100">32 — What Is a Forward-Deployed Engineer?</h1>
      <p className="text-neutral-400 mb-4">
        Concept: an engineer who builds inside the customer&apos;s world, not inside the company&apos;s office.
      </p>

      <ConceptPanel
        plain={
          <>
            Most software engineers build features for everyone at once — a generic product, shaped
            by feedback gathered from thousands of customers, that has to work reasonably well for
            all of them without being perfectly tailored to any single one. A{" "}
            <strong className="text-neutral-200">forward-deployed engineer (FDE)</strong> works
            differently: they sit (sometimes literally, sometimes just very closely) with ONE
            specific customer, learn that customer&apos;s exact workflow and data and pain points in
            detail, and write code that solves that customer&apos;s real problem — using the
            company&apos;s core platform as the foundation, but the end result is custom-built for
            that one customer.
          </>
        }
        technical={
          <>
            The role exists because some problems are too specific — too tied to one customer&apos;s
            unique data shape, legacy systems, or internal process — to solve with a one-size-fits-all
            generic product feature. An FDE embeds with the customer, builds the custom solution
            directly against the platform, and in doing so often discovers what the{" "}
            <em>generic</em> product should eventually become — a pattern seen across enough
            customers gets generalized back into the core platform, while a genuine one-off stays a
            one-off. The term and practice is most associated with Palantir, where it originated as
            a formal role, and has since become common at applied-AI and enterprise infrastructure
            companies more broadly, since deploying an AI agent into one company&apos;s specific
            systems and data often genuinely requires this kind of embedded, custom-build approach
            rather than a pure self-serve product.
          </>
        }
      />

      <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
        <div className="font-semibold text-neutral-200 mb-2">Skills beyond pure engineering</div>
        <ul className="text-sm text-neutral-400 leading-relaxed list-disc list-inside space-y-1">
          <li>Communicating directly and clearly with non-technical stakeholders, not just other engineers.</li>
          <li>Staying productive under ambiguous, frequently-changing requirements rather than a fixed spec.</li>
          <li>
            Judgment to know when a customer-specific hack should eventually be generalized back
            into the core product, versus kept as a deliberate one-off.
          </li>
        </ul>
      </div>
    </main>
  );
}
