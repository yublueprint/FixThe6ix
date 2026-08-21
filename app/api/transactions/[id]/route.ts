import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";
import { logAudit } from "@/lib/audit-log";

/**
 * DELETE /api/transactions/[id]
 * Deletes a transaction, restores the balance to the associated gift card, and logs an audit entry.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireAuth();
  if (!user) return response!;

  try {
    const { id } = await params;
    const tx = await prisma.transaction.findUnique({
      where: { id },
      include: { giftCard: { include: { store: true } } },
    });

    if (!tx) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    // Restore gift card balance
    if (tx.giftCard) {
      const restoredRemaining = Number(
        (Number(tx.giftCard.remainingAmount) + Number(tx.amount)).toFixed(2)
      );
      const initialAmt = Number(tx.giftCard.initialAmount);
      const newStatus = restoredRemaining >= initialAmt ? "ACTIVE" : "PARTIALLY_REDEEMED";

      await prisma.giftCard.update({
        where: { id: tx.giftCardId },
        data: {
          remainingAmount: restoredRemaining,
          status: newStatus,
        },
      });
    }

    await prisma.transaction.delete({ where: { id } });

    // Audit log
    logAudit({
      action: "DELETE",
      entityType: "TRANSACTION",
      entityId: id,
      performedBy: user.id,
      performedByName: user.user_metadata?.full_name || user.email || null,
      details: {
        type: tx.type,
        amount: Number(tx.amount),
        storeName: tx.giftCard?.store?.name,
        lastFourDigits: tx.giftCard?.lastFourDigits,
        volunteerName: tx.volunteerName,
        recipientName: tx.recipientName,
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
