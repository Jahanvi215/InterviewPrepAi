import mongoose, { Schema, Document, Model, Types } from "mongoose";

interface IFeedback {
  questionId: string;
  score: number;
  strengths: string[];
  improvements: string[];
  modelAnswer: string;
  verdict: "strong" | "good" | "needs-work";
}

interface IQuestion {
  id: string;
  type: "technical" | "behavioral" | "system-design";
  question: string;
  difficulty: "easy" | "medium" | "hard";
  hint?: string;
}

interface IAnswer {
  questionId: string;
  answer: string;
}

interface ISessionSummary {
  overallScore: number;
  readinessLevel: "Not Ready" | "Needs Practice" | "Almost There" | "Interview Ready";
  strongAreas: string[];
  weakAreas: string[];
  recommendation: string;
}

export interface IInterviewSession extends Document {
  userId: Types.ObjectId;
  jobDescription: string;
  parsedResume: {
    skills: string[];
    experience: string[];
    education: string[];
    summary: string;
    gaps: string[];
  };
  questions: IQuestion[];
  answers: IAnswer[];
  feedbacks: IFeedback[];
  summary?: ISessionSummary;
  createdAt: Date;
}

const FeedbackSchema = new Schema<IFeedback>({
  questionId: String,
  score: Number,
  strengths: [String],
  improvements: [String],
  modelAnswer: String,
  verdict: { type: String, enum: ["strong", "good", "needs-work"] },
});

const QuestionSchema = new Schema<IQuestion>({
  id: String,
  type: { type: String, enum: ["technical", "behavioral", "system-design"] },
  question: String,
  difficulty: { type: String, enum: ["easy", "medium", "hard"] },
  hint: String,
});

const AnswerSchema = new Schema<IAnswer>({
  questionId: String,
  answer: String,
});

const SummarySchema = new Schema<ISessionSummary>({
  overallScore: Number,
  readinessLevel: String,
  strongAreas: [String],
  weakAreas: [String],
  recommendation: String,
});

const InterviewSessionSchema = new Schema<IInterviewSession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    jobDescription: { type: String, required: true },
    parsedResume: {
      skills: [String],
      experience: [String],
      education: [String],
      summary: String,
      gaps: [String],
    },
    questions: [QuestionSchema],
    answers: [AnswerSchema],
    feedbacks: [FeedbackSchema],
    summary: SummarySchema,
  },
  { timestamps: true }
);

const InterviewSession: Model<IInterviewSession> =
  mongoose.models.InterviewSession ??
  mongoose.model<IInterviewSession>("InterviewSession", InterviewSessionSchema);

export default InterviewSession;
