/**
 * Sample queries demonstrating schema usage for dashboard aggregations,
 * store breakdowns, and gift card entry/redemption flows.
 *
 * These are reference examples only — not executed at runtime.
 */

import { prisma } from "../lib/prisma";

// ---------------------------------------------------------------------------
// Dashboard aggregations
// ---------------------------------------------------------------------------

/** Total card count and value, broken down by status */
export async function getDashboardSummary() {
  const [statusGroups, totals] = await Promise.all([
    prisma.giftCard.groupBy({
      by: ["status"],
      _count: { id: true },
      _sum: { remainingAmount: true, initialAmount: true },
    }),
    prisma.giftCard.aggregate({
      _count: { id: true },
      _sum: { remainingAmount: true, initialAmount: true },
    }),
  ]);

  return { statusGroups, totals };
}

/** Value distributed by store category */
export async function getValueByCategory() {
  // Sum remainingAmount per category via raw grouping through store relation
  const cards = await prisma.giftCard.findMany({
    select: {
      remainingAmount: true,
      initialAmount: true,
      store: { select: { category: true } },
    },
  });

  const byCategory: Record<string, { remaining: number; initial: number }> = {};
  for (const card of cards) {
    const cat = card.store.category;
    if (!byCategory[cat]) byCategory[cat] = { remaining: 0, initial: 0 };
    byCategory[cat].remaining += Number(card.remainingAmount);
    byCategory[cat].initial += Number(card.initialAmount);
  }
  return byCategory;
}

// ---------------------------------------------------------------------------
// Store breakdown
// ---------------------------------------------------------------------------

/** All stores with their card counts and total remaining value */
export async function getStoreBreakdown() {
  return prisma.store.findMany({
    select: {
      id: true,
      name: true,
      category: true,
      _count: { select: { giftCards: true } },
      giftCards: {
        select: { remainingAmount: true, status: true },
      },
    },
    orderBy: { name: "asc" },
  });
}

// ---------------------------------------------------------------------------
// Gift card entry / duplicate detection
// ---------------------------------------------------------------------------

/** Check for a duplicate card before inserting (same store + last 4 digits) */
export async function findDuplicateCard(storeId: string, lastFourDigits: string) {
  return prisma.giftCard.findFirst({
    where: { storeId, lastFourDigits, status: { not: "FULLY_REDEEMED" } },
    select: { id: true, remainingAmount: true, status: true },
  });
}

/** Create a new gift card entry */
export async function createGiftCard(data: {
  storeId: string;
  lastFourDigits: string;
  initialAmount: number;
  notes?: string;
}) {
  return prisma.giftCard.create({
    data: {
      ...data,
      remainingAmount: data.initialAmount,
      status: "ACTIVE",
    },
  });
}

// ---------------------------------------------------------------------------
// Spend / redemption flow
// ---------------------------------------------------------------------------

/** Record a spend transaction and update remaining balance */
export async function recordSpend(
  giftCardId: string,
  amount: number,
  volunteerName: string,
  recipientName?: string,
) {
  return prisma.$transaction(async (tx) => {
    const transaction = await tx.transaction.create({
      data: { giftCardId, amount, type: "SPEND", volunteerName, recipientName },
    });

    const updatedCard = await tx.giftCard.update({
      where: { id: giftCardId },
      data: {
        remainingAmount: { decrement: amount },
      },
    });

    // Derive new status based on the updated remaining balance
    const newRemaining = Number(updatedCard.remainingAmount);
    const newStatus =
      newRemaining <= 0 ? "FULLY_REDEEMED" : "PARTIALLY_REDEEMED";

    await tx.giftCard.update({
      where: { id: giftCardId },
      data: { status: newStatus },
    });

    return transaction;
  });
}

/** Record a donation-out event */
export async function recordDonation(
  giftCardId: string,
  amount: number,
  volunteerName: string,
  recipientName: string,
) {
  return prisma.$transaction(async (tx) => {
    const transaction = await tx.transaction.create({
      data: {
        giftCardId,
        amount,
        type: "DONATION_OUT",
        volunteerName,
        recipientName,
      },
    });

    await tx.giftCard.update({
      where: { id: giftCardId },
      data: { status: "DONATED", remainingAmount: 0 },
    });

    return transaction;
  });
}

// ---------------------------------------------------------------------------
// Transaction log
// ---------------------------------------------------------------------------

/** Recent transactions with card and store context (for admin log view) */
export async function getRecentTransactions(limit = 50) {
  return prisma.transaction.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      type: true,
      amount: true,
      volunteerName: true,
      recipientName: true,
      createdAt: true,
      giftCard: {
        select: {
          lastFourDigits: true,
          store: { select: { name: true, category: true } },
        },
      },
    },
  });
}
