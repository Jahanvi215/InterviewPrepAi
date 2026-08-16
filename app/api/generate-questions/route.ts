import { NextRequest, NextResponse } from "next/server";
import openai, { MODEL } from "@/lib/openai";
import { Question, ParsedResume } from "@/lib/types";

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
JOB DESCRIPTION: ${jobDescription}

Generate a mix:
- 3 technical questions (based on required skills from JD and candidate's tech stack)
- 3 behavioral questions (relevant to the role and seniority level)
- 2 system design / scenario questions (appropriate for the role)

Return a JSON array with exactly 8 objects, each with this structure:
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
difficulty must be one of: "easy", "medium", "hard"

Only return valid JSON array, no markdown, no extra text.`;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const content = response.choices[0].message.content || "[]";
    const questions: Question[] = JSON.parse(content);

    return NextResponse.json({ questions });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Generate questions error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
