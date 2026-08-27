import { auth } from "@/auth";
import { NextResponse } from "next/server";

const protectedRoutes = ["/interview", "/results", "/dashboard"];
const authRoutes = ["/sign-in", "/sign-up"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  const isProtected = protectedRoutes.some((r) => pathname.startsWith(r));
  const isAuthRoute = authRoutes.some((r) => pathname.startsWith(r));

  // Redirect unauthenticated users away from protected pages
  if (isProtected && !isLoggedIn) {
    return NextResponse.redirect(new URL("/sign-in", req.nextUrl));
  }

  // Redirect already logged-in users away from auth pages
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
