import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma, GiftCardStatus, TransactionType } from "@prisma/client";

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

    // Debug: log what we received
    console.log("[import-cards] received rows:", rows.length);
    console.log("[import-cards] row statuses:", rows.map(r => ({ vendor: r.vendor, last4: r.last4, status: r.status, remaining: r.remaining, redeemed: r.redeemed })));

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
        console.log("[import-cards] created store:", vendor);
      }
    }

    console.log("[import-cards] storeMap:", Object.fromEntries(storeMap));

    // 2. Create import batch record
    const batch = await prisma.importBatch.create({
      data: {
        fileName: body.fileName,
        status: "completed",
        rowCount: rows.length,
        successCount: rows.filter((r) => r.status !== "error").length,
        errorCount: rows.filter((r) => r.status === "error").length,
        errorSummary:
          rows
            .filter((r) => r.status === "error")
            .map((r) => `row ${r.rowNumber}: ${r.errors?.join(", ")}`)
            .join("; ") || null,
        metadata: {
          source: "bulk csv import",
          uploadedAt: new Date().toISOString(),
        },
      },
    });

    // 3. Stage all rows
    const stagingData = rows.map((row, index) => {
      const storeKey = row.vendor.trim().toLowerCase();
      const storeId = storeMap.get(storeKey) ?? null;

      return {
        batchId: batch.id,
        rawStore: row.vendor,
        rawLast4: row.last4,
        rawAmount: String(row.remaining),
        rawNotes: null as string | null,
        rawAddedBy: null as string | null,
        rawDateAdded: row.delivery_date || null,
        rowNumber: row.rowNumber ?? index + 1,
        status: row.status || "pending",
        validationErrors: row.status === "error"
          ? (row.errors ?? []) as Prisma.InputJsonValue
          : Prisma.JsonNull,
        resolvedStoreId: storeId,
        resolvedLast4: storeId ? row.last4 : null,
        resolvedAmount: storeId ? row.remaining : null,
        resolvedDateAdded:
          storeId && row.delivery_date
            ? new Date(row.delivery_date)
            : null,
      };
    });

    await prisma.importStaging.createMany({ data: stagingData });

    // 4. Insert all non-error rows into GiftCard (valid + duplicate)
    // We treat "duplicate" as a DB-level check — let Prisma decide
    const importableRows = rows.filter((r) => r.status !== "error");
    console.log("[import-cards] importable rows:", importableRows.length);

    let inserted = 0;
    let skipped = 0;
    const insertedCards: { id: string; storeId: string; lastFourDigits: string }[] = [];

    for (const row of importableRows) {
      const storeId = storeMap.get(row.vendor.trim().toLowerCase());
      if (!storeId) {
        console.log("[import-cards] no storeId for vendor:", row.vendor);
        continue;
      }

      // Ensure remaining is a proper number
      const remaining = typeof row.remaining === "number" ? row.remaining : parseFloat(String(row.remaining)) || 0;
      const redeemed = row.redeemed != null ? (typeof row.redeemed === "number" ? row.redeemed : parseFloat(String(row.redeemed)) || 0) : null;

      // Upsert card — update if exists, create if not
      const existing = await prisma.giftCard.findFirst({
        where: { storeId, lastFourDigits: row.last4 },
      });

      let card;
      if (existing) {
        card = await prisma.giftCard.update({
          where: { id: existing.id },
          data: {
            remainingAmount: remaining,
            initialAmount: remaining + (redeemed ?? 0),
            status: GiftCardStatus.ACTIVE,
          },
        });
        console.log("[import-cards] updated existing card:", card.id, row.vendor, row.last4);
        skipped++;
      } else {
        card = await prisma.giftCard.create({
          data: {
            storeId,
            lastFourDigits: row.last4,
            initialAmount: remaining + (redeemed ?? 0),
            remainingAmount: remaining,
            status: GiftCardStatus.ACTIVE,
            notes: null,
          },
        });
        console.log("[import-cards] inserted new card:", card.id, row.vendor, row.last4);
        inserted++;
      }

      insertedCards.push({ id: card.id, storeId, lastFourDigits: row.last4 });
    }

    // 5. Insert transactions for cards with redeemed amount or delivered_to
    let transactionCount = 0;

    for (const card of insertedCards) {
      const originalRow = importableRows.find(
        (r) =>
          storeMap.get(r.vendor.trim().toLowerCase()) === card.storeId &&
          r.last4 === card.lastFourDigits
      );

      if (!originalRow) continue;

      const redeemed = originalRow.redeemed != null
        ? (typeof originalRow.redeemed === "number" ? originalRow.redeemed : parseFloat(String(originalRow.redeemed)) || 0)
        : null;

      if (!redeemed && !originalRow.delivered_to) continue;

      await prisma.transaction.create({
        data: {
          giftCardId: card.id,
          amount: redeemed ?? 0,
          type: TransactionType.SPEND,
          recipientName: originalRow.delivered_to || null,
          volunteerName: null,
          createdAt: originalRow.delivery_date
            ? new Date(originalRow.delivery_date)
            : new Date(),
        },
      });

      transactionCount++;
    }

    console.log("[import-cards] done — inserted:", inserted, "skipped:", skipped, "transactions:", transactionCount);

    return NextResponse.json(
      {
        batchId: batch.id,
        inserted,
        skipped,
        staged: rows.length,
        transactions: transactionCount,
        createdStores,
        existingStores,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("/api/import-cards error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}