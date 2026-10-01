"use client";
import { useEffect, useState } from "react";

/** Reveals text progressively, chunked so even long answers finish in
 * roughly the same, short duration rather than token-by-token forever. */
export function TypewriterText({ text, durationMs = 900 }: { text: string; durationMs?: number }) {
  const [shown, setShown] = useState("");

  useEffect(() => {
    if (!text) {
      setShown("");
      return;
    }
    const steps = 40;
    const chunkSize = Math.max(1, Math.ceil(text.length / steps));
    const tick = Math.max(10, Math.floor(durationMs / steps));
    let i = 0;
    const interval = setInterval(() => {
      i += chunkSize;
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, tick);
    return () => clearInterval(interval);
  }, [text, durationMs]);

  return <>{shown}</>;
}
