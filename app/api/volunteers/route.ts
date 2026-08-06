import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";

/**
 * GET /api/volunteers
 * Returns all users with role VOLUNTEER.
 */
export async function GET() {
  const { user, response } = await requireAuth();
  if (!user) return response!;

  try {
    const volunteers = await prisma.user.findMany({
      where: { role: "VOLUNTEER" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(volunteers, { status: 200 });
  } catch (error) {
    console.error("Error fetching volunteers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
