"use client";

import { useState } from "react";
import { GLOSSARY, type GlossaryKey } from "@/lib/glossary";

export function Term({ term, children }: { term: GlossaryKey; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="underline decoration-dotted decoration-emerald-500/60 underline-offset-2 text-emerald-300 font-medium"
        aria-expanded={open}
      >
        {children}
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute z-20 left-0 top-full mt-1 w-64 rounded-md border border-neutral-700 bg-neutral-900 p-2 text-xs leading-snug text-neutral-300 shadow-lg"
        >
          {GLOSSARY[term]}
        </span>
      )}
    </span>
  );
}
