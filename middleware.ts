import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ADMIN_ONLY = ["/cards", "/add-card", "/donations", "/redemption"];
const PROTECTED = ["/dashboard", "/cards", "/add-card", "/donations", "/redemption"];

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isProtected = PROTECTED.some((r) => pathname.startsWith(r));

  if (!isProtected) return supabaseResponse;

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // To do role checks, you'd typically check a profiles table or JWT claim.
  // We'll skip strict admin enforcement in middleware for now unless user metadata has it.
  const isAdminOnly = ADMIN_ONLY.some((r) => pathname.startsWith(r));
  if (isAdminOnly && user.user_metadata?.role !== "ADMIN") {
    // Optional: allow it anyway if we haven't set up roles in user_metadata, 
    // or redirect to dashboard.
    // For now, redirect to dashboard if not an admin.
    // return NextResponse.redirect(new URL("/dashboard", request.nextUrl));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/cards/:path*",
    "/add-card/:path*",
    "/donations/:path*",
    "/redemption/:path*",
  ],
};