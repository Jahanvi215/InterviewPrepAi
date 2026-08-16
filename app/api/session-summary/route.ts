import { NextRequest, NextResponse } from "next/server";
import openai, { MODEL } from "@/lib/openai";
import { Feedback, Question, SessionSummary } from "@/lib/types";

// Retry helper with exponential backoff for rate limit errors
async function callWithRetry(fn: () => Promise<SessionSummary>, retries = 3): Promise<SessionSummary> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";
      const is429 = message.includes("429") || message.toLowerCase().includes("rate limit");

      if (is429 && attempt < retries) {
        // Wait 2s, 4s, 8s before retrying
        const delay = Math.pow(2, attempt + 1) * 1000;
        console.log(`Rate limited. Retrying in ${delay / 1000}s... (attempt ${attempt + 1}/${retries})`);
        await new Promise((res) => setTimeout(res, delay));
        continue;
      }
      throw err;
    }
  }
  throw new Error("Max retries exceeded");
}

export async function POST(req: NextRequest) {
  try {
    const { feedbacks, questions, jobDescription } = await req.json() as {
      feedbacks: Feedback[];
      questions: Question[];
      jobDescription: string;
    };

    if (!feedbacks || feedbacks.length === 0) {
      return NextResponse.json(
        { error: "Feedbacks are required." },
        { status: 400 }
      );
    }

    const avgScore =
      feedbacks.reduce((sum, f) => sum + f.score, 0) / feedbacks.length;

    const questionSummary = feedbacks.map((f) => {
      const q = questions.find((q) => q.id === f.questionId);
      return `[${q?.type || "unknown"}] Score: ${f.score}/10 - ${q?.question?.substring(0, 80)}...`;
    });

    const prompt = `You are a career coach reviewing a mock interview session. Provide an overall assessment.

JOB CONTEXT: ${jobDescription}

AVERAGE SCORE: ${avgScore.toFixed(1)}/10

QUESTION BREAKDOWN:
${questionSummary.join("\n")}

INDIVIDUAL STRENGTHS:
${feedbacks.flatMap((f) => f.strengths).join("\n")}

INDIVIDUAL IMPROVEMENTS NEEDED:
${feedbacks.flatMap((f) => f.improvements).join("\n")}

Return a JSON object with exactly this structure:
{
  "overallScore": <number, average score rounded to 1 decimal>,
  "readinessLevel": "<one of: Not Ready, Needs Practice, Almost There, Interview Ready>",
  "strongAreas": ["3-4 specific strong areas based on the session"],
  "weakAreas": ["3-4 specific weak areas that need improvement"],
  "recommendation": "2-3 sentences of personalized advice for this candidate targeting this role"
}

Readiness level guide:
- "Interview Ready": avgScore >= 8
- "Almost There": avgScore >= 6.5
- "Needs Practice": avgScore >= 5
- "Not Ready": avgScore < 5

Only return valid JSON, no markdown, no extra text.`;

    const summary = await callWithRetry(async () => {
      const response = await openai.chat.completions.create({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
      });

      const content = response.choices[0].message.content || "{}";
      // Strip markdown code fences if model wraps JSON in them
      const cleaned = content.replace(/^```[a-z]*\n?/i, "").replace(/```$/,"").trim();
      return JSON.parse(cleaned) as SessionSummary;
    });

    return NextResponse.json({ summary });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Session summary error:", message);

    const is429 = message.includes("429") || message.toLowerCase().includes("rate limit");
    return NextResponse.json(
      { error: is429 ? "Rate limit reached. Please wait 30 seconds and try again." : message },
      { status: is429 ? 429 : 500 }
    );
  }
}
