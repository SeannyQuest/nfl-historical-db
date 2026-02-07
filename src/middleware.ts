import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow auth API routes, login, signup, forgot/reset password without authentication
  if (
    pathname.startsWith("/api/auth") ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname.startsWith("/api/stripe/webhook")
  ) {
    return NextResponse.next();
  }

  // Check JWT token directly (no Prisma import needed)
  const secret = process.env.AUTH_SECRET || "kR3vX9mP2wQ7nL5jF8hT4bY6cA1dE0gS3iU7oW2xZ";
  const token = await getToken({ req, secret });

  if (!token) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
