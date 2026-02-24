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
| **Mobile-First** | Built for volunteers in the field on their phones |

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
