import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Routes that do NOT require authentication.
 * Everything else is protected by default (deny-by-default).
 */
const PUBLIC_ROUTES = ["/login", "/signup", "/landing-page"];

const ADMIN_ONLY = ["/cards", "/add-card", "/donations", "/redemption", "/admin"];

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

  // Validate the JWT signature locally (recommended by Supabase docs over getUser for middleware)
  const { data: claims, error } = await supabase.auth.getClaims();

  const pathname = request.nextUrl.pathname;

  // Allow public routes through without auth
  const isPublic =
    pathname === "/" ||
    PUBLIC_ROUTES.some((r) => pathname.startsWith(r));

  if (isPublic) return supabaseResponse;

  // Everything else requires authentication
  if (error || !claims) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // To do role checks, you'd typically check a profiles table or JWT claim.
  // We'll skip strict admin enforcement in middleware for now unless user metadata has it.
  const isAdminOnly = ADMIN_ONLY.some((r) => pathname.startsWith(r));
  const userRole = claims.claims?.user_metadata?.role;
  if (isAdminOnly && userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", request.nextUrl));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static image files
     * This ensures ALL routes (pages + API) run through the middleware.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};