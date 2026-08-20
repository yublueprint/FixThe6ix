import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";

/**
 * GET /api/gift-cards
 * Returns all gift cards with their store and transactions.
 * Optional query params: store (name), status, search (store name or last4).
 */
export async function GET(request: Request) {
  const { user, response } = await requireAuth();
  if (!user) return response!;

  try {
    const { searchParams } = new URL(request.url);
    const store = searchParams.get("store");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};

    if (store && store !== "All") {
      where.store = { name: store };
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { store: { name: { contains: search, mode: "insensitive" } } },
        { lastFourDigits: { contains: search } },
      ];
    }

    const cards = await prisma.giftCard.findMany({
      where,
      include: {
        store: true,
        transactions: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(cards, { status: 200 });
  } catch (error) {
    console.error("Error fetching gift cards:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/gift-cards
 * Creates a new gift card. Body: { storeName, lastFourDigits, initialAmount, notes? }
 * If the store doesn't exist, it creates it with category OTHER.
 */
export async function POST(request: Request) {
  const { user, response } = await requireAuth();
  if (!user) return response!;

  try {
    const body = await request.json();
    const { storeName, lastFourDigits, initialAmount, notes, addedBy } = body;

    if (!storeName || !lastFourDigits || !initialAmount) {
      return NextResponse.json(
        { error: "storeName, lastFourDigits, and initialAmount are required" },
        { status: 400 }
      );
    }

    if (lastFourDigits.length !== 4 || !/^\d{4}$/.test(lastFourDigits)) {
      return NextResponse.json(
        { error: "lastFourDigits must be exactly 4 digits" },
        { status: 400 }
      );
    }

    const amount = Number(Number(initialAmount).toFixed(2));
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "initialAmount must be a positive number" },
        { status: 400 }
      );
    }

    // Find or create the store
    let store = await prisma.store.findUnique({
      where: { name: storeName.trim() },
    });

    if (!store) {
      store = await prisma.store.create({
        data: { name: storeName.trim(), category: "OTHER" },
      });
    }

    // Check for duplicate
    const existing = await prisma.giftCard.findUnique({
      where: {
        storeId_lastFourDigits: {
          storeId: store.id,
          lastFourDigits,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A card for this store with the same last 4 digits already exists" },
        { status: 409 }
      );
    }

    const resolvedAddedBy = addedBy?.trim() || user.user_metadata?.full_name || user.email || "Volunteer";

    const card = await prisma.giftCard.create({
      data: {
        storeId: store.id,
        lastFourDigits,
        initialAmount: amount,
        remainingAmount: amount,
        status: "ACTIVE",
        notes: notes?.trim() || null,
        addedBy: resolvedAddedBy,
      },
      include: { store: true, transactions: true },
    });

    return NextResponse.json(card, { status: 201 });
  } catch (error) {
    console.error("Error creating gift card:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
