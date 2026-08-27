"use client";

import { useState } from "react";
import { Feedback } from "@/lib/types";

function formatModelAnswer(answer: string): Array<{ type: "heading" | "point"; text: string }> {
  const sections: Array<{ type: "heading" | "point"; text: string }> = [];

  answer
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const isBullet = /^[-*•]\s+/.test(line);
      const text = line.replace(/^[-*•]\s+/, "").trim();

      if (!isBullet && /:$/.test(text)) {
        sections.push({ type: "heading", text: text.slice(0, -1).trim() });
        return;
      }

      const points = isBullet ? [text] : text.split(/(?<=[.!?])\s+(?=[A-Z0-9])/);
      points.forEach((point) => {
        if (point.trim()) sections.push({ type: "point", text: point.trim() });
      });
    });

  return sections.length > 0 ? sections : [{ type: "point", text: answer }];
}

interface Props {
  feedback: Feedback;
}

export default function FeedbackCard({ feedback }: Props) {
  const [showModel, setShowModel] = useState(false);
  const modelAnswerSections = formatModelAnswer(feedback.modelAnswer || "No model answer available.");

  const verdictConfig = {
    strong: {
      label: "Strong Answer",
      color: "text-green-400",
      bg: "bg-green-500/10 border-green-500/20",
      icon: "✓",
    },
    good: {
      label: "Good Answer",
      color: "text-yellow-400",
      bg: "bg-yellow-500/10 border-yellow-500/20",
      icon: "~",
    },
    "needs-work": {
      label: "Needs Work",
      color: "text-red-400",
      bg: "bg-red-500/10 border-red-500/20",
      icon: "✗",
    },
  };

  const config = verdictConfig[feedback.verdict] || verdictConfig["good"];

  // Score bar width
  const scorePercent = (feedback.score / 10) * 100;
  const scoreColor =
    feedback.score >= 8
      ? "bg-green-500"
      : feedback.score >= 5
      ? "bg-yellow-500"
      : "bg-red-500";

  return (
    <div className="bg-white/3 border border-white/8 rounded-2xl p-6 mb-6 animate-fade-in">
      {/* Header row */}
      <div className="flex items-center justify-between mb-5">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${config.bg}`}>
          <span className={`font-bold ${config.color}`}>{config.icon}</span>
          <span className={`text-sm font-semibold ${config.color}`}>{config.label}</span>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-white">
            {feedback.score}
            <span className="text-base text-white/30">/10</span>
          </div>
        </div>
      </div>

      {/* Score bar */}
      <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-6">
        <div
          className={`h-full ${scoreColor} rounded-full transition-all duration-700`}
          style={{ width: `${scorePercent}%` }}
        />
      </div>

      {/* Strengths & Improvements */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        {/* Strengths */}
        <div>
          <h4 className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-2">
            What worked
          </h4>
          <ul className="space-y-1.5">
            {feedback.strengths.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm text-white/60">
                <span className="text-green-500 mt-0.5 shrink-0">+</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Improvements */}
        <div>
          <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">
            What to improve
          </h4>
          <ul className="space-y-1.5">
            {feedback.improvements.map((imp, i) => (
              <li key={i} className="flex gap-2 text-sm text-white/60">
                <span className="text-red-400 mt-0.5 shrink-0">→</span>
                <span>{imp}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Model answer toggle */}
      <button
        onClick={() => setShowModel((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-indigo-500/8 hover:bg-indigo-500/15 border border-indigo-500/15 rounded-xl text-sm text-indigo-300 transition-colors"
      >
        <span className="font-medium">
          {showModel ? "Hide model answer" : "Show model answer"}
        </span>
        <span className="text-indigo-400">{showModel ? "▲" : "▼"}</span>
      </button>

      {showModel && (
        <div className="mt-3 p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl">
          <div className="space-y-3">
            {modelAnswerSections.map((section, index) =>
              section.type === "heading" ? (
                <h5 key={`${section.text}-${index}`} className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                  {section.text}
                </h5>
              ) : (
                <div key={`${section.text}-${index}`} className="flex gap-3 text-sm text-white/70 leading-relaxed">
                  <span className="text-indigo-400 shrink-0">•</span>
                  <p>{section.text}</p>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
