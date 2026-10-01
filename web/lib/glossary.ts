export const GLOSSARY = {
  embedding:
    "A way to turn text into a list of numbers that captures its meaning, so a computer can measure how similar two pieces of text are.",
  tfidf:
    "A classic keyword-matching search technique. It only looks at which words appear, not what they mean.",
  semanticSearch:
    "Search based on meaning rather than exact words — it can find relevant results even when the wording is completely different.",
  vectorScore:
    "A number (usually 0 to 1) showing how similar two pieces of text are in meaning. Higher = more similar.",
  rag:
    "Retrieval-Augmented Generation: instead of answering from memory alone, the AI first looks up real documents, then answers using only what it found.",
  hybridSearch:
    "Combining keyword search and meaning-based search together, so you catch matches either method alone would miss.",
  bm25:
    "A refined keyword-ranking algorithm, used alongside semantic search in hybrid search.",
  hallucination:
    "When an AI confidently states something false or made up, instead of admitting it doesn't know.",
  guardrail:
    "A safety check that makes the AI refuse to answer rather than guess, when it isn't confident enough in what it found.",
  shortTermMemory:
    'How much recent conversation an AI can "see" at once. Older messages get pushed out of view and are effectively forgotten.',
  longTermMemory:
    "Information saved outside the current conversation, which the AI can look up later — even in a brand new session.",
  agent:
    "An AI system that can take actions — like using tools or talking to other AI agents — not just answer questions.",
  toolCalling:
    "When an AI decides to use an external tool (like a lookup or calculator) instead of guessing the answer itself.",
  mcp:
    "Model Context Protocol: a standard way for AI models to connect to outside tools and data sources.",
  multiAgent:
    "Multiple AI agents working together, each with a different role, like a small team.",
  blackboard:
    "A shared notebook that multiple AI agents read from and write to, letting them collaborate without talking to each other directly.",
  negotiationProtocol:
    "A back-and-forth exchange of offers between two parties (here, two AI agents) until they reach an agreement.",
} as const;

export type GlossaryKey = keyof typeof GLOSSARY;
