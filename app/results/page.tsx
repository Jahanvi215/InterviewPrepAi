"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SessionData, SessionSummary, Feedback, Question } from "@/lib/types";
import FeedbackCard from "@/components/FeedbackCard";

export default function ResultsPage() {
  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"summary" | "details">("summary");

  useEffect(() => {
    const raw = sessionStorage.getItem("interviewSession");
    if (!raw) {
      router.push("/");
      return;
    }
    const data: SessionData = JSON.parse(raw);
    setSession(data);
    generateSummary(data);
  }, [router]);

  const generateSummary = async (data: SessionData, isRetry = false) => {
    setLoading(true);
    if (isRetry) setError("");

    // If rate limited, wait 5s before retrying
    if (isRetry) {
      await new Promise((res) => setTimeout(res, 5000));
    }

    try {
      const res = await fetch("/api/session-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feedbacks: data.feedbacks,
          questions: data.questions,
          jobDescription: data.jobDescription,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Summary failed");
      setSummary(result.summary);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const readinessConfig = {
    "Interview Ready": {
      color: "text-green-400",
      bg: "bg-green-500/10 border-green-500/20",
      emoji: "🚀",
    },
    "Almost There": {
      color: "text-yellow-400",
      bg: "bg-yellow-500/10 border-yellow-500/20",
      emoji: "💪",
    },
    "Needs Practice": {
      color: "text-orange-400",
      bg: "bg-orange-500/10 border-orange-500/20",
      emoji: "📚",
    },
    "Not Ready": {
      color: "text-red-400",
      bg: "bg-red-500/10 border-red-500/20",
      emoji: "🔧",
    },
  };

  if (!session) return null;

  const rc = summary
    ? readinessConfig[summary.readinessLevel] || readinessConfig["Needs Practice"]
    : null;

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-white mb-2">Interview Complete</h1>
        <p className="text-white/40">
          You answered {session.feedbacks?.length || 0} of {session.questions?.length || 0} questions
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-white/3 border border-white/8 rounded-2xl p-10 flex flex-col items-center gap-4 mb-8">
          <svg className="animate-spin w-10 h-10 text-indigo-400" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <p className="text-white/50">Generating your performance report...</p>
          <p className="text-white/25 text-xs">This may take up to 30s on the free tier</p>
        </div>
      )}

      {error && (
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-5 mb-8">
          <p className="text-orange-300 text-sm mb-3">⚠ {error}</p>
          <button
            onClick={() => session && generateSummary(session, true)}
            className="px-5 py-2 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 text-orange-300 text-sm font-medium rounded-lg transition-colors"
          >
            Retry — Generate Report
          </button>
        </div>
      )}

      {/* Summary card */}
      {summary && rc && (
        <div className={`border rounded-2xl p-8 mb-8 ${rc.bg}`}>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="text-6xl">{rc.emoji}</div>
            <div className="flex-1 text-center sm:text-left">
              <p className={`text-sm font-medium uppercase tracking-wider mb-1 ${rc.color}`}>
                Readiness Level
              </p>
              <h2 className={`text-3xl font-bold ${rc.color} mb-1`}>
                {summary.readinessLevel}
              </h2>
              <p className="text-white/50 text-sm">{summary.recommendation}</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-white">{summary.overallScore}</div>
              <div className="text-white/40 text-sm">out of 10</div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      {summary && (
        <>
          <div className="flex gap-1 bg-white/3 border border-white/8 rounded-xl p-1 mb-6">
            <button
              onClick={() => setActiveTab("summary")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "summary"
                  ? "bg-indigo-500 text-white"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              Summary
            </button>
            <button
              onClick={() => setActiveTab("details")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "details"
                  ? "bg-indigo-500 text-white"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              Question Details
            </button>
          </div>

          {activeTab === "summary" && (
            <div className="space-y-6 animate-fade-in">
              {/* Score per question type */}
              <div className="bg-white/3 border border-white/8 rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">
                  Score per question
                </h3>
                <div className="space-y-3">
                  {session.feedbacks?.map((f: Feedback, i: number) => {
                    const q: Question | undefined = session.questions?.find(
                      (q: Question) => q.id === f.questionId
                    );
                    const scoreColor =
                      f.score >= 8
                        ? "bg-green-500"
                        : f.score >= 5
                        ? "bg-yellow-500"
                        : "bg-red-500";
                    return (
                      <div key={f.questionId} className="flex items-center gap-4">
                        <span className="text-xs text-white/30 w-4">{i + 1}</span>
                        <div className="flex-1">
                          <p className="text-sm text-white/60 truncate">
                            {q?.question?.substring(0, 60)}...
                          </p>
                          <div className="h-1.5 bg-white/5 rounded-full mt-1.5 overflow-hidden">
                            <div
                              className={`h-full ${scoreColor} rounded-full`}
                              style={{ width: `${(f.score / 10) * 100}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-sm font-bold text-white w-8 text-right">
                          {f.score}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Strong vs Weak areas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-green-500/5 border border-green-500/15 rounded-2xl p-5">
                  <h3 className="text-sm font-semibold text-green-400 mb-3">Strong Areas</h3>
                  <ul className="space-y-2">
                    {summary.strongAreas.map((a, i) => (
                      <li key={i} className="flex gap-2 text-sm text-white/60">
                        <span className="text-green-500 shrink-0">✓</span>
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-red-500/5 border border-red-500/15 rounded-2xl p-5">
                  <h3 className="text-sm font-semibold text-red-400 mb-3">Weak Areas</h3>
                  <ul className="space-y-2">
                    {summary.weakAreas.map((a, i) => (
                      <li key={i} className="flex gap-2 text-sm text-white/60">
                        <span className="text-red-400 shrink-0">→</span>
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === "details" && (
            <div className="space-y-6 animate-fade-in">
              {session.feedbacks?.map((f: Feedback) => (
                <div key={f.questionId}>
                  <div className="mb-3 bg-white/3 border border-white/8 rounded-xl px-5 py-4">
                    <p className="text-sm font-medium text-white/80">
                      {session.questions?.find((q: Question) => q.id === f.questionId)?.question}
                    </p>
                  </div>
                  <FeedbackCard feedback={f} />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Try again */}
      <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={() => {
            sessionStorage.removeItem("interviewSession");
            router.push("/");
          }}
          className="px-8 py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold rounded-xl transition-colors"
        >
          Start a New Session
        </button>
        <button
          onClick={() => router.push("/interview")}
          className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white font-medium rounded-xl transition-colors border border-white/8"
        >
          Review Session
        </button>
      </div>
    </div>
  );
}
