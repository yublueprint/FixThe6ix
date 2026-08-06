import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";

/**
 * PATCH /api/gift-cards/[id]
 * Updates a gift card's store, balances, or status.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireAuth();
  if (!user) return response!;

  try {
    const { id } = await params;
    const body = await request.json();
    const { storeName, initialAmount, remainingAmount } = body;

    const existing = await prisma.giftCard.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Gift card not found" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};

    if (storeName !== undefined) {
      let store = await prisma.store.findUnique({
        where: { name: storeName.trim() },
      });
      if (!store) {
        store = await prisma.store.create({
          data: { name: storeName.trim(), category: "OTHER" },
        });
      }
      data.storeId = store.id;
    }

    if (initialAmount !== undefined) {
      const amt = Number(Number(initialAmount).toFixed(2));
      if (isNaN(amt) || amt < 0) {
        return NextResponse.json({ error: "Invalid initialAmount" }, { status: 400 });
      }
      data.initialAmount = amt;
    }

    if (remainingAmount !== undefined) {
      const amt = Number(Number(remainingAmount).toFixed(2));
      if (isNaN(amt) || amt < 0) {
        return NextResponse.json({ error: "Invalid remainingAmount" }, { status: 400 });
      }
      data.remainingAmount = amt;

      // Auto-update status based on remaining amount
      if (amt === 0) {
        data.status = "FULLY_REDEEMED";
      } else if (
        amt <
        Number(data.initialAmount ?? existing.initialAmount)
      ) {
        data.status = "PARTIALLY_REDEEMED";
      } else {
        data.status = "ACTIVE";
      }
    }

    const updated = await prisma.giftCard.update({
      where: { id },
      data,
      include: { store: true, transactions: true },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error("Error updating gift card:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/gift-cards/[id]
 * Deletes a gift card and all its transactions.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireAuth();
  if (!user) return response!;

  try {
    const { id } = await params;

    const existing = await prisma.giftCard.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Gift card not found" }, { status: 404 });
    }

    // Delete transactions first (FK constraint)
    await prisma.transaction.deleteMany({ where: { giftCardId: id } });
    await prisma.giftCard.delete({ where: { id } });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting gift card:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
