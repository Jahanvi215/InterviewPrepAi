import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import InterviewSession from "@/lib/models/InterviewSession";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const sessions = await InterviewSession.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .select("jobDescription questions feedbacks summary createdAt")
      .lean();

    return NextResponse.json({ sessions });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
