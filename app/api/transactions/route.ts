import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";
import { logAudit } from "@/lib/audit-log";

/**
 * GET /api/transactions
 * Returns transactions with optional filters: giftCardId, type (SPEND/DONATION_OUT), date range.
 */
export async function GET(request: Request) {
  const { user, response } = await requireAuth();
  if (!user) return response!;

  try {
    const { searchParams } = new URL(request.url);
    const giftCardId = searchParams.get("giftCardId");
    const type = searchParams.get("type");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: Record<string, unknown> = {};

    if (giftCardId) {
      where.giftCardId = giftCardId;
    }

    if (type) {
      where.type = type;
    }

    if (startDate || endDate) {
      const createdAt: Record<string, Date> = {};
      if (startDate) createdAt.gte = new Date(startDate);
      if (endDate) {
        // Include the full end date
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        createdAt.lte = end;
      }
      where.createdAt = createdAt;
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        giftCard: {
          include: {
            store: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(transactions, { status: 200 });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/transactions
 * Records a spend or donation transaction.
 * Body: { giftCardId, amount, type (SPEND | DONATION_OUT), volunteerName?, recipientName? }
 * Automatically updates the gift card's remainingAmount and status.
 */
export async function POST(request: Request) {
  const { user, response } = await requireAuth();
  if (!user) return response!;

  try {
    const body = await request.json();
    const { giftCardId, amount, type, volunteerName, recipientName, notes } = body;

    if (!giftCardId || !amount || !type) {
      return NextResponse.json(
        { error: "giftCardId, amount, and type are required" },
        { status: 400 }
      );
    }

    if (type !== "SPEND" && type !== "DONATION_OUT") {
      return NextResponse.json(
        { error: "type must be SPEND or DONATION_OUT" },
        { status: 400 }
      );
    }

    const parsedAmount = Number(Number(amount).toFixed(2));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: "amount must be a positive number" },
        { status: 400 }
      );
    }

    const card = await prisma.giftCard.findUnique({
      where: { id: giftCardId },
    });

    if (!card) {
      return NextResponse.json(
        { error: "Gift card not found" },
        { status: 404 }
      );
    }

    const currentRemaining = Number(card.remainingAmount);
    if (parsedAmount > currentRemaining) {
      return NextResponse.json(
        { error: `Exceeds remaining balance of $${currentRemaining.toFixed(2)}` },
        { status: 400 }
      );
    }

    const newRemaining = Number((currentRemaining - parsedAmount).toFixed(2));

    // Determine new status
    let newStatus: "DONATED" | "FULLY_REDEEMED" | "ACTIVE" | "PARTIALLY_REDEEMED"
    if (newRemaining === 0) {
      newStatus = type === "DONATION_OUT" ? "DONATED" : "FULLY_REDEEMED";
    } else {
      newStatus = "ACTIVE";
    }

    // Create transaction and update card in a transaction
    const [transaction] = await prisma.$transaction([
      prisma.transaction.create({
        data: {
          giftCardId,
          amount: parsedAmount,
          type,
          volunteerName: volunteerName || null,
          recipientName: recipientName || null,
          notes: notes?.trim() || null,
        },
        include: {
          giftCard: { include: { store: true } },
        },
      }),
      prisma.giftCard.update({
        where: { id: giftCardId },
        data: {
          remainingAmount: newRemaining,
          status: newStatus,
        },
      }),
    ]);

    // Audit log
    logAudit({
      action: "CREATE",
      entityType: "TRANSACTION",
      entityId: transaction.id,
      performedBy: user.id,
      performedByName: user.user_metadata?.full_name || user.email || null,
      details: {
        type,
        amount: parsedAmount,
        giftCardId,
        storeName: transaction.giftCard?.store?.name,
        volunteerName: volunteerName || null,
        recipientName: recipientName || null,
        notes: notes?.trim() || null,
        previousBalance: currentRemaining,
        newBalance: newRemaining,
      },
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
