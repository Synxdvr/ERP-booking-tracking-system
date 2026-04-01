# S'thetic Systems — Internal Booking System

## Prerequisites
- Node.js 18+
- Free [Supabase](https://supabase.com) account
- Free [Vercel](https://vercel.com) account

---

## Stage 1 — Supabase Setup

1. Go to supabase.com → New Project
   - Name: `sthetic-systems`
   - Region: Southeast Asia (Singapore)

2. SQL Editor → New Query → paste `supabase/migrations/001_initial_schema.sql` → Run
   This creates all tables, seeds rooms + staff, and sets RLS policies.

3. Enable Realtime:
   Database → Replication → supabase_realtime → Tables → toggle ON: `bookings`

4. Create users:
   Authentication → Users → Add User
   - admin@sthetic.com (strong password)
   - staff@sthetic.com (strong password)

   Then in SQL Editor:
   UPDATE users SET role = 'admin' WHERE email = 'admin@sthetic.com';

5. Settings → API → copy Project URL + anon public key

---

## Stage 2 — Local Setup

  npm install
  cp .env.local.example .env.local
  # Fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
  npm run dev
  # http://localhost:3000

---

## Stage 3 — Deploy to Vercel

  npm i -g vercel
  vercel

Add env vars in Vercel dashboard → Project → Settings → Environment Variables:
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY

---

## Accounts
| Role  | Email             |
|-------|-------------------|
| Admin | admin@sthetic.com |
| Staff | staff@sthetic.com |

Change passwords before sharing with the team.
