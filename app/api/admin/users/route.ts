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
    
    // Fetch avatars from Supabase Auth
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    const usersWithAvatars = users.map((u: any) => {
      const authUser = authData?.users.find((au: any) => au.email === u.email);
      return {
        ...u,
        avatarUrl: authUser?.user_metadata?.avatar_url || null
      };
    });
    
    return NextResponse.json({ users: usersWithAvatars, currentUserRole: dbUser.role });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
