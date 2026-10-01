import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Learning Curriculum",
  description: "Interactive demos for RAG, embeddings, agent memory, and multi-agent systems",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 min-h-screen">{children}</body>
    </html>
  );
}
