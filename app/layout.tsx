import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";

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
        <SessionProviderWrapper>
          <Navbar />
          <main className="max-w-6xl mx-auto px-6 py-10">{children}</main>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
