import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Interview Coach — Prep smarter, land faster",
  description:
    "Upload your resume, paste a job description, and get AI-powered interview questions with personalized feedback.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0f0f13] text-[#e8e8f0] antialiased">
        {/* Top nav */}
        <header className="border-b border-white/5 bg-[#0f0f13]/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2 group">
              <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center text-sm font-bold">
                AI
              </div>
              <span className="font-semibold tracking-tight text-white group-hover:text-indigo-300 transition-colors">
                Interview Coach
              </span>
            </a>
            <span className="text-xs text-white/30 hidden sm:block">
              Powered by GPT-4o
            </span>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-6 py-10">{children}</main>
      </body>
    </html>
  );
}
