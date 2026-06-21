# Bee Hospitality Audit Pro

Internal operations platform for Bee Hospitality Group (Cyprus) — complaint tracking, review intelligence, AI-generated action plans, and financial oversight across 5 properties.

Built with Next.js 14, Supabase, Vercel AI SDK + Gemini 2.5 Flash.

## What This Is

Hotels and hostels deal with the same operational problems repeatedly — pest complaints, cleanliness failures, maintenance backlogs — but typically manage them through WhatsApp groups, paper logs, and spreadsheets. Problems fall through the cracks, patterns go unnoticed, and by the time an owner sees a Google review saying "cockroaches in room 12" the damage is already public.

**Bee Hospitality Audit Pro** is a command centre for the people who run the properties. It captures complaints the moment they happen, monitors guest reviews for emerging patterns, triggers alerts when the same issue is mentioned repeatedly, and uses AI to synthesise everything into a prioritised action plan — telling you exactly what to fix, who should fix it, and by when.

**The demo story in one sentence:** *A guest complained about a pest in room 14. Two weeks later, 6 Google reviews mention "bugs". The system flagged it, raised an alert, and the AI generated a critical task assigned to the Maintenance Team with a 1-day deadline — before the owner even knew there was a pattern.*

## Target Users

| Role | How they use it |
|---|---|
| **Owner / GM** | Morning dashboard check — any fires? What does AI say to prioritise today? |
| **Property Manager** | Log complaints as they come in, track resolution, monitor flagged reviews |
| **Front Desk** | Log a guest complaint in under 60 seconds without paperwork |
| **Maintenance Team** | See tasks assigned to them in the AI Action Plan |
| **Finance / Owner** | Financials page — OTA commission leakage, supplier savings, utility costs |

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

## Features (Current)

- **Dashboard** — property health scores, active alerts, recent complaints
- **Complaints** — log, track, and resolve guest issues with timeline
- **Reviews** — CSV import (Google Reviews format), sentiment analysis, keyword flagging
- **Action Plan** — AI-generated prioritised task list from live data, persisted and team-visible
- **Reports** — printable 30-day operational audit summary
- **Financials** — OTA commission analysis, supplier benchmarking, utility costs
- **Settings** — property management, system info

## The Golden Window Problem

Once a review is posted on Booking.com or Google it cannot be deleted — only responded to. The entire operational challenge is intercepting the guest in the **24–72 hour window** between a bad experience and a public review.

```
Guest has bad experience
        ↓
[GOLDEN WINDOW: 24–72 hours]  ←  act here
        ↓
Review posted on Booking.com  ←  damage is permanent
```

A guest who feels heard almost never posts a bad review. A guest who felt ignored almost always does.

## Proactive Communication Layer (Roadmap)

The current system is a high-quality dashboard — it shows what's happening when you open it. The next phase turns it into a system that **comes to you**, without requiring anyone to check in.

### What needs to be built

| Priority | Feature | What it prevents |
|---|---|---|
| 1 | **WhatsApp alerts on critical complaints** | Manager learns instantly, not hours later |
| 2 | **Auto-escalation if complaint unresolved after 2hrs** | Forgotten complaints that become bad reviews |
| 3 | **Guest follow-up reminder before checkout** | Guest leaves feeling heard — no public review |
| 4 | **Daily 8am owner digest** | Owner always knows the true situation without asking |
| 5 | **New flagged review alert** | Manager responds within 24hrs — platform ranking protected |
| 6 | **Recurring room/category detection** | Structural problems caught before they repeat |
| 7 | **Shift handover view** | Open complaints don't get lost between staff shifts |

### The full proactive loop

```
Guest complains to front desk
    ↓
Staff logs complaint (30 seconds)
    ↓
WhatsApp → Property Manager: "Critical. Room 14. Pest. Just now."
    ↓
Manager resolves it, marks done in system
    ↓
If NOT resolved in 2hrs → WhatsApp → Owner: "Still open."
    ↓
Guest checked out feeling heard → no public review
    ↓
If review posted anyway → AI flags it → WhatsApp → Manager:
"New negative review mentions 'pest'. Respond within 24hrs."
    ↓
Owner receives 8am digest: "Yesterday — 2 complaints, both resolved.
1 new flagged review. AI recommends: Room 14 inspection."
```

### Why WhatsApp, not email

Property managers and owners in the Cyprus/MENA hospitality market operate primarily on WhatsApp. Email digests get read hours later or ignored. A WhatsApp message at 2pm on an unresolved critical complaint gets acted on in minutes. The integration target is **WhatsApp Business API**.

## Current System Limitation

Right now the system is **reactive** — it responds to events already logged. Every feature in the roadmap above moves it toward **proactive** — the system detects, escalates, and communicates without anyone having to remember to check a dashboard.
