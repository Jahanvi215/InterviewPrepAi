import { NextRequest, NextResponse } from "next/server";
import openai, { MODEL } from "@/lib/openai";
import { Feedback, Question } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { question, answer, jobDescription } = await req.json() as {
      question: Question;
      answer: string;
      jobDescription: string;
    };

    if (!question || !answer) {
      return NextResponse.json(
        { error: "Question and answer are required." },
        { status: 400 }
      );
    }

    const prompt = `You are a senior interviewer evaluating a candidate's interview answer. Be honest, constructive, and specific.

JOB CONTEXT: ${jobDescription}

QUESTION (${question.type}, ${question.difficulty}):
${question.question}

CANDIDATE'S ANSWER:
${answer}

Evaluate the answer and return a JSON object with exactly this structure:
{
  "questionId": "${question.id}",
  "score": <integer 0-10>,
  "strengths": ["specific things the candidate did well in their answer"],
  "improvements": ["specific things missing or that could be better"],
  "modelAnswer": "A comprehensive model answer that would score 9-10, written in first person as if the candidate is speaking",
  "verdict": "<one of: strong, good, needs-work>"
}

Scoring guide:
- 9-10: Excellent, thorough, with examples
- 7-8: Good, covers main points, minor gaps
- 5-6: Adequate but missing key elements
- 3-4: Partial, significant gaps
- 0-2: Off-topic or very weak

verdict rules:
- "strong" for score >= 8
- "good" for score 5-7
- "needs-work" for score <= 4

Only return valid JSON, no markdown, no extra text.`;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });

    const content = response.choices[0].message.content || "{}";
    const feedback: Feedback = JSON.parse(content);

    return NextResponse.json({ feedback });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Evaluate answer error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
