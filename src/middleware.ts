import { NextResponse } from "next/server";

// Auth temporarily disabled — site is publicly accessible
// TODO: Re-enable auth once signup/login flow is verified
export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
