import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireAuth();
  if (!user) return response!;

  try {
    const { id } = await params;
    
    // Only allow users to request roles for themselves
    if (user.id !== id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.user.update({
      where: { id },
      data: { roleRequest: true }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to request role" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireAuth();
  if (!user) return response!;

  try {
    const { id } = await params;
    
    if (user.id !== id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { status, name } = await request.json();

    const updateData: any = {};
    if (status) updateData.status = status;
    if (name) updateData.name = name;

    if (Object.keys(updateData).length > 0) {
      await prisma.user.update({
        where: { id },
        data: updateData
      });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}
