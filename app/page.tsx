"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ParsedResume } from "@/lib/types";

export default function HomePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"idle" | "parsing" | "generating">("idle");
  const [dragOver, setDragOver] = useState(false);

  // ── File validation ──────────────────────────────────────────────
  const validateAndSetFile = (file: File) => {
    const allowed = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"];
    const ext = file.name.toLowerCase();
    if (!allowed.includes(file.type) && !ext.endsWith(".pdf") && !ext.endsWith(".docx") && !ext.endsWith(".txt")) {
      setError("Unsupported file type. Please upload a PDF, DOCX, or TXT file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File too large. Maximum size is 5MB.");
      return;
    }
    setError("");
    setResumeFile(file);
  };

  // ── Drag & drop handlers ─────────────────────────────────────────
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndSetFile(file);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndSetFile(file);
  };

  // ── File size display ────────────────────────────────────────────
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const fileIcon = (name: string) => {
    if (name.endsWith(".pdf")) return "📄";
    if (name.endsWith(".docx")) return "📝";
    return "📃";
  };

  // ── Submit ───────────────────────────────────────────────────────
  const handleStart = async () => {
    if (!resumeFile) {
      setError("Please upload your resume first.");
      return;
    }
    if (!jobDescription.trim()) {
      setError("Please paste the job description.");
      return;
    }
    setError("");
    setLoading(true);
    setStep("parsing");

    try {
      // Step 1: Upload file + parse resume
      const formData = new FormData();
      formData.append("resumeFile", resumeFile);
      formData.append("jobDescription", jobDescription);

      const parseRes = await fetch("/api/parse-resume", {
        method: "POST",
        body: formData,
      });
      const parseData = await parseRes.json();
      if (!parseRes.ok) throw new Error(parseData.error || "Failed to parse resume");

      const parsedResume: ParsedResume = parseData.parsedResume;
      const resumeText: string = parseData.resumeText;

      // Step 2: Generate questions
      setStep("generating");
      const questionsRes = await fetch("/api/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parsedResume, jobDescription }),
      });
      const questionsData = await questionsRes.json();
      if (!questionsRes.ok) throw new Error(questionsData.error || "Failed to generate questions");

      // Store session in sessionStorage
      sessionStorage.setItem(
        "interviewSession",
        JSON.stringify({
          resumeText,
          jobDescription,
          parsedResume,
          questions: questionsData.questions,
          answers: [],
          feedbacks: [],
        })
      );

      router.push("/interview");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
      setStep("idle");
    }
  };

  return (
    <div className="animate-fade-in">

      {/* ── Hero ──────────────────────────────────────────────────── */}
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
          Upload your resume and a job description. Get tailored questions, answer
          them, and receive detailed AI feedback — just like a real interview.
        </p>
      </div>

      {/* ── Steps ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
        {[
          { step: "01", title: "Upload your resume", desc: "PDF, DOCX, or TXT — up to 5 MB" },
          { step: "02", title: "Add the job description", desc: "Paste the JD for your target role" },
          { step: "03", title: "Get personalised prep", desc: "AI generates questions and scores your answers" },
        ].map((item) => (
          <div key={item.step} className="bg-white/3 border border-white/8 rounded-xl p-5 flex gap-4">
            <span className="text-indigo-400 font-mono text-sm font-bold mt-0.5">{item.step}</span>
            <div>
              <p className="text-white font-medium text-sm">{item.title}</p>
              <p className="text-white/40 text-sm mt-0.5">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Upload + JD grid ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* Resume upload */}
        <div className="bg-white/3 border border-white/8 rounded-2xl p-6 flex flex-col">
          <label className="block text-sm font-medium text-white/70 mb-3">
            Your Resume
            <span className="text-white/30 font-normal ml-2">PDF · DOCX · TXT</span>
          </label>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
            className="hidden"
            onChange={handleFileInput}
          />

          {resumeFile ? (
            /* ── File selected state ── */
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <div className="w-full bg-indigo-500/8 border border-indigo-500/20 rounded-xl p-5 flex items-center gap-4">
                <span className="text-3xl">{fileIcon(resumeFile.name)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate">{resumeFile.name}</p>
                  <p className="text-white/40 text-xs mt-0.5">{formatSize(resumeFile.size)}</p>
                </div>
                <button
                  onClick={() => { setResumeFile(null); setError(""); }}
                  className="text-white/30 hover:text-red-400 transition-colors text-lg leading-none"
                  title="Remove file"
                >
                  ✕
                </button>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Change file
              </button>
            </div>
          ) : (
            /* ── Drop zone ── */
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex-1 flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 min-h-52 px-6
                ${dragOver
                  ? "border-indigo-400 bg-indigo-500/10"
                  : "border-white/10 hover:border-indigo-500/40 hover:bg-white/2"
                }`}
            >
              {/* Upload icon */}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${dragOver ? "bg-indigo-500/20" : "bg-white/5"}`}>
                <svg className={`w-6 h-6 ${dragOver ? "text-indigo-300" : "text-white/30"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              </div>

              <div className="text-center">
                <p className="text-white/60 text-sm font-medium">
                  {dragOver ? "Drop it here" : "Drag & drop your resume"}
                </p>
                <p className="text-white/30 text-xs mt-1">or click to browse</p>
              </div>

              <div className="flex items-center gap-2 mt-1">
                {["PDF", "DOCX", "TXT"].map((fmt) => (
                  <span key={fmt} className="px-2 py-0.5 bg-white/5 border border-white/8 rounded text-xs text-white/30 font-mono">
                    {fmt}
                  </span>
                ))}
                <span className="text-white/20 text-xs">· max 5 MB</span>
              </div>
            </div>
          )}
        </div>

        {/* Job description */}
        <div className="bg-white/3 border border-white/8 rounded-2xl p-6 flex flex-col">
          <label className="block text-sm font-medium text-white/70 mb-3">
            Job Description
            <span className="text-white/30 font-normal ml-2">(from the job posting)</span>
          </label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the full job description here...

Include requirements, responsibilities, and preferred qualifications."
            className="flex-1 min-h-52 bg-transparent text-white/80 placeholder-white/20 text-sm resize-none outline-none leading-relaxed"
          />
          <div className="mt-3 flex justify-between items-center text-xs text-white/30">
            <span>More detail = better questions</span>
            <span>{jobDescription.length} chars</span>
          </div>
        </div>
      </div>

      {/* ── Error ─────────────────────────────────────────────────── */}
      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-300 text-sm flex items-start gap-3">
          <span className="mt-0.5">⚠</span>
          <span>{error}</span>
        </div>
      )}

      {/* ── CTA ───────────────────────────────────────────────────── */}
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
              {step === "parsing" ? "Reading your resume..." : "Generating questions..."}
            </span>
          ) : (
            "Start Mock Interview →"
          )}
        </button>
      </div>

      <p className="text-center text-white/20 text-xs mt-8">
        Your data stays in your browser session and is never stored on our servers.
      </p>
    </div>
  );
}
