import { NextRequest, NextResponse } from "next/server";
import openai, { MODEL } from "@/lib/openai";
import { Question, ParsedResume } from "@/lib/types";

// Strip markdown code fences and extract JSON array from AI response
function extractJsonArray(raw: string): string {
  // Remove ```json ... ``` or ``` ... ``` wrappers
  let cleaned = raw.replace(/^```[a-z]*\n?/im, "").replace(/```\s*$/m, "").trim();

  // Some models wrap in a JSON object like { "questions": [...] }
  const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
  if (arrayMatch) cleaned = arrayMatch[0];

  return cleaned;
}

// Retry with backoff on 429
async function callWithRetry(fn: () => Promise<Question[]>, retries = 3): Promise<Question[]> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      const is429 = msg.includes("429") || msg.toLowerCase().includes("rate limit");
      if (is429 && attempt < retries) {
        const delay = Math.pow(2, attempt + 1) * 1000;
        console.log(`Rate limited on generate-questions. Retrying in ${delay / 1000}s...`);
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
    const { parsedResume, jobDescription } = await req.json() as {
      parsedResume: ParsedResume;
      jobDescription: string;
    };

    if (!parsedResume || !jobDescription) {
      return NextResponse.json(
        { error: "Parsed resume and job description are required." },
        { status: 400 }
      );
    }

    const prompt = `You are an expert technical interviewer. Based on the candidate's profile and job description, generate 8 interview questions.

CANDIDATE SKILLS: ${parsedResume.skills.join(", ")}
CANDIDATE EXPERIENCE: ${parsedResume.experience.join("; ")}
CANDIDATE GAPS: ${parsedResume.gaps.join(", ")}
JOB DESCRIPTION: ${jobDescription.slice(0, 2000)}

Generate a mix:
- 3 technical questions (based on required skills from JD and candidate's tech stack)
- 3 behavioral questions (relevant to the role and seniority level)
- 2 system design / scenario questions (appropriate for the role)

Return ONLY a raw JSON array with exactly 8 objects. No markdown, no code fences, no explanation.
Each object must have exactly these fields:
[
  {
    "id": "q1",
    "type": "technical",
    "question": "The actual interview question",
    "difficulty": "medium",
    "hint": "A subtle hint about what a good answer should cover (1 sentence)"
  }
]

type must be one of: "technical", "behavioral", "system-design"
difficulty must be one of: "easy", "medium", "hard"`;

    const questions = await callWithRetry(async () => {
      const response = await openai.chat.completions.create({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      });

      const raw = response.choices[0].message.content || "[]";
      console.log("generate-questions raw response (first 200):", raw.slice(0, 200));

      const cleaned = extractJsonArray(raw);
      const parsed: Question[] = JSON.parse(cleaned);

      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error("AI returned empty or invalid questions array");
      }

      return parsed;
    });

    return NextResponse.json({ questions });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Generate questions error:", message);
    const is429 = message.includes("429") || message.toLowerCase().includes("rate limit");
    return NextResponse.json(
      { error: is429 ? "Rate limit reached. Please wait a moment and try again." : message },
      { status: is429 ? 429 : 500 }
    );
  }
}
