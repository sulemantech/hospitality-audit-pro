# Bee Hospitality Audit Pro

Internal operations platform for Bee Hospitality Group (Cyprus) — complaint tracking, review intelligence, AI-generated action plans, and financial oversight across 5 properties.

Built with Next.js 14, Supabase, Vercel AI SDK + Gemini 2.5 Flash.

## Demo Credentials

| Field | Value |
|---|---|
| Email | `admin@beegroup.com` |
| Password | `admin@1234` |

## Stack

- **Framework**: Next.js 14 App Router
- **Database**: Supabase (PostgreSQL + RLS)
- **AI**: Google Gemini 2.5 Flash via Vercel AI SDK
- **Deployment**: Vercel (Hobby)
- **UI**: Tailwind CSS + shadcn/ui

## Environment Variables

Create a `.env.local` file with:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database Migrations

Run migrations in order via Supabase SQL Editor:

1. `supabase/migrations/001_core_schema.sql`
2. `supabase/migrations/002_seed_data.sql`
3. `supabase/migrations/003_keyword_flagging.sql`
4. `supabase/migrations/004_content_hash_unique.sql`
5. `supabase/migrations/005_action_plans.sql`

## Features

- **Dashboard** — property health scores, active alerts, recent complaints
- **Complaints** — log, track, and resolve guest issues with timeline
- **Reviews** — CSV import (Google Reviews format), sentiment analysis, keyword flagging
- **Action Plan** — AI-generated prioritised task list from live data, persisted and team-visible
- **Reports** — printable 30-day operational audit summary
- **Financials** — OTA commission analysis, supplier benchmarking, utility costs
- **Settings** — property management, system info
