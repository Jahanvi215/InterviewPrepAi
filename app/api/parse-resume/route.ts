import { NextRequest, NextResponse } from "next/server";
import openai, { MODEL } from "@/lib/openai";
import { ParsedResume } from "@/lib/types";
import mammoth from "mammoth";

// Extract text from PDF using unpdf — no workers, no canvas, serverless-safe
async function extractPdfText(buffer: Buffer): Promise<string> {
  const { extractText } = await import("unpdf");
  const uint8Array = new Uint8Array(buffer);
  const { text } = await extractText(uint8Array, { mergePages: true });
  return text;
}

// Dispatch to the right extractor based on file type
async function extractTextFromFile(
  buffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<string> {
  const lower = fileName.toLowerCase();

  if (mimeType === "application/pdf" || lower.endsWith(".pdf")) {
    return extractPdfText(buffer);
  }

  if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    lower.endsWith(".docx")
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  // Plain text / TXT
  return buffer.toString("utf-8");
}

async function callWithRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "";
      const isRateLimited = message.includes("429") || message.toLowerCase().includes("rate limit");
      if (!isRateLimited || attempt === retries) throw error;

      const delay = Math.pow(2, attempt + 1) * 1000;
      console.log(`Rate limited on parse-resume. Retrying in ${delay / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error("Max retries exceeded");
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const jobDescription = formData.get("jobDescription") as string;

    if (!jobDescription?.trim()) {
      return NextResponse.json(
        { error: "Job description is required." },
        { status: 400 }
      );
    }

    let resumeText = "";
    const resumeFile = formData.get("resumeFile") as File | null;
    const resumeTextRaw = formData.get("resumeText") as string | null;

    if (resumeFile && resumeFile.size > 0) {
      const allowedTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
      ];
      const allowedExtensions = [".pdf", ".docx", ".txt"];
      const ext = resumeFile.name
        .toLowerCase()
        .slice(resumeFile.name.lastIndexOf("."));

      if (
        !allowedTypes.includes(resumeFile.type) &&
        !allowedExtensions.includes(ext)
      ) {
        return NextResponse.json(
          { error: "Unsupported file. Please upload PDF, DOCX, or TXT." },
          { status: 400 }
        );
      }

      if (resumeFile.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: "File too large. Maximum 5MB." },
          { status: 400 }
        );
      }

      const arrayBuffer = await resumeFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      console.log("Extracting text from file:", resumeFile.name, resumeFile.type, buffer.length, "bytes");
      resumeText = await extractTextFromFile(
        buffer,
        resumeFile.type,
        resumeFile.name
      );
      console.log("Extracted text length:", resumeText.length);
    } else if (resumeTextRaw?.trim()) {
      resumeText = resumeTextRaw;
    }

    if (!resumeText.trim()) {
      return NextResponse.json(
        {
          error:
            "Could not extract text from resume. Try a different file or paste text directly.",
        },
        { status: 400 }
      );
    }

    const prompt = `You are an expert HR analyst and technical recruiter. Analyze the following resume against the job description.

RESUME:
${resumeText.slice(0, 6000)}

JOB DESCRIPTION:
${jobDescription.slice(0, 3000)}

Return a JSON object with exactly this structure:
{
  "skills": ["list of candidate's technical and soft skills found in resume"],
  "experience": ["list of key experience points from resume"],
  "education": ["list of education details"],
  "summary": "2-3 sentence professional summary of the candidate",
  "gaps": ["list of skills/requirements in the JD that the candidate is missing or weak in"]
}

Only return valid JSON, no markdown, no extra text.`;

    const parsed = await callWithRetry(async () => {
      const response = await openai.chat.completions.create({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
      });

      const content = response.choices[0].message.content || "{}";
      const cleaned = content
        .replace(/^```[a-z]*\n?/i, "")
        .replace(/```$/, "")
        .trim();
      return JSON.parse(cleaned) as ParsedResume;
    });

    return NextResponse.json({ parsedResume: parsed, resumeText });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const stack = error instanceof Error ? error.stack?.split("\n").slice(0,3).join(" | ") : "";
    console.error("Parse resume error:", message, stack);
    const isRateLimited = message.includes("429") || message.toLowerCase().includes("rate limit");
    return NextResponse.json(
      { error: isRateLimited ? "AI provider rate limit reached. Please wait a moment and try again." : message },
      { status: isRateLimited ? 429 : 500 }
    );
  }
}
