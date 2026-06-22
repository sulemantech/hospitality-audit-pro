# Bee Hospitality Audit Pro — Claude Instructions

## Collaboration style
We work in pair programming mode. Before making any change:
1. Explain **what** is broken or needs changing and **why**
2. Show a before/after of the key code being changed
3. After the change, summarize what was fixed and what to test

Never make silent changes. Always narrate what you're doing as you do it.

## Stack
- Next.js 14 App Router (TypeScript)
- Supabase (Postgres + Auth + RLS)
- Tailwind CSS + shadcn/ui
- Vercel (free tier) for deployment
- Google Gemini (gemini-2.5-flash) via AI SDK for action plans
- Resend for email notifications (free tier — send only to metafront.net@gmail.com until domain verified)
- ntfy.sh for push notifications (topic: bee-audit-alerts-2026, use JSON body format)

## Security rules (never break these)
- Real credentials go in `.env.local` only — never commit them
- `.env.local.example` must contain placeholder values only
- `SUPABASE_SERVICE_ROLE_KEY` is server-only — never expose to client
- `GOOGLE_GENERATIVE_AI_API_KEY` is server-only
- `RESEND_API_KEY` is server-only

## Next.js rules
- All pages that use Supabase must have `export const dynamic = "force-dynamic"` to prevent prerender failures on Vercel
- Event handlers (`onClick`, etc.) cannot be in Server Components — extract to a `"use client"` component
- Use `createAdminClient()` (service role) for all server-side queries to bypass RLS

## Notifications
- ntfy push: use JSON body format (not HTTP headers) — headers are ASCII-only and crash on emoji
- Resend email: `ALERT_EMAIL` must match the Resend-registered email until a domain is verified
- Notifications fire for critical, high, and medium severity complaints
- Always wrap notifications in `Promise.allSettled` so they never block the main flow
