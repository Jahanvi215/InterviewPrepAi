"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/sign-in" })}
      className="text-sm text-white/40 hover:text-red-400 transition-colors"
      title="Sign out"
    >
      Sign out
    </button>
  );
}
