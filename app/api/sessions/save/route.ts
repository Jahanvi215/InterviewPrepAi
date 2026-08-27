import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import InterviewSession from "@/lib/models/InterviewSession";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { jobDescription, parsedResume, questions, answers, feedbacks, summary } = body;

    await connectDB();

    const doc = await InterviewSession.create({
      userId: session.user.id,
      jobDescription,
      parsedResume,
      questions,
      answers,
      feedbacks,
      summary,
    });

    return NextResponse.json({ sessionId: doc._id.toString() }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Save session error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
