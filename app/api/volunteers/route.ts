import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";
import { randomUUID } from "crypto";

/**
 * GET /api/volunteers
 * Returns all users with role VOLUNTEER.
 */
export async function GET() {
  const { user, response } = await requireAuth();
  if (!user) return response!;

  try {
    const users = await prisma.user.findMany({
      where: { role: "VOLUNTEER" },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    });

    const volunteers = users.map((u: any) => ({
      id: u.id,
      name: u.name || u.email || "Unknown",
      email: u.email
    }));

    return NextResponse.json(volunteers, { status: 200 });
  } catch (error) {
    console.error("Error fetching volunteers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/volunteers
 * Creates a name-only volunteer (no Supabase auth account).
 * Body: { name: string }
 */
export async function POST(request: Request) {
  const { user, response } = await requireAuth();
  if (!user) return response!;

  try {
    const { name } = await request.json();

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const volunteer = await prisma.user.create({
      data: {
        id: randomUUID(),
        name: name.trim(),
        email: null,
        role: "VOLUNTEER",
        status: "ACTIVE",
      },
      select: { id: true, name: true, email: true },
    });

    return NextResponse.json(volunteer, { status: 201 });
  } catch (error) {
    console.error("Error creating volunteer:", error);
    return NextResponse.json(
      { error: "Failed to create volunteer" },
      { status: 500 }
    );
  }
}
