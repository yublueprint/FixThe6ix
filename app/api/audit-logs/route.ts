import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";

/**
 * GET /api/audit-logs
 * Returns audit log entries with optional filters:
 * - entityType: GIFT_CARD | USER | STORE | TRANSACTION | IMPORT
 * - action: CREATE | UPDATE | DELETE
 * - search: text search in performedByName or details
 * - startDate / endDate: ISO date range filters
 *
 * USER entity logs are restricted to SUPER_ADMIN and YUBLUEPRINT roles.
 */
export async function GET(request: Request) {
  const { user, response } = await requireAuth();
  if (!user) return response!;

  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get("entityType");
    const action = searchParams.get("action");
    const search = searchParams.get("search");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Check role for USER entity access
    if (entityType === "USER") {
      const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
      if (dbUser?.role !== "SUPER_ADMIN" && dbUser?.role !== "YUBLUEPRINT") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const where: Record<string, unknown> = {};

    if (entityType) {
      where.entityType = entityType;
    }

    if (action) {
      where.action = action;
    }

    if (search) {
      where.OR = [
        { performedByName: { contains: search, mode: "insensitive" } },
        { entityId: { contains: search, mode: "insensitive" } },
      ];
    }

    if (startDate || endDate) {
      const createdAt: Record<string, Date> = {};
      if (startDate) createdAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        createdAt.lte = end;
      }
      where.createdAt = createdAt;
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    return NextResponse.json(logs, { status: 200 });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


export async function DELETE(request: Request) {
  const { user, response } = await requireAuth();
  if (!user) return response!;

  try {
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (dbUser?.role !== "SUPER_ADMIN" && dbUser?.role !== "YUBLUEPRINT" && dbUser?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const ids: string[] = body.ids || (body.id ? [body.id] : []);

    if (!ids || ids.length === 0) {
      return NextResponse.json({ error: "No record IDs provided" }, { status: 400 });
    }

    await prisma.auditLog.deleteMany({
      where: { id: { in: ids } },
    });

    return NextResponse.json({ success: true, count: ids.length });
  } catch (error: any) {
    console.error("Error deleting audit logs:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete audit log records" },
      { status: 500 }
    );
  }
}
