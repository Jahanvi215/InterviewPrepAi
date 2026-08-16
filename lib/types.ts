export interface ParsedResume {
  skills: string[];
  experience: string[];
  education: string[];
  summary: string;
  gaps: string[];
}

export interface Question {
  id: string;
  type: "technical" | "behavioral" | "system-design";
  question: string;
  difficulty: "easy" | "medium" | "hard";
  hint?: string;
}

export interface Answer {
  questionId: string;
  answer: string;
}

export interface Feedback {
  questionId: string;
  score: number; // 0-10
  strengths: string[];
  improvements: string[];
  modelAnswer: string;
  verdict: "strong" | "good" | "needs-work";
}

export interface SessionData {
  id: string;
  resumeText: string;
  jobDescription: string;
  parsedResume: ParsedResume;
  questions: Question[];
  answers: Answer[];
  feedbacks: Feedback[];
  createdAt: string;
}

export interface SessionSummary {
  overallScore: number;
  readinessLevel: "Not Ready" | "Needs Practice" | "Almost There" | "Interview Ready";
  strongAreas: string[];
  weakAreas: string[];
  recommendation: string;
}
