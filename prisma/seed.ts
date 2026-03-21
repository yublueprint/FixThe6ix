import { PrismaClient, StoreCategory, GiftCardStatus, TransactionType, UserRole } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL as string });
const prisma = new PrismaClient({ adapter });

// ---------------------------------------------------------------------------
// Reference data
// ---------------------------------------------------------------------------

const STORES: { name: string; category: StoreCategory }[] = [
  // Fast Food
  { name: "Tim Hortons", category: "FAST_FOOD" },
  { name: "McDonald's", category: "FAST_FOOD" },
  { name: "Subway", category: "FAST_FOOD" },
  { name: "Burger King", category: "FAST_FOOD" },
  { name: "Wendy's", category: "FAST_FOOD" },
  { name: "KFC", category: "FAST_FOOD" },
  { name: "Taco Bell", category: "FAST_FOOD" },
  { name: "A&W", category: "FAST_FOOD" },
  { name: "Harvey's", category: "FAST_FOOD" },
  { name: "Chipotle", category: "FAST_FOOD" },
  { name: "Panera Bread", category: "FAST_FOOD" },
  { name: "Dunkin'", category: "FAST_FOOD" },
  { name: "Chick-fil-A", category: "FAST_FOOD" },
  { name: "Popeyes", category: "FAST_FOOD" },
  { name: "Five Guys", category: "FAST_FOOD" },
  { name: "Starbucks", category: "FAST_FOOD" },

  // Restaurant (sit-down)
  { name: "Olive Garden", category: "RESTAURANT" },
  { name: "Boston Pizza", category: "RESTAURANT" },
  { name: "East Side Mario's", category: "RESTAURANT" },
  { name: "Swiss Chalet", category: "RESTAURANT" },
  { name: "The Keg", category: "RESTAURANT" },
  { name: "Milestones", category: "RESTAURANT" },
  { name: "Applebee's", category: "RESTAURANT" },
  { name: "Red Lobster", category: "RESTAURANT" },

  // Grocery
  { name: "Loblaws", category: "GROCERY" },
  { name: "Metro", category: "GROCERY" },
  { name: "Sobeys", category: "GROCERY" },
  { name: "No Frills", category: "GROCERY" },
  { name: "FreshCo", category: "GROCERY" },
  { name: "Walmart", category: "GROCERY" },
  { name: "Costco", category: "GROCERY" },
  { name: "Whole Foods", category: "GROCERY" },
  { name: "Trader Joe's", category: "GROCERY" },
  { name: "Safeway", category: "GROCERY" },
  { name: "Kroger", category: "GROCERY" },
  { name: "Target", category: "GROCERY" },

  // Clothing
  { name: "H&M", category: "CLOTHING" },
  { name: "Zara", category: "CLOTHING" },
  { name: "Gap", category: "CLOTHING" },
  { name: "Old Navy", category: "CLOTHING" },
  { name: "Banana Republic", category: "CLOTHING" },
  { name: "Winners", category: "CLOTHING" },
  { name: "Marshalls", category: "CLOTHING" },
  { name: "Kohl's", category: "CLOTHING" },
  { name: "Macy's", category: "CLOTHING" },
  { name: "Joe Fresh", category: "CLOTHING" },
  { name: "TJ Maxx", category: "CLOTHING" },

  // Pharmacy
  { name: "Shoppers Drug Mart", category: "PHARMACY" },
  { name: "Rexall", category: "PHARMACY" },
  { name: "CVS Pharmacy", category: "PHARMACY" },
  { name: "Walgreens", category: "PHARMACY" },

  // Electronics
  { name: "Best Buy", category: "ELECTRONICS" },

  // Home Goods
  { name: "Home Depot", category: "HOME_GOODS" },
  { name: "IKEA", category: "HOME_GOODS" },
  { name: "Canadian Tire", category: "HOME_GOODS" },
  { name: "Dollarama", category: "HOME_GOODS" },

  // Online / Other
  { name: "Amazon", category: "ONLINE" },
  { name: "Staples", category: "OTHER" },
];

const VOLUNTEERS = [
  "Sarah Johnson",
  "Mike Davis",
  "Lisa Chen",
  "Emily Rodriguez",
  "David Kim",
  "Omar Hassan",
  "Priya Patel",
];

const RECIPIENTS = [
  "Family A",
  "Family B",
  "Family C",
  "Single Mother D",
  "Senior Citizen E",
  "Homeless Individual F",
  "Student G",
  "Teen H",
  "Single Parent I",
  "Veteran J",
  "Senior Couple K",
  "Job Seeker L",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDigits(n: number): string {
  return Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join("");
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

async function main() {
  console.log("Seeding database...");

  // Users
  await prisma.user.createMany({
    data: [
      { role: UserRole.ADMIN },
      { role: UserRole.VOLUNTEER },
      { role: UserRole.VOLUNTEER },
      { role: UserRole.VOLUNTEER },
    ],
    skipDuplicates: true,
  });

  // Stores
  const storeRecords = await Promise.all(
    STORES.map((s) =>
      prisma.store.upsert({
        where: { name: s.name },
        update: {},
        create: { name: s.name, category: s.category },
      })
    )
  );

  console.log(`Upserted ${storeRecords.length} stores.`);

  // Gift cards + transactions
  const cardSpecs: {
    store: string;
    last4: string;
    initial: number;
    remaining: number;
    status: GiftCardStatus;
    notes?: string;
    createdDaysAgo: number;
    transactions: {
      type: TransactionType;
      amount: number;
      volunteerName: string;
      recipientName?: string;
      daysAgo: number;
    }[];
  }[] = [
    // --- Tim Hortons ---
    {
      store: "Tim Hortons",
      last4: "1001",
      initial: 50,
      remaining: 50,
      status: "ACTIVE",
      createdDaysAgo: 10,
      transactions: [],
    },
    {
      store: "Tim Hortons",
      last4: "1002",
      initial: 25,
      remaining: 10,
      status: "PARTIALLY_REDEEMED",
      createdDaysAgo: 30,
      transactions: [
        { type: "SPEND", amount: 15, volunteerName: "Sarah Johnson", daysAgo: 25 },
      ],
    },
    {
      store: "Tim Hortons",
      last4: "1003",
      initial: 25,
      remaining: 0,
      status: "FULLY_REDEEMED",
      createdDaysAgo: 60,
      transactions: [
        { type: "SPEND", amount: 12, volunteerName: "Mike Davis", daysAgo: 55 },
        { type: "SPEND", amount: 13, volunteerName: "Lisa Chen", daysAgo: 50 },
      ],
    },

    // --- McDonald's ---
    {
      store: "McDonald's",
      last4: "2001",
      initial: 25,
      remaining: 10,
      status: "PARTIALLY_REDEEMED",
      createdDaysAgo: 40,
      transactions: [
        { type: "SPEND", amount: 15, volunteerName: "Mike Davis", daysAgo: 35 },
      ],
    },
    {
      store: "McDonald's",
      last4: "2002",
      initial: 25,
      remaining: 25,
      status: "ACTIVE",
      createdDaysAgo: 15,
      transactions: [],
    },
    {
      store: "McDonald's",
      last4: "2003",
      initial: 50,
      remaining: 0,
      status: "DONATED",
      createdDaysAgo: 90,
      transactions: [
        { type: "DONATION_OUT", amount: 50, volunteerName: "Emily Rodriguez", recipientName: "Family B", daysAgo: 80 },
      ],
    },

    // --- Starbucks ---
    {
      store: "Starbucks",
      last4: "3001",
      initial: 40,
      remaining: 15.75,
      status: "PARTIALLY_REDEEMED",
      createdDaysAgo: 50,
      transactions: [
        { type: "SPEND", amount: 12.25, volunteerName: "Lisa Chen", daysAgo: 45 },
        { type: "SPEND", amount: 12, volunteerName: "Sarah Johnson", daysAgo: 38 },
      ],
    },
    {
      store: "Starbucks",
      last4: "3002",
      initial: 40,
      remaining: 0,
      status: "DONATED",
      createdDaysAgo: 70,
      transactions: [
        { type: "DONATION_OUT", amount: 40, volunteerName: "Mike Davis", recipientName: "Family C", daysAgo: 65 },
      ],
    },

    // --- Subway ---
    {
      store: "Subway",
      last4: "4001",
      initial: 20,
      remaining: 8.5,
      status: "PARTIALLY_REDEEMED",
      createdDaysAgo: 45,
      transactions: [
        { type: "SPEND", amount: 11.5, volunteerName: "Lisa Chen", daysAgo: 40 },
      ],
    },
    {
      store: "Subway",
      last4: "4002",
      initial: 20,
      remaining: 20,
      status: "ACTIVE",
      createdDaysAgo: 5,
      transactions: [],
    },

    // --- Walmart ---
    {
      store: "Walmart",
      last4: "5001",
      initial: 100,
      remaining: 64.5,
      status: "PARTIALLY_REDEEMED",
      createdDaysAgo: 55,
      transactions: [
        { type: "SPEND", amount: 22.5, volunteerName: "Sarah Johnson", daysAgo: 50 },
        { type: "SPEND", amount: 13, volunteerName: "Mike Davis", daysAgo: 44 },
      ],
    },
    {
      store: "Walmart",
      last4: "5002",
      initial: 50,
      remaining: 50,
      status: "ACTIVE",
      createdDaysAgo: 20,
      transactions: [],
    },
    {
      store: "Walmart",
      last4: "5003",
      initial: 150,
      remaining: 0,
      status: "FULLY_REDEEMED",
      createdDaysAgo: 120,
      transactions: [
        { type: "SPEND", amount: 80, volunteerName: "David Kim", daysAgo: 115 },
        { type: "SPEND", amount: 70, volunteerName: "Sarah Johnson", daysAgo: 100 },
      ],
    },

    // --- Target ---
    {
      store: "Target",
      last4: "6001",
      initial: 75,
      remaining: 0,
      status: "FULLY_REDEEMED",
      createdDaysAgo: 80,
      transactions: [
        { type: "SPEND", amount: 40, volunteerName: "Sarah Johnson", daysAgo: 75 },
        { type: "SPEND", amount: 35, volunteerName: "Lisa Chen", daysAgo: 68 },
      ],
    },
    {
      store: "Target",
      last4: "6002",
      initial: 50,
      remaining: 50,
      status: "ACTIVE",
      createdDaysAgo: 12,
      transactions: [],
    },

    // --- Loblaws ---
    {
      store: "Loblaws",
      last4: "7001",
      initial: 100,
      remaining: 100,
      status: "ACTIVE",
      createdDaysAgo: 8,
      transactions: [],
    },
    {
      store: "Loblaws",
      last4: "7002",
      initial: 200,
      remaining: 110,
      status: "PARTIALLY_REDEEMED",
      createdDaysAgo: 35,
      transactions: [
        { type: "SPEND", amount: 55, volunteerName: "Omar Hassan", daysAgo: 30 },
        { type: "SPEND", amount: 35, volunteerName: "Priya Patel", daysAgo: 22 },
      ],
    },
    {
      store: "Loblaws",
      last4: "7003",
      initial: 75,
      remaining: 0,
      status: "DONATED",
      createdDaysAgo: 100,
      notes: "MULTICARD",
      transactions: [
        { type: "DONATION_OUT", amount: 75, volunteerName: "Sarah Johnson", recipientName: "Family A", daysAgo: 90 },
      ],
    },

    // --- Metro ---
    {
      store: "Metro",
      last4: "8001",
      initial: 50,
      remaining: 50,
      status: "ACTIVE",
      createdDaysAgo: 7,
      transactions: [],
    },
    {
      store: "Metro",
      last4: "8002",
      initial: 100,
      remaining: 40,
      status: "PARTIALLY_REDEEMED",
      createdDaysAgo: 45,
      transactions: [
        { type: "SPEND", amount: 60, volunteerName: "Mike Davis", daysAgo: 38 },
      ],
    },

    // --- Sobeys ---
    {
      store: "Sobeys",
      last4: "9001",
      initial: 75,
      remaining: 75,
      status: "ACTIVE",
      createdDaysAgo: 3,
      transactions: [],
    },

    // --- No Frills ---
    {
      store: "No Frills",
      last4: "9101",
      initial: 50,
      remaining: 20,
      status: "PARTIALLY_REDEEMED",
      createdDaysAgo: 28,
      transactions: [
        { type: "SPEND", amount: 30, volunteerName: "Emily Rodriguez", daysAgo: 20 },
      ],
    },

    // --- Amazon ---
    {
      store: "Amazon",
      last4: "1101",
      initial: 200,
      remaining: 145.99,
      status: "PARTIALLY_REDEEMED",
      createdDaysAgo: 25,
      transactions: [
        { type: "SPEND", amount: 54.01, volunteerName: "Sarah Johnson", daysAgo: 18 },
      ],
    },
    {
      store: "Amazon",
      last4: "1102",
      initial: 100,
      remaining: 100,
      status: "ACTIVE",
      createdDaysAgo: 6,
      transactions: [],
    },

    // --- Kroger ---
    {
      store: "Kroger",
      last4: "1201",
      initial: 150,
      remaining: 87.3,
      status: "PARTIALLY_REDEEMED",
      createdDaysAgo: 38,
      transactions: [
        { type: "SPEND", amount: 62.7, volunteerName: "Lisa Chen", daysAgo: 30 },
      ],
    },
    {
      store: "Kroger",
      last4: "1202",
      initial: 100,
      remaining: 0,
      status: "FULLY_REDEEMED",
      createdDaysAgo: 90,
      transactions: [
        { type: "SPEND", amount: 55, volunteerName: "Mike Davis", daysAgo: 85 },
        { type: "SPEND", amount: 45, volunteerName: "Sarah Johnson", daysAgo: 75 },
      ],
    },

    // --- Chipotle ---
    {
      store: "Chipotle",
      last4: "1301",
      initial: 30,
      remaining: 30,
      status: "ACTIVE",
      createdDaysAgo: 11,
      transactions: [],
    },

    // --- CVS Pharmacy ---
    {
      store: "CVS Pharmacy",
      last4: "1401",
      initial: 60,
      remaining: 60,
      status: "ACTIVE",
      createdDaysAgo: 14,
      transactions: [],
    },

    // --- Best Buy ---
    {
      store: "Best Buy",
      last4: "1501",
      initial: 75,
      remaining: 0,
      status: "FULLY_REDEEMED",
      createdDaysAgo: 55,
      transactions: [
        { type: "SPEND", amount: 75, volunteerName: "Sarah Johnson", daysAgo: 48 },
      ],
    },

    // --- Costco ---
    {
      store: "Costco",
      last4: "1601",
      initial: 250,
      remaining: 175.5,
      status: "PARTIALLY_REDEEMED",
      createdDaysAgo: 30,
      transactions: [
        { type: "SPEND", amount: 74.5, volunteerName: "Sarah Johnson", daysAgo: 22 },
      ],
    },

    // --- Old Navy ---
    {
      store: "Old Navy",
      last4: "1701",
      initial: 40,
      remaining: 40,
      status: "ACTIVE",
      createdDaysAgo: 9,
      transactions: [],
    },
    {
      store: "Old Navy",
      last4: "1702",
      initial: 60,
      remaining: 0,
      status: "DONATED",
      createdDaysAgo: 75,
      transactions: [
        { type: "DONATION_OUT", amount: 60, volunteerName: "Mike Davis", recipientName: "Family E", daysAgo: 65 },
      ],
    },

    // --- Gap ---
    {
      store: "Gap",
      last4: "1801",
      initial: 35,
      remaining: 0,
      status: "FULLY_REDEEMED",
      createdDaysAgo: 60,
      transactions: [
        { type: "SPEND", amount: 35, volunteerName: "Mike Chen", daysAgo: 55 },
      ],
    },

    // --- Winners ---
    {
      store: "Winners",
      last4: "1901",
      initial: 50,
      remaining: 50,
      status: "ACTIVE",
      createdDaysAgo: 4,
      transactions: [],
    },
    {
      store: "Winners",
      last4: "1902",
      initial: 75,
      remaining: 25,
      status: "PARTIALLY_REDEEMED",
      createdDaysAgo: 42,
      transactions: [
        { type: "SPEND", amount: 50, volunteerName: "Emily Rodriguez", daysAgo: 35 },
      ],
    },

    // --- Kohl's ---
    {
      store: "Kohl's",
      last4: "2001",
      initial: 45,
      remaining: 0,
      status: "FULLY_REDEEMED",
      createdDaysAgo: 65,
      transactions: [
        { type: "SPEND", amount: 45, volunteerName: "Mike Davis", daysAgo: 58 },
      ],
    },

    // --- Macy's ---
    {
      store: "Macy's",
      last4: "2101",
      initial: 60,
      remaining: 0,
      status: "DONATED",
      createdDaysAgo: 80,
      transactions: [
        { type: "DONATION_OUT", amount: 60, volunteerName: "Sarah Johnson", recipientName: "Job Seeker L", daysAgo: 72 },
      ],
    },

    // --- Shoppers Drug Mart ---
    {
      store: "Shoppers Drug Mart",
      last4: "2201",
      initial: 30,
      remaining: 30,
      status: "ACTIVE",
      createdDaysAgo: 2,
      transactions: [],
    },
    {
      store: "Shoppers Drug Mart",
      last4: "2202",
      initial: 50,
      remaining: 25,
      status: "PARTIALLY_REDEEMED",
      createdDaysAgo: 33,
      transactions: [
        { type: "SPEND", amount: 25, volunteerName: "David Kim", daysAgo: 25 },
      ],
    },

    // --- Home Depot ---
    {
      store: "Home Depot",
      last4: "2301",
      initial: 80,
      remaining: 0,
      status: "DONATED",
      createdDaysAgo: 95,
      transactions: [
        { type: "DONATION_OUT", amount: 80, volunteerName: "Emily Rodriguez", recipientName: "Veteran J", daysAgo: 88 },
      ],
    },

    // --- Canadian Tire ---
    {
      store: "Canadian Tire",
      last4: "2401",
      initial: 100,
      remaining: 100,
      status: "ACTIVE",
      createdDaysAgo: 5,
      transactions: [],
    },

    // --- Dollarama ---
    {
      store: "Dollarama",
      last4: "2501",
      initial: 20,
      remaining: 20,
      status: "ACTIVE",
      createdDaysAgo: 1,
      transactions: [],
    },

    // --- Boston Pizza ---
    {
      store: "Boston Pizza",
      last4: "2601",
      initial: 50,
      remaining: 20,
      status: "PARTIALLY_REDEEMED",
      createdDaysAgo: 50,
      transactions: [
        { type: "SPEND", amount: 30, volunteerName: "Omar Hassan", daysAgo: 42 },
      ],
    },

    // --- Swiss Chalet ---
    {
      store: "Swiss Chalet",
      last4: "2701",
      initial: 40,
      remaining: 40,
      status: "ACTIVE",
      createdDaysAgo: 8,
      transactions: [],
    },

    // --- H&M ---
    {
      store: "H&M",
      last4: "2801",
      initial: 35,
      remaining: 0,
      status: "FULLY_REDEEMED",
      createdDaysAgo: 70,
      transactions: [
        { type: "SPEND", amount: 35, volunteerName: "Priya Patel", daysAgo: 62 },
      ],
    },

    // --- Whole Foods ---
    {
      store: "Whole Foods",
      last4: "2901",
      initial: 45,
      remaining: 0,
      status: "FULLY_REDEEMED",
      createdDaysAgo: 50,
      transactions: [
        { type: "SPEND", amount: 45, volunteerName: "Sarah Johnson", daysAgo: 44 },
      ],
    },

    // --- FreshCo ---
    {
      store: "FreshCo",
      last4: "3001",
      initial: 60,
      remaining: 60,
      status: "ACTIVE",
      createdDaysAgo: 3,
      transactions: [],
    },

    // --- Rexall ---
    {
      store: "Rexall",
      last4: "3101",
      initial: 25,
      remaining: 25,
      status: "ACTIVE",
      createdDaysAgo: 6,
      transactions: [],
    },

    // --- Trader Joe's ---
    {
      store: "Trader Joe's",
      last4: "3201",
      initial: 40,
      remaining: 0,
      status: "DONATED",
      createdDaysAgo: 85,
      transactions: [
        { type: "DONATION_OUT", amount: 40, volunteerName: "David Kim", recipientName: "Senior Couple K", daysAgo: 78 },
      ],
    },

    // --- Safeway ---
    {
      store: "Safeway",
      last4: "3301",
      initial: 55,
      remaining: 0,
      status: "FULLY_REDEEMED",
      createdDaysAgo: 55,
      transactions: [
        { type: "SPEND", amount: 55, volunteerName: "Emily Rodriguez", daysAgo: 48 },
      ],
    },

    // --- Zara ---
    {
      store: "Zara",
      last4: "3401",
      initial: 80,
      remaining: 80,
      status: "ACTIVE",
      createdDaysAgo: 7,
      transactions: [],
    },

    // --- A&W ---
    {
      store: "A&W",
      last4: "3501",
      initial: 30,
      remaining: 15,
      status: "PARTIALLY_REDEEMED",
      createdDaysAgo: 22,
      transactions: [
        { type: "SPEND", amount: 15, volunteerName: "Omar Hassan", daysAgo: 15 },
      ],
    },

    // --- Harvey's ---
    {
      store: "Harvey's",
      last4: "3601",
      initial: 25,
      remaining: 25,
      status: "ACTIVE",
      createdDaysAgo: 4,
      transactions: [],
    },

    // --- TJ Maxx ---
    {
      store: "TJ Maxx",
      last4: "3701",
      initial: 50,
      remaining: 0,
      status: "DONATED",
      createdDaysAgo: 110,
      transactions: [
        { type: "DONATION_OUT", amount: 50, volunteerName: "Mike Davis", recipientName: "Family N", daysAgo: 100 },
      ],
    },

    // --- Olive Garden ---
    {
      store: "Olive Garden",
      last4: "3801",
      initial: 50,
      remaining: 50,
      status: "ACTIVE",
      createdDaysAgo: 9,
      transactions: [],
    },

    // --- IKEA ---
    {
      store: "IKEA",
      last4: "3901",
      initial: 150,
      remaining: 75,
      status: "PARTIALLY_REDEEMED",
      notes: "MULTICARD",
      createdDaysAgo: 40,
      transactions: [
        { type: "SPEND", amount: 75, volunteerName: "Priya Patel", daysAgo: 32 },
      ],
    },

    // --- Staples ---
    {
      store: "Staples",
      last4: "4001",
      initial: 40,
      remaining: 40,
      status: "ACTIVE",
      createdDaysAgo: 5,
      transactions: [],
    },
  ];

  // Build a store name → id lookup
  const storeMap = new Map(storeRecords.map((s) => [s.name, s.id]));

  let cardCount = 0;
  let txCount = 0;

  for (const spec of cardSpecs) {
    const storeId = storeMap.get(spec.store);
    if (!storeId) {
      console.warn(`Store not found: ${spec.store}`);
      continue;
    }

    const card = await prisma.giftCard.create({
      data: {
        storeId,
        lastFourDigits: spec.last4,
        initialAmount: spec.initial,
        remainingAmount: spec.remaining,
        status: spec.status,
        notes: spec.notes ?? null,
        createdAt: daysAgo(spec.createdDaysAgo),
      },
    });
    cardCount++;

    for (const tx of spec.transactions) {
      await prisma.transaction.create({
        data: {
          giftCardId: card.id,
          amount: tx.amount,
          type: tx.type,
          volunteerName: tx.volunteerName,
          recipientName: tx.recipientName ?? null,
          createdAt: daysAgo(tx.daysAgo),
        },
      });
      txCount++;
    }
  }

  console.log(`Created ${cardCount} gift cards and ${txCount} transactions.`);
  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
