<<<<<<< HEAD
# FixThe6ix

Overview
The WNH ReGiftcard Program tracks 50+ store brands and hundreds of individual gift cards — catalogued by last-4-digits, remaining balance, and redemption status. The current manual spreadsheet process is error-prone, hard to audit, and inaccessible for volunteers in the field.
This project delivers a mobile-friendly web dashboard where volunteers can enter gift cards, track spending, view real-time store totals, and monitor donation distribution metrics.


## Features

| Area | What it does |
|---|---|
| **Dashboard** | Per-store tallies, category breakdowns, summary stats, and charts at a glance |
| **Card Entry** | Add cards by store, last 4 digits, and amount — with duplicate detection |
| **Spending Tracker** | Search a card, record a spend or donation-out, view full transaction history |
| **Donations Log** | Track total donations given out by count, dollar value, date, and volunteer |
| **Bulk Import** | CSV upload to migrate the existing spreadsheet in one shot |
| **Admin Panel** | Manage stores, users, and data — edit and delete with role-based access |

---


---

## Architecture

```
Browser (Next.js SSR + React)
        │
        ▼
Next.js API Routes
        │
        ▼
  Prisma ORM  ──►  PostgreSQL (Neon / Supabase)

GitHub ──► GitHub Actions (CI) ──► Vercel
                                    ├── Preview Deploy (per PR)
                                    └── Production Deploy (main)
```

---
=======
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
>>>>>>> 769409a5ac7f17c0beed8058e52bed64807ce8e1
