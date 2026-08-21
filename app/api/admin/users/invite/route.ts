import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";
import { logAudit } from "@/lib/audit-log";
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  const { user, response } = await requireAuth();
  if (!user) return response!;

  try {
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (dbUser?.role !== "ADMIN" && dbUser?.role !== "SUPER_ADMIN" && dbUser?.role !== "YUBLUEPRINT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { email, role, name } = await request.json();

    if (!email || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (dbUser.role === "ADMIN" && (role === "ADMIN" || role === "SUPER_ADMIN" || role === "YUBLUEPRINT")) {
      return NextResponse.json({ error: "Forbidden: Admins can only invite Volunteers" }, { status: 403 });
    }

    const fullName = name || null;

    // Initialize Supabase Admin Client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Generate Invite Link via Supabase Auth Admin API (Bypasses email limits)
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'invite',
      email: email,
      options: {
        data: {
          role: role,
          status: "INVITED",
          full_name: fullName
        },
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://ft6-admin.vercel.app'}/signup`
      }
    });

    if (error) throw error;

    // Ensure user exists in Prisma, in case the trigger fails or is delayed
    if (data.user) {
      await prisma.user.upsert({
        where: { id: data.user.id },
        update: {
          role: role,
          status: "INVITED",
          email: email,
          name: fullName || null
        },
        create: {
          id: data.user.id,
          email: email,
          role: role,
          status: "INVITED",
          name: fullName || null
        }
      });
    }

    // Audit log
    logAudit({
      action: "CREATE",
      entityType: "USER",
      entityId: data.user?.id || null,
      performedBy: user.id,
      performedByName: user.user_metadata?.full_name || user.email || null,
      details: {
        invitedEmail: email,
        invitedName: fullName,
        assignedRole: role,
        method: "invite",
      },
    });

    return NextResponse.json({ 
      success: true, 
      user: data.user, 
      action_link: data.properties?.action_link 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to send invite" }, { status: 500 });
  }
}
