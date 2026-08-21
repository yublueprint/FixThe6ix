import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";
import { logAudit } from "@/lib/audit-log";
import { createClient } from '@supabase/supabase-js';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireAuth();
  if (!user) return response!;

  try {
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    
    if (dbUser?.role !== "ADMIN" && dbUser?.role !== "SUPER_ADMIN" && dbUser?.role !== "YUBLUEPRINT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    // Fetch target user to verify permissions
    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Admins cannot edit other Admins, Super Admins, or YUBlueprint users
    if (dbUser.role === "ADMIN" && (targetUser.role === "ADMIN" || targetUser.role === "SUPER_ADMIN" || targetUser.role === "YUBLUEPRINT")) {
      return NextResponse.json({ error: "Forbidden: Admins cannot edit other Admins" }, { status: 403 });
    }

    const { role, email, name, image } = await request.json();

    // Admins cannot grant ADMIN, SUPER_ADMIN, or YUBLUEPRINT roles
    if (dbUser.role === "ADMIN" && role && (role === "ADMIN" || role === "SUPER_ADMIN" || role === "YUBLUEPRINT")) {
      return NextResponse.json({ error: "Forbidden: Admins cannot grant elevated roles" }, { status: 403 });
    }

    const dataToUpdate: any = {};
    if (role) {
      dataToUpdate.role = role;
      dataToUpdate.roleRequest = false;
    }
    if (email) {
      dataToUpdate.email = email;
    }
    if (name !== undefined) {
      dataToUpdate.name = name;
    }
    if (image !== undefined) {
      dataToUpdate.image = image;
    }

    // Update in Prisma
    await prisma.user.update({
      where: { id },
      data: dataToUpdate
    });

    if (email) {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      await supabaseAdmin.auth.admin.updateUserById(id, { email });
    }

    if (role || name !== undefined || image !== undefined) {
      let metaUpdates: any = {};
      if (role) metaUpdates.role = role;
      if (name !== undefined) metaUpdates.full_name = name;
      if (image !== undefined) metaUpdates.avatar_url = image;

      await prisma.$executeRaw`
        UPDATE auth.users 
        SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || ${metaUpdates}::jsonb
        WHERE id = ${id}::uuid
      `;
    }

    // Audit log
    logAudit({
      action: "UPDATE",
      entityType: "USER",
      entityId: id,
      performedBy: user.id,
      performedByName: user.user_metadata?.full_name || user.email || null,
      details: {
        targetUserName: targetUser.name || targetUser.email,
        before: { role: targetUser.role, name: targetUser.name, email: targetUser.email },
        after: dataToUpdate,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireAuth();
  if (!user) return response!;

  try {
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (dbUser?.role !== "SUPER_ADMIN" && dbUser?.role !== "YUBLUEPRINT") {
      return NextResponse.json({ error: "Forbidden: Only Super Admins and YUBlueprint can delete users" }, { status: 403 });
    }

    const { id } = await params;

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete from Supabase Auth (this will cascade or we can manually delete from Prisma if no cascade is set)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    await supabaseAdmin.auth.admin.deleteUser(id);

    // Delete from Prisma (in case trigger or cascade doesn't cover it)
    await prisma.user.delete({ where: { id } }).catch(() => {});

    // Audit log
    logAudit({
      action: "DELETE",
      entityType: "USER",
      entityId: id,
      performedBy: user.id,
      performedByName: user.user_metadata?.full_name || user.email || null,
      details: {
        deletedUserName: targetUser.name || targetUser.email,
        deletedUserRole: targetUser.role,
        deletedUserEmail: targetUser.email,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete user" }, { status: 500 });
  }
}
