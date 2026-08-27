import { auth } from "@/auth";
import Link from "next/link";
import SignOutButton from "./SignOutButton";

export default async function Navbar() {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="border-b border-white/5 bg-[#0f0f13]/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center text-sm font-bold">
            AI
          </div>
          <span className="font-semibold tracking-tight text-white group-hover:text-indigo-300 transition-colors">
            Interview Coach
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm text-white/50 hover:text-white transition-colors hidden sm:block"
              >
                Dashboard
              </Link>
              <Link
                href="/"
                className="text-sm text-white/50 hover:text-white transition-colors hidden sm:block"
              >
                New Interview
              </Link>
              {/* Avatar */}
              <div className="flex items-center gap-2 bg-white/5 border border-white/8 rounded-xl px-3 py-1.5">
                <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold text-white">
                  {user.name?.[0]?.toUpperCase() ?? "U"}
                </div>
                <span className="text-sm text-white/70 hidden sm:block max-w-24 truncate">
                  {user.name}
                </span>
              </div>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="text-sm text-white/50 hover:text-white transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="text-sm px-4 py-1.5 bg-indigo-500 hover:bg-indigo-400 text-white font-medium rounded-lg transition-colors"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
