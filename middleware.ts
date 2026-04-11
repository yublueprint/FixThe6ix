import NextAuth from "next-auth";
import authConfig from "@/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

const ADMIN_ONLY = ["/cards", "/add-card", "/donations", "/redemption"];
const PROTECTED  = ["/dashboard", "/cards", "/add-card", "/donations", "/redemption"];

export default auth((req) => {
  const pathname = req.nextUrl.pathname;
  const session  = req.auth;

  const isProtected = PROTECTED.some((r) => pathname.startsWith(r));
  if (!isProtected) return NextResponse.next();

  if (!session) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  const isAdminOnly = ADMIN_ONLY.some((r) => pathname.startsWith(r));
  if (isAdminOnly && session.user?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/cards/:path*",
    "/add-card/:path*",
    "/donations/:path*",
    "/redemption/:path*",
  ],
};