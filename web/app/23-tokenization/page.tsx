"use client";
import { useState } from "react";
import { apiPost } from "@/lib/api";
import { ConceptPanel, ResultPanel } from "@/components/ConceptPanel";

type TokenizeResponse = {
  text: string;
  real_tokens: string[];
  real_token_ids: number[];
  real_token_count: number;
  naive_tokens: string[];
  naive_token_count: number;
};

function Chip({ label, sub, continuation }: { label: string; sub?: string; continuation: boolean }) {
  return (
    <span
      className={
        "inline-flex flex-col items-center rounded-full border px-2.5 py-1 text-xs " +
        (continuation ? "border-teal-300/40 bg-teal-300/10 text-teal-200" : "border-neutral-800 bg-neutral-900/50 text-neutral-300")
      }
    >
      <span>{label}</span>
      {sub && <span className="font-mono text-[10px] text-neutral-500">{sub}</span>}
    </span>
  );
}

export default function Page() {
  const [text, setText] = useState("The unbelievably antidisestablishmentarian cat sat on the mat.");
  const [data, setData] = useState<TokenizeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiPost<TokenizeResponse>("/api/23/tokenize", { text });
      setData(res);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const splitWords = data?.real_tokens.filter((t) => t.startsWith("##")) ?? [];

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold mb-2 text-neutral-100">23 — Tokenization</h1>
      <p className="text-neutral-400 mb-4">Scenario: a real tokenizer breaking text into subword pieces, vs naive word splitting.</p>

      <ConceptPanel
        plain={
          <>
            AI models don&apos;t read text word by word — they break it into smaller pieces
            called tokens first, and those pieces often don&apos;t match up with what you&apos;d
            call a &quot;word&quot;. A long or unusual word might get chopped into several
            pieces; a short common word usually stays whole. This is why AI pricing and context
            limits are measured in tokens, not words or characters.
          </>
        }
        technical={
          <>
            This is subword (WordPiece) tokenization: the tokenizer has a fixed vocabulary of
            common whole words and word-pieces, learned from a huge corpus. Any word not in the
            vocabulary gets greedily split into the longest known pieces, with a{" "}
            <code>##</code> prefix marking a piece that continues the previous one rather than
            starting a new word — this lets the model handle rare or unseen words without an
            infinite vocabulary.
          </>
        }
      />

      <textarea
        className="w-full border border-neutral-700 bg-neutral-900 text-neutral-100 placeholder-neutral-500 rounded-xl px-4 py-3 mb-2 min-h-[80px] focus:outline-none focus:border-teal-300/60"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button
        onClick={run}
        disabled={loading}
        className="bg-teal-300 text-black glow-mint-sm rounded-full px-5 py-2 font-medium disabled:opacity-50 hover:bg-teal-200 transition-colors mb-6"
      >
        {loading ? "Tokenizing..." : "▶ Tokenize"}
      </button>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {data && (
        <>
          <div className="mb-4">
            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">
              Real tokenizer output ({data.real_token_count} tokens)
            </div>
            <div className="flex flex-wrap gap-1.5">
              {data.real_tokens.map((tok, i) => (
                <Chip key={i} label={tok} sub={String(data.real_token_ids[i])} continuation={tok.startsWith("##")} />
              ))}
            </div>
          </div>

          <div className="mb-6">
            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">
              Naive whitespace split ({data.naive_token_count} tokens)
            </div>
            <div className="flex flex-wrap gap-1.5">
              {data.naive_tokens.map((tok, i) => (
                <Chip key={i} label={tok} continuation={false} />
              ))}
            </div>
          </div>

          <ResultPanel>
            The real tokenizer produced <strong className="text-teal-300">{data.real_token_count}</strong>{" "}
            tokens vs <strong>{data.naive_token_count}</strong> naive whitespace tokens.{" "}
            {splitWords.length > 0 ? (
              <>
                The <code>{splitWords.length}</code> teal continuation piece
                {splitWords.length === 1 ? "" : "s"} above ({splitWords.join(", ")}) show exactly
                where a single word got chopped into multiple subword tokens — that&apos;s a
                word the tokenizer&apos;s vocabulary didn&apos;t have whole, so it fell back to
                known fragments.
              </>
            ) : (
              <>Every word in this text matched a whole token in the vocabulary — try a longer or less common word to see it split.</>
            )}
          </ResultPanel>
        </>
      )}
    </main>
  );
}
