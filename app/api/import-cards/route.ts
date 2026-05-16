import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";

type ImportRow = {
  store: string;
  last4: string;
  amount: number;
  dateAdded: string | null;
  addedBy: string;
  notes: string;
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

    const supabase = await createSupabaseClient();

    const { data: storeData, error: storeError } = await supabase
      .from("Store")
      .select("id,name");

    if (storeError) {
      return NextResponse.json(
        {
          error: "Unable to load stores.",
          details: storeError.message,
          hint: storeError.details ?? null,
          code: storeError.code ?? null,
        },
        { status: 500 }
      );
    }

    const stores = (storeData ?? []) as { id: string; name: string }[];
    const storeMap = new Map(
      stores.map((store) => [store.name.trim().toLowerCase(), store.id])
    );

    const batchPayload = {
      file_name: body.fileName,
      status: "completed",
      row_count: rows.length,
      success_count: rows.filter((row) => row.status !== "error").length,
      error_count: rows.filter((row) => row.status === "error").length,
      error_summary:
        rows
          .filter((row) => row.status === "error")
          .map((row) => `row ${row.rowNumber}: ${row.errors?.join(", ")}`)
          .join("; ") || null,
      metadata: {
        source: "add-card csv import",
        uploadedAt: new Date().toISOString(),
      },
    };

    const { data: batchData, error: batchError } = await supabase
      .from("import_batches")
      .insert(batchPayload)
      .select("id")
      .single();

    if (batchError || !batchData?.id) {
      return NextResponse.json(
        { error: "Failed to create import batch.", details: batchError?.message },
        { status: 500 }
      );
    }

    const missingStores = new Set<string>();
    const stagedRows = rows.map((row, index) => {
      const storeKey = row.store.trim().toLowerCase();
      const storeId = storeMap.get(storeKey) ?? null;
      if (!storeId && row.status !== "error") {
        missingStores.add(row.store);
      }

      return {
        id: crypto.randomUUID(),
        batch_id: batchData.id,
        raw_store: row.store,
        raw_last4: row.last4,
        raw_amount: String(row.amount),
        raw_notes: row.notes || null,
        raw_added_by: row.addedBy || null,
        raw_date_added: row.dateAdded || null,
        row_number: row.rowNumber ?? index + 1,
        status: row.status || "pending",
        validation_errors: row.status === "error" ? row.errors ?? [] : null,
        resolved_store_id: storeId,
        resolved_last4: storeId ? row.last4 : null,
        resolved_amount: storeId ? row.amount : null,
        resolved_date_added:
          storeId && row.dateAdded ? new Date(row.dateAdded).toISOString() : null,
        promoted_card_id: null,
        promoted_at: null,
      };
    });

    const { error: stagingError } = await supabase
      .from("import_staging")
      .insert(stagedRows);

    if (stagingError) {
      return NextResponse.json(
        { error: "Failed to stage import rows.", details: stagingError.message },
        { status: 500 }
      );
    }

    const giftCardRows = rows
      .filter((row) => row.status === "valid")
      .map((row) => {
        const storeId = storeMap.get(row.store.trim().toLowerCase());
        return storeId
          ? {
              storeId,
              lastFourDigits: row.last4,
              initialAmount: row.amount,
              remainingAmount: row.amount,
              status: "ACTIVE",
              notes: row.notes || null,
            }
          : null;
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);

    let inserted = 0;
    let updated = 0;

    if (giftCardRows.length > 0) {
      const storeIds = Array.from(new Set(giftCardRows.map((row) => row.storeId)));
      const { data: existingCards, error: existingError } = await supabase
        .from("GiftCard")
        .select("storeId,lastFourDigits")
        .in("storeId", storeIds);

      if (existingError) {
        return NextResponse.json(
          { error: "Failed to fetch existing gift cards.", details: existingError.message },
          { status: 500 }
        );
      }

      const existingSet = new Set(
        (existingCards ?? []).map(
          (card: { storeId: string; lastFourDigits: string }) =>
            `${card.storeId}::${card.lastFourDigits}`
        )
      );

      const newGiftCardRows = giftCardRows.filter(
        (row) => !existingSet.has(`${row.storeId}::${row.lastFourDigits}`)
      );
      inserted = newGiftCardRows.length;
      updated = giftCardRows.length - inserted;

      if (newGiftCardRows.length > 0) {
        const { error: insertError } = await supabase
          .from("GiftCard")
          .insert(newGiftCardRows);

        if (insertError) {
          return NextResponse.json(
            { error: "Failed to insert gift cards.", details: insertError.message },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.json(
      {
        batchId: batchData.id,
        inserted,
        updated,
        staged: rows.length,
        missingStores: Array.from(missingStores),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("/api/import-cards error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
