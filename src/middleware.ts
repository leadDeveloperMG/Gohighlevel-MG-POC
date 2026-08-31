import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

const PUBLIC_PREFIXES = [
  "/login",
  "/register",
  "/f/",
  "/book/",
  "/s/",
  "/c/",
  "/r/",
  "/api/auth",
  "/api/webhooks",
  "/api/cron",
  "/api/forms",
  "/api/public",
];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isPublic =
    PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico";

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);
  requestHeaders.set("x-request-host", req.headers.get("host") || "");

  if (isPublic) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  if (!req.auth?.user && pathname !== "/") {
    const login = new URL("/login", req.nextUrl.origin);
    login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
