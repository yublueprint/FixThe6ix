import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";
import { logAudit } from "@/lib/audit-log";
import { GiftCardStatus } from "@prisma/client";

type ImportRow = {
  vendor: string;
  last4: string;
  remaining: number;
  redeemed: number | null;
  delivered_to: string | null;
  delivery_date: string | null;
  status: string;
  errors?: string[];
  rowNumber?: number;
};

export async function POST(request: Request) {
  const { user, response } = await requireAuth();
  if (!user) return response!;

  try {
    const body = await request.json();

    if (!body?.fileName || !Array.isArray(body.rows)) {
      return NextResponse.json(
        { error: "Invalid request body. Expected fileName and rows." },
        { status: 400 }
      );
    }

    const rows: ImportRow[] = body.rows;
    if (!rows.length) {
      return NextResponse.json({ error: "No rows provided." }, { status: 400 });
    }

    const performerName = user.user_metadata?.full_name || user.email || "Bulk Import";

    // 1. Build store map — auto-create any vendor that doesn't exist yet
    const uniqueVendors = Array.from(
      new Set(rows.map((r) => r.vendor.trim()).filter(Boolean))
    );

    const storeMap = new Map<string, string>();
    const createdStores: string[] = [];
    const existingStores: string[] = [];

    for (const vendor of uniqueVendors) {
      const existing = await prisma.store.findFirst({
        where: { name: { equals: vendor, mode: "insensitive" } },
        select: { id: true, name: true },
      });

      if (existing) {
        storeMap.set(vendor.toLowerCase(), existing.id);
        existingStores.push(vendor);
      } else {
        const created = await prisma.store.create({
          data: { name: vendor, category: "OTHER" },
          select: { id: true, name: true },
        });
        storeMap.set(vendor.toLowerCase(), created.id);
        createdStores.push(vendor);

        // Log Store Creation in Audit Log
        logAudit({
          action: "CREATE",
          entityType: "STORE",
          entityId: created.id,
          performedBy: user.id,
          performedByName: performerName,
          details: {
            name: vendor,
            category: "OTHER",
            source: "CSV Bulk Import",
          },
        });
      }
    }

    // 2. Insert or update all non-error rows into GiftCard
    const importableRows = rows.filter((r) => r.status !== "error");
    let inserted = 0;
    let updated = 0;

    for (const row of importableRows) {
      const storeId = storeMap.get(row.vendor.trim().toLowerCase());
      if (!storeId) continue;

      const remaining = typeof row.remaining === "number" ? row.remaining : parseFloat(String(row.remaining)) || 0;
      const redeemed = row.redeemed != null ? (typeof row.redeemed === "number" ? row.redeemed : parseFloat(String(row.redeemed)) || 0) : 0;
      const initial = remaining + redeemed;

      const existing = await prisma.giftCard.findFirst({
        where: { storeId, lastFourDigits: row.last4 },
      });

      if (existing) {
        const card = await prisma.giftCard.update({
          where: { id: existing.id },
          data: {
            remainingAmount: remaining,
            initialAmount: initial > 0 ? initial : existing.initialAmount,
            status: remaining <= 0 ? GiftCardStatus.FULLY_REDEEMED : GiftCardStatus.ACTIVE,
          },
        });
        updated++;

        // Log to Gift Card Activity Audit Log
        logAudit({
          action: "UPDATE",
          entityType: "GIFT_CARD",
          entityId: card.id,
          performedBy: user.id,
          performedByName: performerName,
          details: {
            storeName: row.vendor,
            lastFourDigits: row.last4,
            initialAmount: card.initialAmount,
            remainingAmount: card.remainingAmount,
            source: "CSV Bulk Import",
            fileName: body.fileName,
          },
        });
      } else {
        const card = await prisma.giftCard.create({
          data: {
            storeId,
            lastFourDigits: row.last4,
            initialAmount: initial > 0 ? initial : remaining,
            remainingAmount: remaining,
            status: remaining <= 0 ? GiftCardStatus.FULLY_REDEEMED : GiftCardStatus.ACTIVE,
            addedBy: performerName,
            createdAt: row.delivery_date ? new Date(row.delivery_date) : new Date(),
          },
        });
        inserted++;

        // Log to Gift Card Activity Audit Log
        logAudit({
          action: "CREATE",
          entityType: "GIFT_CARD",
          entityId: card.id,
          performedBy: user.id,
          performedByName: performerName,
          details: {
            storeName: row.vendor,
            lastFourDigits: row.last4,
            initialAmount: card.initialAmount,
            remainingAmount: card.remainingAmount,
            source: "CSV Bulk Import",
            fileName: body.fileName,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      inserted,
      updated,
      createdStores,
      existingStores,
      missingStores: [],
    });
  } catch (error: any) {
    console.error("/api/import-cards error", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
