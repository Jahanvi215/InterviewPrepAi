"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Question, Feedback, SessionData } from "@/lib/types";
import FeedbackCard from "@/components/FeedbackCard";

type UIState = "answering" | "evaluating" | "reviewed";

export default function InterviewPage() {
  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [uiState, setUiState] = useState<UIState>("answering");
  const [currentFeedback, setCurrentFeedback] = useState<Feedback | null>(null);
  const [allFeedbacks, setAllFeedbacks] = useState<Feedback[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const raw = sessionStorage.getItem("interviewSession");
    if (!raw) {
      router.push("/");
      return;
    }
    const data: SessionData = JSON.parse(raw);
    setSession(data);
    // Restore progress — clamp to last unanswered question
    if (data.feedbacks && data.feedbacks.length > 0) {
      setAllFeedbacks(data.feedbacks);
      const nextIndex = Math.min(data.feedbacks.length, (data.questions?.length || 1) - 1);
      setCurrentIndex(nextIndex);
    }
  }, [router]);

  if (!session) return null;

  const questions: Question[] = session.questions || [];

  // If all questions already answered (e.g. came from "Review Session"), go to results
  if (questions.length > 0 && currentIndex >= questions.length) {
    router.push("/results");
    return null;
  }

  const currentQuestion = questions[currentIndex];

  // Guard: questions not loaded yet
  if (!currentQuestion) return null;

  const progress = (currentIndex / questions.length) * 100;
  const isLastQuestion = currentIndex === questions.length - 1;

  const handleSubmitAnswer = async () => {
    if (!answer.trim()) {
      setError("Please write an answer before submitting.");
      return;
    }
    setError("");
    setUiState("evaluating");

    try {
      const res = await fetch("/api/evaluate-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: currentQuestion,
          answer,
          jobDescription: session.jobDescription,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Evaluation failed");

      const feedback: Feedback = data.feedback;
      setCurrentFeedback(feedback);
      const updated = [...allFeedbacks, feedback];
      setAllFeedbacks(updated);

      // Persist progress
      const updatedSession = {
        ...session,
        feedbacks: updated,
        answers: [...(session.answers || []), { questionId: currentQuestion.id, answer }],
      };
      sessionStorage.setItem("interviewSession", JSON.stringify(updatedSession));
      setSession(updatedSession);

      setUiState("reviewed");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      setUiState("answering");
    }
  };

  const handleNext = () => {
    if (isLastQuestion) {
      router.push("/results");
    } else {
      setCurrentIndex((i) => i + 1);
      setAnswer("");
      setCurrentFeedback(null);
      setUiState("answering");
      setShowHint(false);
      setError("");
    }
  };

  const typeBadgeColor: Record<string, string> = {
    technical: "bg-blue-500/15 text-blue-300 border-blue-500/20",
    behavioral: "bg-purple-500/15 text-purple-300 border-purple-500/20",
    "system-design": "bg-orange-500/15 text-orange-300 border-orange-500/20",
  };

  const badgeClass = typeBadgeColor[currentQuestion.type] ?? "bg-white/10 text-white/50 border-white/10";

  const difficultyColor = {
    easy: "text-green-400",
    medium: "text-yellow-400",
    hard: "text-red-400",
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      {/* Progress header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-white/50">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span className="text-sm text-white/50">
            {allFeedbacks.length} answered
          </span>
        </div>
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="bg-white/3 border border-white/8 rounded-2xl p-7 mb-6">
        <div className="flex items-center gap-3 mb-5">
          <span
            className={`text-xs font-medium px-3 py-1 rounded-full border ${badgeClass}`}
          >
            {currentQuestion.type?.replace("-", " ") ?? "general"}
          </span>
          <span className={`text-xs font-mono ${difficultyColor[currentQuestion.difficulty] ?? "text-white/40"}`}>
            {currentQuestion.difficulty}
          </span>
        </div>

        <h2 className="text-xl font-semibold text-white leading-relaxed mb-5">
          {currentQuestion.question}
        </h2>

        {currentQuestion.hint && uiState === "answering" && (
          <div className="mt-4">
            {showHint ? (
              <div className="bg-indigo-500/8 border border-indigo-500/15 rounded-xl p-4 text-sm text-indigo-300">
                <span className="font-medium">Hint:</span> {currentQuestion.hint}
              </div>
            ) : (
              <button
                onClick={() => setShowHint(true)}
                className="text-xs text-white/30 hover:text-indigo-400 transition-colors"
              >
                Show hint →
              </button>
            )}
          </div>
        )}
      </div>

      {/* Answer area */}
      {uiState !== "reviewed" && (
        <div className="bg-white/3 border border-white/8 rounded-2xl p-6 mb-6">
          <label className="block text-sm text-white/50 mb-3">Your answer</label>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={uiState === "evaluating"}
            placeholder="Type your answer here. Be as detailed as you would in a real interview. Use the STAR method for behavioral questions."
            className="w-full h-48 bg-transparent text-white/80 placeholder-white/20 text-sm resize-none outline-none leading-relaxed disabled:opacity-50"
          />
          <div className="mt-3 flex justify-between items-center">
            <span className="text-xs text-white/25">{answer.length} chars</span>
            {error && (
              <span className="text-xs text-red-400">{error}</span>
            )}
          </div>
        </div>
      )}

      {/* Feedback */}
      {uiState === "reviewed" && currentFeedback && (
        <FeedbackCard feedback={currentFeedback} />
      )}

      {/* Evaluating state */}
      {uiState === "evaluating" && (
        <div className="bg-white/3 border border-white/8 rounded-2xl p-8 mb-6 flex flex-col items-center gap-3">
          <svg className="animate-spin w-8 h-8 text-indigo-400" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <p className="text-white/50 text-sm">Evaluating your answer...</p>
        </div>
      )}

      {/* Action button */}
      <div className="flex justify-end">
        {uiState === "answering" && (
          <button
            onClick={handleSubmitAnswer}
            className="px-8 py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold rounded-xl transition-colors"
          >
            Submit Answer
          </button>
        )}
        {uiState === "reviewed" && (
          <button
            onClick={handleNext}
            className="px-8 py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold rounded-xl transition-colors"
          >
            {isLastQuestion ? "View Results →" : "Next Question →"}
          </button>
        )}
      </div>
    </div>
  );
}
