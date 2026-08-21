import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";
import { createClient } from "@supabase/supabase-js";

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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireAuth();
  if (!user) return response!;

  try {
    const { id } = await params;

    // Users can only upload their own avatar unless they are Super Admin / YUBlueprint
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    const isSuperOrYU = dbUser?.role === "SUPER_ADMIN" || dbUser?.role === "YUBLUEPRINT";
    if (user.id !== id && !isSuperOrYU) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${id}-${Date.now()}.${ext}`;

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Ensure avatars bucket exists and is public
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    if (!buckets?.some(b => b.name === "avatars")) {
      await supabaseAdmin.storage.createBucket("avatars", { public: true });
    }

    const { error: uploadError } = await supabaseAdmin.storage
      .from("avatars")
      .upload(fileName, buffer, {
        contentType: file.type || "image/jpeg",
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from("avatars")
      .getPublicUrl(fileName);

    const avatarUrl = publicUrlData.publicUrl;

    // Update in Prisma
    await prisma.user.update({
      where: { id },
      data: { image: avatarUrl },
    }).catch(() => {});

    // Update Supabase Auth metadata
    await supabaseAdmin.auth.admin.updateUserById(id, {
      user_metadata: { avatar_url: avatarUrl }
    });

    return NextResponse.json({ success: true, avatarUrl });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 });
  }
}

