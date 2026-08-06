import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireAuth();
  if (!user) return response!;

  try {
    const { id } = await params;
    const dbUser = await prisma.user.findUnique({
      where: { id },
      select: { role: true, roleRequest: true }
    });
    
    return NextResponse.json({ user: dbUser });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}
