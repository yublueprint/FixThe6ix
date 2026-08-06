import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";

export async function GET(request: Request) {
  const { user, response } = await requireAuth();
  if (!user) return response!;

  try {
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    
    // Strict admin check
    if (dbUser?.role !== "ADMIN" && dbUser?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      orderBy: [
        { roleRequest: 'desc' }, // Pending requests first
        { name: 'asc' }
      ]
    });
    
    return NextResponse.json({ users, currentUserRole: dbUser.role });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
