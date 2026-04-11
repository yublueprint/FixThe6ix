import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";
import { GET, POST } from "./route";

// Mock the Prisma singleton used by route.ts so tests never hit a real database.
vi.mock("@/lib/prisma", () => ({
  prisma: {
    store: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

// Import the mocked prisma after vi.mock so we can control return values per test.
import { prisma } from "@/lib/prisma";

// Small helper to make typed access to mocked prisma methods easier.
const mockedPrisma = prisma as unknown as {
  store: {
    findMany: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
};

describe("app/api/stores/route.ts", () => {
  beforeEach(() => {
    // Reset mock call counts and implementations before each test.
    vi.clearAllMocks();
  });

  describe("GET /api/stores", () => {
    it("returns 200 and matching stores for valid query params", async () => {
      // This test verifies the successful path:
      // - request has valid name/category filters
      // - route calls prisma.store.findMany with built where clause
      // - route returns HTTP 200 + store list JSON
      const fakeStores = [
        { id: "1", name: "Fresh Mart", category: "GROCERY", logoUrl: null },
      ];

      mockedPrisma.store.findMany.mockResolvedValue(fakeStores);

      const request = new Request(
        "http://localhost:3000/api/stores?name=fresh&category=GROCERY"
      );

      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual(fakeStores);

      expect(mockedPrisma.store.findMany).toHaveBeenCalledTimes(1);
      expect(mockedPrisma.store.findMany).toHaveBeenCalledWith({
        where: {
          name: { contains: "fresh", mode: "insensitive" },
          category: "GROCERY",
        },
      });
    });

    it("returns 400 for invalid query params and does not query database", async () => {
      // This test verifies validation failure:
      // - invalid category should fail Zod validation
      // - route should return HTTP 400 with validation details
      // - Prisma should not be called at all
      const request = new Request(
        "http://localhost:3000/api/stores?category=NOT_A_REAL_CATEGORY"
      );

      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toBe("Invalid request parameters");
      expect(body.details).toBeDefined();

      expect(mockedPrisma.store.findMany).not.toHaveBeenCalled();
    });

    it("returns 500 when prisma.findMany throws an unexpected error", async () => {
      // This test verifies the generic error path:
      // - if DB layer fails unexpectedly
      // - route returns HTTP 500
      mockedPrisma.store.findMany.mockRejectedValue(
        new Error("Database unavailable")
      );

      const request = new Request("http://localhost:3000/api/stores");

      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body).toEqual({ error: "Internal server error" });
    });
  });

  describe("POST /api/stores", () => {
    it("returns 201 and created store for valid payload", async () => {
      // This test verifies POST happy path:
      // - valid body passes Zod validation
      // - route calls prisma.store.create with validated data
      // - route returns HTTP 201 + created store JSON
      const createdStore = {
        id: "new-id",
        name: "Tech Hub",
        category: "ELECTRONICS",
        logoUrl: "https://example.com/logo.png",
      };

      mockedPrisma.store.create.mockResolvedValue(createdStore);

      const request = new Request("http://localhost:3000/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Tech Hub",
          category: "ELECTRONICS",
          logoUrl: "https://example.com/logo.png",
        }),
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body).toEqual(createdStore);

      expect(mockedPrisma.store.create).toHaveBeenCalledTimes(1);
      expect(mockedPrisma.store.create).toHaveBeenCalledWith({
        data: {
          name: "Tech Hub",
          category: "ELECTRONICS",
          logoUrl: "https://example.com/logo.png",
        },
      });
    });

    it("returns 400 for invalid body and does not call database", async () => {
      // This test verifies body validation:
      // - missing/invalid fields should fail Zod validation
      // - route returns HTTP 400
      // - Prisma create should never run
      const request = new Request("http://localhost:3000/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "", // invalid (min length fail after trim)
          category: "GROCERY",
        }),
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toBe("Invalid request body");
      expect(body.details).toBeDefined();

      expect(mockedPrisma.store.create).not.toHaveBeenCalled();
    });

    it("returns 409 when prisma throws P2002 duplicate error", async () => {
      // This test verifies conflict mapping:
      // - Prisma unique constraint error (P2002)
      // - route should map it to HTTP 409 (duplicate store name)
      const duplicateError = Object.assign(new Error("Unique constraint"), {
        code: "P2002",
      });

      // Make instanceof check pass in route.ts:
      Object.setPrototypeOf(
        duplicateError,
        Prisma.PrismaClientKnownRequestError.prototype
      );

      mockedPrisma.store.create.mockRejectedValue(duplicateError);

      const request = new Request("http://localhost:3000/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Fresh Mart",
          category: "GROCERY",
        }),
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(409);
      expect(body).toEqual({ error: "Store with same name already exists" });
    });

    it("returns 500 for unexpected create errors", async () => {
      // This test verifies fallback error handling:
      // - non-P2002 failures should become HTTP 500
      mockedPrisma.store.create.mockRejectedValue(new Error("Unknown failure"));

      const request = new Request("http://localhost:3000/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "General Store",
          category: "OTHER",
        }),
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body).toEqual({ error: "Internal server error" });
    });
  });
});