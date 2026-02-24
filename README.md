# FixThe6ix

Overview
The WNH ReGiftcard Program tracks 50+ store brands and hundreds of individual gift cards — catalogued by last-4-digits, remaining balance, and redemption status. The current manual spreadsheet process is error-prone, hard to audit, and inaccessible for volunteers in the field.
This project delivers a mobile-friendly web dashboard where volunteers can enter gift cards, track spending, view real-time store totals, and monitor donation distribution metrics.

Key Features

Replace complex multi-tab spreadsheet with an intuitive web dashboard
Gift card entry: store type, last 4 digits, dollar amount
Real-time per-store tallies on a main overview page
Dedicated spending and redemption tracking page
Track total donations given out (count & dollar value)
Mobile-friendly for volunteers in the field
CSV bulk import for migrating existing spreadsheet data
Admin panel for user and data management

Architecture
Browser (Next.js SSR + React)
        ↓
Next.js API Routes
        ↓
Prisma ORM → PostgreSQL

Vercel (Hosting) ← GitHub (Repo) ← GitHub Actions (CI) → Preview Deploys
