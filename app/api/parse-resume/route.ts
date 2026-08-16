import { NextRequest, NextResponse } from "next/server";
import openai, { MODEL } from "@/lib/openai";
import { ParsedResume } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const resumeText = formData.get("resumeText") as string;
    const jobDescription = formData.get("jobDescription") as string;

    if (!resumeText || !jobDescription) {
      return NextResponse.json(
        { error: "Resume text and job description are required." },
        { status: 400 }
      );
    }

    const prompt = `You are an expert HR analyst and technical recruiter. Analyze the following resume against the job description.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

Return a JSON object with exactly this structure:
{
  "skills": ["list of candidate's technical and soft skills found in resume"],
  "experience": ["list of key experience points from resume"],
  "education": ["list of education details"],
  "summary": "2-3 sentence professional summary of the candidate",
  "gaps": ["list of skills/requirements in the JD that the candidate is missing or weak in"]
}

Only return valid JSON, no markdown, no extra text.`;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });

    const content = response.choices[0].message.content || "{}";
    const parsed: ParsedResume = JSON.parse(content);

    return NextResponse.json({ parsedResume: parsed });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Parse resume error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
