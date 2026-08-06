import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Verifies that the current request is from an authenticated user.
 * Call at the top of every API route handler.
 *
 * Returns the authenticated user object, or a 401 JSON response if not authenticated.
 */
export async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      user: null,
      response: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  return { user, response: null };
}
