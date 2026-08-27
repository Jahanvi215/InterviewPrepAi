import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import InterviewSession from "@/lib/models/InterviewSession";
import Link from "next/link";

interface SessionDoc {
  _id: string;
  jobDescription: string;
  questions: { id: string }[];
  feedbacks: { score: number }[];
  summary?: {
    overallScore: number;
    readinessLevel: string;
  };
  createdAt: string;
}

async function getSessions(userId: string): Promise<SessionDoc[]> {
  await connectDB();
  const sessions = await InterviewSession.find({ userId })
    .sort({ createdAt: -1 })
    .select("jobDescription questions feedbacks summary createdAt")
    .lean();
  return sessions.map((s) => ({
    ...s,
    _id: s._id.toString(),
    createdAt: s.createdAt.toISOString(),
  })) as SessionDoc[];
}

const readinessColors: Record<string, string> = {
  "Interview Ready": "text-green-400 bg-green-500/10 border-green-500/20",
  "Almost There": "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  "Needs Practice": "text-orange-400 bg-orange-500/10 border-orange-500/20",
  "Not Ready": "text-red-400 bg-red-500/10 border-red-500/20",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const sessions = await getSessions(session.user.id!);

  const totalSessions = sessions.length;
  const avgScore =
    totalSessions > 0
      ? sessions
          .filter((s) => s.summary?.overallScore)
          .reduce((sum, s) => sum + (s.summary?.overallScore ?? 0), 0) /
        Math.max(sessions.filter((s) => s.summary?.overallScore).length, 1)
      : 0;

  const bestScore =
    totalSessions > 0
      ? Math.max(...sessions.map((s) => s.summary?.overallScore ?? 0))
      : 0;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white">
          Welcome back, {session.user.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-white/40 mt-1">Track your interview progress and keep improving.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {[
          { label: "Sessions Completed", value: totalSessions, suffix: "" },
          { label: "Average Score", value: avgScore.toFixed(1), suffix: "/10" },
          { label: "Best Score", value: bestScore.toFixed(1), suffix: "/10" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white/3 border border-white/8 rounded-2xl p-6">
            <p className="text-white/40 text-sm">{stat.label}</p>
            <p className="text-3xl font-bold text-white mt-1">
              {stat.value}
              <span className="text-lg text-white/30">{stat.suffix}</span>
            </p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white">Recent Sessions</h2>
        <Link
          href="/"
          className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          + New Mock Interview
        </Link>
      </div>

      {/* Sessions list */}
      {sessions.length === 0 ? (
        <div className="bg-white/3 border border-white/8 rounded-2xl p-12 text-center">
          <div className="text-4xl mb-4">🎯</div>
          <h3 className="text-white font-semibold mb-2">No sessions yet</h3>
          <p className="text-white/40 text-sm mb-6">
            Start your first mock interview to see your progress here.
          </p>
          <Link
            href="/"
            className="px-6 py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold rounded-xl transition-colors text-sm"
          >
            Start Mock Interview
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((s) => {
            const jdPreview = s.jobDescription.slice(0, 100).replace(/\n/g, " ");
            const date = new Date(s.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });
            const scoreColor =
              (s.summary?.overallScore ?? 0) >= 8
                ? "text-green-400"
                : (s.summary?.overallScore ?? 0) >= 5
                ? "text-yellow-400"
                : "text-red-400";
            const rl = s.summary?.readinessLevel ?? "Needs Practice";
            const badge = readinessColors[rl] ?? readinessColors["Needs Practice"];

            return (
              <div
                key={s._id}
                className="bg-white/3 border border-white/8 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4"
              >
                {/* Score circle */}
                <div className="shrink-0 w-14 h-14 rounded-2xl bg-white/5 flex flex-col items-center justify-center">
                  <span className={`text-xl font-bold ${scoreColor}`}>
                    {s.summary?.overallScore?.toFixed(1) ?? "—"}
                  </span>
                  <span className="text-white/25 text-xs">/10</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white/70 text-sm truncate">{jdPreview}…</p>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <span className="text-white/30 text-xs">{date}</span>
                    <span className="text-white/30 text-xs">
                      {s.questions.length} questions · {s.feedbacks.length} answered
                    </span>
                    {s.summary?.readinessLevel && (
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${badge}`}>
                        {rl}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
