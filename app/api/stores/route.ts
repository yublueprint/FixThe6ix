import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";
import { getStores, postStore } from "./zodValidation";

/**
 * GET /api/stores
 * Lists stores, optionally filtered by query params `name` (partial, case-insensitive) and/or `category` (exact enum match).
 */
export async function GET(request: Request) {
  const { user, response } = await requireAuth();
  if (!user) return response!;

  try {
    // Read optional filters from the URL (?name=...&category=...)
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name");
    const category = searchParams.get("category");

    // Validate query shape (both filters optional; empty query = list all)
    const parsed = getStores(name, category);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request parameters",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    // Build Prisma filter: only add clauses for params the client actually sent
    const where: Prisma.StoreWhereInput = {};
    if (parsed.data.name) {
      where.name = { contains: parsed.data.name, mode: "insensitive" };
    }
    if (parsed.data.category) {
      where.category = parsed.data.category;
    }

    // Run the query (empty `where` returns every row)
    const stores = await prisma.store.findMany({ where });
    return NextResponse.json(stores, { status: 200 });
  } catch (error) {
    // Unexpected errors (DB, parsing URL, etc.)
    console.error("Error fetching stores using GET /api/stores route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/stores
 * Creates a store. Body must include `name` and `category`; `logoUrl` is optional (must be a valid URL if present).
 */
export async function POST(request: Request) {
  const { user, response } = await requireAuth();
  if (!user) return response!;

  try {
    // Parse JSON body and normalize optional logo field
    const body = await request.json();
    const logoUrl = body.logoUrl ?? null;

    // Validate body against postStoreSchema (Zod)
    const parsed = postStore(body.name, body.category, logoUrl);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { name, category, logoUrl: logoUrlValidated } = parsed.data;

    try {
      // Insert row; unique on `name` is enforced by the database
      const createdStore = await prisma.store.create({
        data: {
          name,
          category,
          logoUrl: logoUrlValidated ?? null,
        },
      });
      return NextResponse.json(createdStore, { status: 201 });
    } catch (error) {
      // Duplicate name (including race: two requests creating the same name)
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return NextResponse.json(
          { error: "Store with same name already exists" },
          { status: 409 }
        );
      }
      throw error;
    }
  } catch (error) {
    // Re-thrown Prisma errors other than P2002, or JSON parse failures, etc.
    console.error("Error creating store using POST /api/stores route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
