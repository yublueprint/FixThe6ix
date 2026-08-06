import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";
import AdmZip from "adm-zip";

function toCSV<T>(data: T[], headers: string[], rowMapper: (row: T) => string[]) {
  const lines = [headers.map(h => `"${h}"`).join(',')];
  for (const row of data) {
    const mapped = rowMapper(row).map(val => {
      const v = val == null ? "" : String(val);
      return `"${v.replace(/"/g, '""')}"`;
    });
    lines.push(mapped.join(','));
  }
  return lines.join('\n');
}

export async function GET(request: NextRequest) {
  const { user, response } = await requireAuth();
  if (!user) return response!;

  try {
    const url = new URL(request.url);
    const tablesParam = url.searchParams.get("tables");
    const requestedTables = tablesParam ? tablesParam.split(",") : ["stores", "users", "gift_cards", "transactions"];

    const zip = new AdmZip();
    let csvString = "";
    let singleFilename = "";

    if (requestedTables.includes("stores")) {
      const stores = await prisma.store.findMany();
      const csv = toCSV(
        stores,
        ["ID", "Name", "Category"],
        (s) => [s.id, s.name, s.category]
      );
      if (requestedTables.length === 1) { csvString = csv; singleFilename = "stores.csv"; }
      else zip.addFile("stores.csv", Buffer.from(csv));
    }

    if (requestedTables.includes("users")) {
      const users = await prisma.user.findMany();
      const csv = toCSV(
        users,
        ["ID", "Name", "Email", "Role"],
        (u) => [u.id, u.name || "", u.email || "", u.role]
      );
      if (requestedTables.length === 1) { csvString = csv; singleFilename = "users.csv"; }
      else zip.addFile("users.csv", Buffer.from(csv));
    }

    if (requestedTables.includes("gift_cards")) {
      const cards = await prisma.giftCard.findMany({ include: { store: true } });
      const csv = toCSV(
        cards,
        ["ID", "Status", "Store", "Last 4 Digits", "Initial Amount", "Remaining Amount", "Notes", "Created At"],
        (c) => [
          c.id,
          c.status,
          c.store.name,
          c.lastFourDigits,
          String(c.initialAmount),
          String(c.remainingAmount),
          c.notes || "",
          c.createdAt.toISOString()
        ]
      );
      if (requestedTables.length === 1) { csvString = csv; singleFilename = "gift_cards.csv"; }
      else zip.addFile("gift_cards.csv", Buffer.from(csv));
    }

    if (requestedTables.includes("transactions")) {
      const transactions = await prisma.transaction.findMany();
      const csv = toCSV(
        transactions,
        ["ID", "Gift Card ID", "Type", "Amount", "Recipient Name", "Volunteer Name", "Created At"],
        (t) => [
          t.id,
          t.giftCardId,
          t.type,
          String(t.amount),
          t.recipientName || "",
          t.volunteerName || "",
          t.createdAt.toISOString()
        ]
      );
      if (requestedTables.length === 1) { csvString = csv; singleFilename = "transactions.csv"; }
      else zip.addFile("transactions.csv", Buffer.from(csv));
    }

    if (requestedTables.length === 1) {
      return new NextResponse(csvString, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${singleFilename}"`,
        }
      });
    } else {
      return new NextResponse(new Uint8Array(zip.toBuffer()), {
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="database_export_${new Date().toISOString().split('T')[0]}.zip"`,
        }
      });
    }

  } catch (error) {
    console.error("Export Error:", error);
    return NextResponse.json({ error: "Failed to generate export" }, { status: 500 });
  }
}
