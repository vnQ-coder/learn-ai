export type Bubble = {
  id: string;
  role: "user" | "step" | "answer" | "error";
  icon?: string;
  title?: string;
  body: React.ReactNode;
};

const ROLE_CLASSES: Record<Bubble["role"], string> = {
  user: "ml-auto max-w-[85%] bg-teal-300 text-black rounded-2xl rounded-br-sm px-4 py-2",
  error: "max-w-[90%] bg-red-950/40 border border-red-900/60 text-red-300 rounded-2xl rounded-bl-sm px-4 py-2 text-sm",
  answer: "max-w-[90%] bg-neutral-900/70 border border-neutral-800 text-neutral-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm",
  step: "max-w-[90%] bg-neutral-800/50 text-neutral-400 text-sm rounded-2xl rounded-bl-sm px-3 py-1.5",
};

export function ChatThread({ bubbles }: { bubbles: Bubble[] }) {
  if (bubbles.length === 0) return null;
  return (
    <div className="space-y-2 mb-4">
      {bubbles.map((b) => (
        <div key={b.id} className={`${ROLE_CLASSES[b.role]} animate-[fadeIn_0.25s_ease-out]`}>
          {b.title && <div className="font-semibold text-sm mb-0.5">{b.title}</div>}
          <div className="whitespace-pre-wrap leading-relaxed">
            {b.icon && <span className="mr-1.5">{b.icon}</span>}
            {b.body}
          </div>
        </div>
      ))}
    </div>
  );
}
