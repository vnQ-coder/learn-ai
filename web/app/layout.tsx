import "./globals.css";
import type { Metadata } from "next";
import { NavBar } from "@/components/NavBar";

export const metadata: Metadata = {
  title: "Learn AI — Interactive Curriculum",
  description: "Interactive demos for RAG, embeddings, agent memory, and multi-agent systems",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="text-neutral-100 min-h-screen">
        <NavBar />
        {children}
      </body>
    </html>
  );
}
