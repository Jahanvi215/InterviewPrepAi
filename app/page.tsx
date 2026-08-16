"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ParsedResume } from "@/lib/types";

export default function HomePage() {
  const router = useRouter();
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"idle" | "parsing" | "generating">("idle");

  const handleStart = async () => {
    if (!resumeText.trim() || !jobDescription.trim()) {
      setError("Please fill in both your resume and the job description.");
      return;
    }
    setError("");
    setLoading(true);
    setStep("parsing");

    try {
      // Step 1: Parse resume
      const formData = new FormData();
      formData.append("resumeText", resumeText);
      formData.append("jobDescription", jobDescription);

      const parseRes = await fetch("/api/parse-resume", {
        method: "POST",
        body: formData,
      });
      const parseData = await parseRes.json();

      if (!parseRes.ok) throw new Error(parseData.error || "Failed to parse resume");

      const parsedResume: ParsedResume = parseData.parsedResume;

      // Step 2: Generate questions
      setStep("generating");
      const questionsRes = await fetch("/api/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parsedResume, jobDescription }),
      });
      const questionsData = await questionsRes.json();

      if (!questionsRes.ok) throw new Error(questionsData.error || "Failed to generate questions");

      // Store session data in sessionStorage
      const sessionData = {
        resumeText,
        jobDescription,
        parsedResume,
        questions: questionsData.questions,
        answers: [],
        feedbacks: [],
      };
      sessionStorage.setItem("interviewSession", JSON.stringify(sessionData));

      router.push("/interview");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setLoading(false);
      setStep("idle");
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 text-indigo-300 text-sm mb-6">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          AI-Powered Interview Prep
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight">
          Land your next job with
          <br />
          <span className="text-indigo-400">personalized mock interviews</span>
        </h1>
        <p className="text-white/50 text-lg max-w-xl mx-auto">
          Paste your resume and a job description. Get tailored questions, answer
          them, and receive detailed AI feedback — just like a real interview.
        </p>
      </div>

      {/* How it works */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
        {[
          { step: "01", title: "Paste your resume", desc: "Copy and paste your resume text" },
          { step: "02", title: "Add the job description", desc: "Paste the JD for your target role" },
          { step: "03", title: "Get personalized prep", desc: "AI generates questions and scores your answers" },
        ].map((item) => (
          <div
            key={item.step}
            className="bg-white/3 border border-white/8 rounded-xl p-5 flex gap-4"
          >
            <span className="text-indigo-400 font-mono text-sm font-bold mt-0.5">
              {item.step}
            </span>
            <div>
              <p className="text-white font-medium text-sm">{item.title}</p>
              <p className="text-white/40 text-sm mt-0.5">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Input form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Resume input */}
        <div className="bg-white/3 border border-white/8 rounded-2xl p-6">
          <label className="block text-sm font-medium text-white/70 mb-3">
            Your Resume
            <span className="text-white/30 font-normal ml-2">(paste as plain text)</span>
          </label>
          <textarea
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Paste your full resume here...

Name, contact info, skills, experience, education — everything."
            className="w-full h-72 bg-transparent text-white/80 placeholder-white/20 text-sm resize-none outline-none leading-relaxed"
          />
          <div className="mt-3 flex justify-between items-center text-xs text-white/30">
            <span>Plain text works best</span>
            <span>{resumeText.length} chars</span>
          </div>
        </div>

        {/* JD input */}
        <div className="bg-white/3 border border-white/8 rounded-2xl p-6">
          <label className="block text-sm font-medium text-white/70 mb-3">
            Job Description
            <span className="text-white/30 font-normal ml-2">(from the job posting)</span>
          </label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the full job description here...

Include requirements, responsibilities, and preferred qualifications."
            className="w-full h-72 bg-transparent text-white/80 placeholder-white/20 text-sm resize-none outline-none leading-relaxed"
          />
          <div className="mt-3 flex justify-between items-center text-xs text-white/30">
            <span>More detail = better questions</span>
            <span>{jobDescription.length} chars</span>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-300 text-sm flex items-start gap-3">
          <span className="mt-0.5">⚠</span>
          <span>{error}</span>
        </div>
      )}

      {/* CTA */}
      <div className="flex justify-center">
        <button
          onClick={handleStart}
          disabled={loading}
          className="relative px-10 py-4 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 text-base glow-pulse"
        >
          {loading ? (
            <span className="flex items-center gap-3">
              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              {step === "parsing" ? "Analyzing your resume..." : "Generating questions..."}
            </span>
          ) : (
            "Start Mock Interview →"
          )}
        </button>
      </div>

      {/* Footer note */}
      <p className="text-center text-white/20 text-xs mt-8">
        Your data stays in your browser session and is never stored on our servers.
      </p>
    </div>
  );
}
