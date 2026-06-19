# 🐝 Bee Hospitality Audit System — Project Backlog

## What Is This System?

Bee Hospitality Audit System is an internal operational intelligence platform built for a Cyprus-based hospitality group managing **5 properties** — 2 hostels (Bee Hostel Paphos, Bee Hostel Limassol) and 3 hotels — under a single owner.

The core problem it solves: guest complaints get lost on paper and WhatsApp, bad review patterns (bedbugs, broken AC, hot water issues) go unnoticed until they become 1-star reviews, financial leakage from OTA commissions and retail procurement goes unmeasured, and when a key staff member is off, operational consistency collapses.

**What the system does:**

| Module | What it does | Why it matters |
|---|---|---|
| **Complaint Register** | Staff log complaints digitally. Auto-escalates if unresolved past SLA. Full timeline per issue. | Replaces WhatsApp/paper. Nothing falls through the cracks. |
| **Review Analytics** | Import guest reviews (Google, Booking.com, Tripadvisor) via CSV. Auto-flag critical keywords (bedbug, AC, hot water). Track sentiment trends. | Catch a bedbug pattern after 2 mentions — before it becomes a health-code closure. |
| **Financial Leak Tracker** | Manually log revenue by OTA channel. Compare supplier costs (retail vs wholesale). Flag utility bill spikes. | Surfaces €138K/yr in OTA commissions and €2,600+/yr in procurement savings. |
| **Executive Dashboard** | One-screen overview of all 5 properties: ratings, open issues, revenue, alerts. Color-coded (red/yellow/green). | Owner's 2-minute morning briefing across the entire portfolio. |
| **Action Plan Generator** | Rule engine turns open complaints + review flags + financial findings into a prioritised task list with owners and deadlines. | Turns data into decisions. No more "what do we fix first?" |
| **Reports & Export** | Printable audit report (PDF via browser) + CSV exports for all modules. | Stakeholder and investor reporting in one click. |

**Phase 2 (post-MVP):** Claude Haiku AI enriches review analysis — catching nuanced complaints that keywords miss (e.g. "uninvited guests in the night" → bedbug infestation), drafting professional review responses, and generating weekly AI insight summaries per property.

**Who uses it:**

| Role | What they do in the system |
|---|---|
| Owner / Admin | Morning dashboard check, approve action plans, view financials, export reports |
| Property Manager (e.g. Christos) | Log and resolve complaints, assign tasks, monitor staff, run shift reports |
| Front Desk Staff (e.g. Chris) | Log new complaints, update status, view assigned tasks |
| Financial Controller | Enter revenue data, review commission analysis, export financial reports |
| Viewer (investor / consultant) | Read-only access to reports and dashboards |

> **Stack:** Next.js 14 (App Router) · TypeScript · Tailwind · shadcn/ui · Supabase · Recharts · Resend  
> **Deploy:** Vercel free tier + Supabase free tier  
> **Track:** Check boxes as you go. Push to GitHub anytime with `./scripts/create-github-issues.ps1`

---

## 🚀 FAST TRACK — Core-First Sprint Order

> Build in this exact sequence. Each sprint delivers something the client can use immediately.

### Sprint 1 — "Working System" (Days 1–10) ✦ CORE
> Goal: Client can log in, log complaints, and see a live dashboard. Immediate operational value.

| # | Task | Size | Why core |
|---|---|---|---|
| 1 | W1-1 Project scaffold | M | Nothing runs without this |
| 2 | W1-2 Supabase setup | S | DB foundation |
| 3 | W1-3 Database schema | XL | Everything else depends on this |
| 4 | W1-4 Keep-alive ping | S | Prevents free tier shutdown — do early |
| 5 | W1-6 Auth: login/logout/reset | L | Gate to the entire system |
| 6 | W1-7 RBAC: RLS policies | XL | Security before any data entry |
| 7 | W1-9 Property management | M | Needed before anything else |
| 8 | W1-8 User management | L | Invite the client's team |
| 9 | W1-10 App shell layout | S | Users need a navigable interface |
| 10 | W1-5 Seed data | L | Demo-ready on Day 7 |
| 11 | W2-1 Complaint list | M | Core daily workflow |
| 12 | W2-2 New complaint form | L | Core daily workflow |
| 13 | W2-3 Complaint detail + timeline | L | Core daily workflow |
| 14 | W3-5 Executive dashboard | XL | Owner's morning routine |
| 15 | W3-6 Alert panel | L | Owner needs to see critical issues |

**Sprint 1 Deliverable:** Owner logs in, sees 5 properties on dashboard, staff logs complaints, owner sees alerts.

---

### Sprint 2 — "Review Intelligence" (Days 11–17) ✦ CORE
> Goal: Import reviews, auto-detect patterns (bedbugs, AC), generate first action plan.

| # | Task | Size | Why core |
|---|---|---|---|
| 16 | W2-6 CSV import wizard | L | Get real review data in |
| 17 | W2-8 Keyword flagging engine | L | The AI-lite intelligence layer |
| 18 | W2-9 Alert generation | M | Connects reviews → dashboard alerts |
| 19 | W2-10 Sentiment scoring | M | Review quality overview |
| 20 | W3-9 Review analytics dashboard | M | See patterns visually |
| 21 | W3-10 Action plan rules engine | XL | Turns data into action |
| 22 | W3-11 Action plan view | L | Where the owner acts |

**Sprint 2 Deliverable:** Import 50 reviews, see bedbug alert, generate first action plan in 3 clicks.

---

### Sprint 3 — "Financial Visibility" (Days 18–23) ✦ HIGH VALUE
> Goal: Owner sees where money is leaking — OTA commissions and supplier costs.

| # | Task | Size | Why valuable |
|---|---|---|---|
| 23 | W3-1 Revenue entry form | L | Core financial data entry |
| 24 | W3-2 Supplier price comparison | M | Quick wins — save €2K+/year |
| 25 | W3-3 Utility readings + spike | M | Catch the hidden leaks |
| 26 | W3-4 Financial leak dashboard | XL | The ROI justification screen |
| 27 | W3-7 Property comparison | M | Owner's strategic view |
| 28 | W3-8 Dashboard filters | M | Makes dashboard actually useful |

**Sprint 3 Deliverable:** Owner sees €138K lost to OTA commissions. Supplier savings identified. Full dashboard functional.

---

### Sprint 4 — "Polish & Ship" (Days 24–28) ✦ QUALITY
> Goal: Production-ready. Client can use it daily without friction.

| # | Task | Size |
|---|---|---|
| 29 | W2-4 Photo upload (complaints) | M |
| 30 | W2-5 Auto-escalation | S |
| 31 | W2-7 Review list view | M |
| 32 | W2-11 Review detail + highlights | S |
| 33 | W4-1 CSV export (all modules) | M |
| 34 | W4-2 Audit report printable | L |
| 35 | W4-4 Mobile responsive audit | L |
| 36 | W4-5 Loading/empty/error states | M |
| 37 | W4-6 Vercel production deploy | L |
| 38 | W4-7 Performance (Lighthouse ≥80) | M |
| 39 | W4-8 Client onboarding guide | M |
| 40 | W4-9 Security + GDPR basics | S |
| 41 | W4-3 Email notifications (Resend) | M |

**Sprint 4 Deliverable:** Live on Vercel. Client trained. System in daily use.

---

### Phase 2 — "AI Layer" (Post-validation)
> Start only after client confirms value. ~2-3 weeks extra.

P2-1 → P2-2 → P2-3 → P2-4 → P2-5 → P2-6

---

## Label Key
| Label | Meaning |
|---|---|
| `p0` `p1` `p2` `p3` | Priority: Critical / High / Medium / Low |
| `XS` `S` `M` `L` `XL` | Size: <2h / 2-4h / 4-8h / 1-2d / 2-3d |
| `epic` `feature` `chore` `bug` | Issue type |
| `infra` `auth` `complaints` `reviews` `financials` `dashboard` `action-plan` `reports` `ai` | Module |
| `week-1` `week-2` `week-3` `week-4` `phase-2` | Milestone |

---

## Progress Overview
| Milestone | Total | Done | Remaining |
|---|---|---|---|
| Week 1 — Foundation | 10 | 0 | 10 |
| Week 2 — Core Operations | 11 | 0 | 11 |
| Week 3 — Intelligence Layer | 11 | 0 | 11 |
| Week 4 — Polish & Deploy | 9 | 0 | 9 |
| Phase 2 — AI Layer | 6 | 0 | 6 |
| **Total** | **47** | **0** | **47** |

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## EPICS (Reference Issues)
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- [ ] **E-1** `epic` `infra` — Foundation & Infrastructure
- [ ] **E-2** `epic` `auth` — User Authentication & RBAC
- [ ] **E-3** `epic` `complaints` — Complaint Register
- [ ] **E-4** `epic` `reviews` — Review Analytics
- [ ] **E-5** `epic` `financials` — Financial Leak Tracker
- [ ] **E-6** `epic` `dashboard` — Executive Dashboard
- [ ] **E-7** `epic` `action-plan` — Action Plan Generator
- [ ] **E-8** `epic` `reports` — Reports & Export
- [ ] **E-9** `epic` `ai` — Phase 2: AI Layer (Claude Integration)

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## WEEK 1 — Foundation
### Target: Day 1–7
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### Module: Infrastructure

- [ ] **W1-1** `p0` `M` `chore` `infra` `week-1`
  **Project scaffold: Next.js 14 + TypeScript + Tailwind + shadcn/ui**
  Init monorepo with `create-next-app --typescript`. Configure tsconfig strict mode, install Tailwind, init shadcn/ui with neutral base, setup path aliases (`@/`). Add `.env.local` template.
  > ✅ Done when: `npm run dev` runs, shadcn `Button` renders on `/`, `npm run build` passes with 0 errors.

- [ ] **W1-2** `p0` `S` `chore` `infra` `week-1`
  **Supabase: Create dev + prod projects, set env vars**
  Create two Supabase projects (dev, prod). Store `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`. Set up Vercel env vars for prod.
  > ✅ Done when: Supabase client connects without error from Next.js API route.

- [ ] **W1-3** `p0` `XL` `chore` `infra` `week-1`
  **Database schema: Full migration set in Supabase**
  Write and run SQL migrations for all core tables: `properties`, `users` (extends auth.users), `complaints`, `complaint_updates`, `reviews`, `review_keywords`, `financial_entries`, `supplier_prices`, `utility_readings`, `tasks`, `alerts`, `attachments`, `audit_logs`. Include all ENUMs, FK constraints, indexes on `property_id` + `created_at`.
  > ✅ Done when: All tables visible in Supabase Studio, foreign keys enforced, seed script runs without error.

- [ ] **W1-4** `p0` `M` `chore` `infra` `week-1`
  **Supabase keep-alive: Prevent 7-day free-tier pause**
  Create a Supabase Edge Function `keep-alive` that runs a lightweight SELECT. Register with UptimeRobot (free) to ping every 5 minutes. Document setup in README.
  > ✅ Done when: UptimeRobot shows green. Supabase project stays active through a weekend with no manual logins.

- [ ] **W1-5** `p0` `L` `feature` `infra` `week-1`
  **Seed data: 5 properties + demo users for all roles**
  SQL seed script inserting: 5 properties (2 hostels, 3 hotels), 5 demo users (1 per role: Admin, Manager, Staff, Viewer + 1 extra Manager), 10 sample complaints, 20 sample reviews, basic financial entries. All with realistic Cypriot hospitality data.
  > ✅ Done when: `npm run seed` populates all tables. Dashboard shows non-empty state on first load.

### Module: Authentication & RBAC

- [ ] **W1-6** `p0` `L` `feature` `auth` `week-1`
  **Auth: Email/password login, logout, forgot password**
  Implement Supabase Auth with `@supabase/ssr`. Login page (`/login`), logout action, forgot-password page (`/forgot-password`) with email link. Auth middleware protecting all `/dashboard/*` routes. Redirect to dashboard on success.
  > ✅ Done when: Login/logout cycle works. Password reset email received and link valid. Unauthenticated users redirected to `/login`.

- [ ] **W1-7** `p0` `XL` `feature` `auth` `week-1`
  **RBAC: Supabase Row Level Security for 4 roles**
  Define roles: `admin`, `manager`, `staff`, `viewer`. Write RLS policies for every table. Admin: full access all properties. Manager: read/write assigned property only. Staff: create complaints + update assigned, no financials. Viewer: read-only all properties, no user management. Store `role` + `property_id` in `public.profiles` linked to `auth.users`.
  > ✅ Done when: Each role tested in Supabase Studio. Manager cannot read another property's data. Staff cannot access financials. Viewer cannot create records.

- [ ] **W1-8** `p0` `L` `feature` `auth` `week-1`
  **User management: Admin CRUD for users + role assignment**
  Admin-only page `/dashboard/users`. List all users (name, email, role, assigned property). Create user (invite by email), edit role/property, deactivate. Use Supabase Admin client for user creation. Show role badge colours.
  > ✅ Done when: Admin can invite user by email. User receives email and can set password. Admin can change role. Deactivated user cannot log in.

- [ ] **W1-9** `p0` `M` `feature` `infra` `week-1`
  **Property management: Admin CRUD for properties**
  Admin-only page `/dashboard/properties`. List all properties with type badge (Hostel 🏠 / Hotel 🏨). Create/edit property form: name, type, location, status (active/inactive), description. Properties used as FK across all modules.
  > ✅ Done when: Admin creates a new property. It appears in all property dropdowns across the app. Inactive property hidden from non-admin dropdowns.

- [ ] **W1-10** `p1` `S` `chore` `infra` `week-1`
  **Layout: App shell with sidebar, topbar, mobile nav**
  Persistent sidebar (desktop) with nav items: Dashboard, Complaints, Reviews, Financials, Action Plan, Reports. Collapsible on mobile (hamburger → drawer). Topbar: property context switcher (Admin sees all, others see assigned), user avatar + logout. Active route highlighting.
  > ✅ Done when: All nav items route correctly. Mobile drawer opens/closes. Property switcher persists selection in URL param or cookie.

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## WEEK 2 — Core Operations
### Target: Day 8–14
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### Module: Complaint Register

- [ ] **W2-1** `p0` `M` `feature` `complaints` `week-2`
  **Complaint list view: Filterable, sortable table**
  Page `/dashboard/complaints`. Table columns: ID, Property, Category, Priority (badge), Status (badge), Reported By, Created At, Days Open. Filters: property (dropdown), status, priority, category, date range. Sort by any column. Pagination (20/page). Show open count in page header.
  > ✅ Done when: Filters combine correctly (AND logic). Sort persists on filter change. 0-complaint state shows empty illustration.

- [ ] **W2-2** `p0` `L` `feature` `complaints` `week-2`
  **New complaint form: Full data entry with validation**
  Modal or page `/dashboard/complaints/new`. Fields: Property*, Category* (dynamic based on property type — hostel vs hotel categories), Priority* (Critical/High/Medium/Low), Guest Name, Room/Bed, Source (Guest Report/Staff Observation/Review), Description* (min 20 chars). Zod schema validation. Auto-set `reported_by` to current user.
  > ✅ Done when: Form rejects empty required fields with inline errors. Hostel shows hostel categories, hotel shows hotel categories. Submission creates record and redirects to detail view.

- [ ] **W2-3** `p0` `L` `feature` `complaints` `week-2`
  **Complaint detail view + activity timeline**
  Page `/dashboard/complaints/[id]`. Header: ID, property, status badge, priority badge, days open. Description section. Activity timeline (chronological): logged, updated, escalated, resolved — each entry shows user + timestamp + note. Action buttons: Add Update, Escalate, Resolve, Close (role-gated).
  > ✅ Done when: Timeline updates in real-time after adding an update. Resolve button moves status to Resolved and logs timestamp. Escalation changes priority and notifies.

- [ ] **W2-4** `p1` `M` `feature` `complaints` `week-2`
  **Photo upload with client-side compression**
  Attach photos to complaints. Client-side compress to <500KB using `browser-image-compression` before upload to Supabase Storage bucket `complaint-photos`. Show thumbnail in complaint detail. Support up to 3 photos per complaint. Delete individual photos (Admin/Manager only).
  > ✅ Done when: 8MB phone photo compressed and uploaded in <5 seconds. Thumbnail visible in detail view. Photos survive page refresh (stored in Supabase, not temp URLs).

- [ ] **W2-5** `p1` `S` `feature` `complaints` `week-2`
  **Auto-escalation: Flag complaints overdue by priority**
  Supabase scheduled function (or nightly cron via Vercel): Critical > 1 day → flag as overdue, High > 2 days → flag, Medium > 5 days → flag. Write `alert` record on escalation. Show overdue badge in complaint list (🔴 red border).
  > ✅ Done when: A complaint created 2+ days ago with High priority shows overdue badge without manual action.

### Module: Review Analytics

- [ ] **W2-6** `p0` `L` `feature` `reviews` `week-2`
  **CSV import wizard: Drag & drop, column mapping, validation**
  Page `/dashboard/reviews/import`. Step 1: Upload CSV (drag & drop or file picker). Step 2: Map CSV columns to schema fields (reviewer_name, rating, text, date, source, property). Step 3: Preview first 5 rows. Step 4: Import with progress bar. Handle duplicates (skip by hash of text+date+property). Show import summary (imported / skipped / errored).
  > ✅ Done when: Upload a 50-row Google export CSV. All rows imported correctly. Re-importing same file shows 0 new, 50 skipped.

- [ ] **W2-7** `p2` `M` `feature` `reviews` `week-2`
  **Review list view: Search, filter, sort**
  Page `/dashboard/reviews`. Table: Property, Reviewer, Rating (stars), Snippet (first 80 chars), Source badge, Date, Flags count. Search by text content. Filter: property, source, rating range, date range, flagged only. Sort by date, rating, flags.
  > ✅ Done when: Text search returns reviews containing the query. Flagged-only filter shows only reviews with ≥1 keyword match.

- [ ] **W2-8** `p0` `L` `feature` `reviews` `week-2`
  **Keyword flagging engine: Configurable + SQL-based**
  Admin-configurable keyword list stored in DB table `review_keywords` (keyword, category, severity: critical/warning/positive, threshold). On review import/insert, run SQL function to match keywords (case-insensitive, partial match) and write matches to `review_keyword_matches`. Default keywords: bedbug, bed bug, ac, air conditioning, hot water, curtain, dirty, smell, noise, chris, clean, value. Positive keywords tracked separately.
  > ✅ Done when: Review containing "found a bedbug" → matched to `bedbug` keyword with `critical` severity. Keyword admin page shows add/edit/delete.

- [ ] **W2-9** `p0` `M` `feature` `reviews` `week-2`
  **Alert generation: Threshold-based rules**
  Supabase DB trigger or function: when `review_keyword_matches` count for a keyword crosses threshold (configurable, default: critical=2, warning=5 in 30 days), insert into `alerts` table (property_id, keyword, severity, message, count, period). Alerts visible in dashboard alert panel. Auto-resolve alerts when count drops below threshold.
  > ✅ Done when: Import 3 reviews with "bedbug" → CRITICAL alert created for that property. Dashboard alert panel shows it immediately.

- [ ] **W2-10** `p1` `M` `feature` `reviews` `week-2`
  **Keyword scoring: Simple sentiment without AI**
  Per review: count positive keyword matches vs negative keyword matches. Score = (positive_count - negative_count) / total_keywords. Classify: score > 0.3 → Positive, -0.3 to 0.3 → Neutral, < -0.3 → Negative. Store `sentiment` enum on review row. Used in analytics dashboard.
  > ✅ Done when: Review with "great staff, clean rooms, loved Chris" → Positive. Review with "bedbug, ac broken, dirty" → Negative.

- [ ] **W2-11** `p1` `S` `feature` `reviews` `week-2`
  **Review detail view: Full text + keyword highlights**
  Click row in review list → expand or navigate to detail. Show: full review text with matched keywords highlighted (coloured spans), reviewer name, date, source, property, star rating, sentiment badge, all keyword matches listed.
  > ✅ Done when: "bedbug" in review text rendered with red highlight. Keyword match list shows category + severity.

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## WEEK 3 — Intelligence Layer
### Target: Day 15–21
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### Module: Financial Tracker

- [ ] **W3-1** `p0` `L` `feature` `financials` `week-3`
  **Revenue entry form: Manual revenue + OTA channel logging**
  Page `/dashboard/financials/revenue/new`. Fields: Property*, Period (month/year)*, Channel* (Direct/Booking.com/Expedia/Agoda/Airbnb/Other), Gross Revenue (€)*, Commission Rate (% — auto-fill from channel defaults: Booking.com=15%, Expedia=15%), Net Revenue (auto-calc). Submit creates `financial_entries` row with type=`revenue`. List view shows all entries with edit/delete (Manager+).
  > ✅ Done when: Enter €10,000 revenue on Booking.com → commission auto-fills to 15% → net shows €8,500. Edit an entry updates totals in dashboard.

- [ ] **W3-2** `p1` `M` `feature` `financials` `week-3`
  **Supplier price comparison form: Current vs potential**
  Page `/dashboard/financials/suppliers`. Form: Item name*, Unit*, Current Supplier, Current Cost (€/unit)*, Potential Supplier, Potential Cost (€/unit)*, Monthly Usage (units)*. Auto-calc: Monthly Saving, Annual Saving, % Saving. Table shows all items sorted by annual saving desc. Total savings row at bottom.
  > ✅ Done when: Enter milk data (current €2/litre vs potential €1.20/litre, 60 litres/month) → shows €48/month, €576/year, 40% saving.

- [ ] **W3-3** `p1` `M` `feature` `financials` `week-3`
  **Utility readings: Entry + spike detection**
  Form to log utility readings: Property*, Utility type (Electricity/Water/Gas)*, Period*, Amount (€)*, Units consumed. After insert, DB function compares to 3-month rolling average. If >30% above average → insert WARNING alert, if >60% → CRITICAL alert. Readings table with spike indicator.
  > ✅ Done when: Log water bill of €551 against baseline of €120 → CRITICAL alert "Water bill 359% above baseline — check for leaks."

- [ ] **W3-4** `p0` `XL` `feature` `financials` `week-3`
  **Financial leak dashboard: Full view**
  Page `/dashboard/financials`. Tabs: Revenue Summary | Supplier Savings | Utility Spikes. Revenue tab: table per property (Gross / Commission / Net / % Lost), totals row, period selector (month/quarter/year). Supplier tab: savings table with total potential saving. Utility tab: readings list with spike badges. Three KPI cards at top: Total Revenue, Total Commissions Lost (€ + %), Potential Annual Savings.
  > ✅ Done when: Switching period (Month → Quarter → Year) recalculates all figures correctly. Empty state shows "Add your first revenue entry" prompt.

### Module: Executive Dashboard

- [ ] **W3-5** `p0` `XL` `feature` `dashboard` `week-3`
  **Executive dashboard: KPI cards + property overview table**
  Page `/dashboard` (root). Top row: 4 KPI cards (Overall Rating avg across properties, Open Issues count, Revenue YTD, Commissions Lost YTD). Below: Property Overview table (Property Name, Type badge, Rating, Open Issues, Open Complaints, Revenue MTD, Trend ▲▼). All data from DB aggregations, not hardcoded.
  > ✅ Done when: Adding a new complaint increments "Open Issues" card without page refresh (or after manual refresh). Revenue card updates when new financial entry added.

- [ ] **W3-6** `p0` `L` `feature` `dashboard` `week-3`
  **Alert panel: Real-time, color-coded, severity sorted**
  Alert panel on dashboard. Pulls from `alerts` table. Color: CRITICAL=red bg, HIGH=amber, LOW=green. Sorted: critical first, then by `created_at` desc. Each alert: severity badge, property name, message, age (e.g. "3 days ago"). Dismiss button (marks `acknowledged_at`). "View all" link → `/dashboard/alerts`.
  > ✅ Done when: CRITICAL alerts always appear above HIGH. Dismissing an alert removes it from panel without page reload (optimistic update).

- [ ] **W3-7** `p1` `M` `feature` `dashboard` `week-3`
  **Property comparison view: Side-by-side metrics**
  Page `/dashboard/comparison`. Select up to 5 properties via multi-select. Show comparison table: rows = metrics (Avg Rating, Open Complaints, Open Issues, Reviews This Month, Revenue MTD, Commission Rate, Sentiment % Positive). Columns = selected properties. Highlight best (green) and worst (red) per row. Bar chart via Recharts for visual comparison.
  > ✅ Done when: Select 3 properties — table shows all metrics. Best value per row highlighted green.

- [ ] **W3-8** `p1` `M` `feature` `dashboard` `week-3`
  **Filters: Date range picker + property type toggle**
  Global filter bar on dashboard: Date range picker (presets: This Month, Last Month, This Quarter, This Year, Custom). Property type toggle: All / Hostel only / Hotel only. Selections update all dashboard widgets. Persist in URL query params so links are shareable.
  > ✅ Done when: Selecting "Last Quarter" + "Hostel only" updates KPI cards, property table, and alert panel to match filters.

- [ ] **W3-9** `p1` `M` `feature` `reviews` `week-3`
  **Review analytics dashboard: Sentiment + keyword flags + source chart**
  Page `/dashboard/reviews/analytics`. Sentiment donut chart (% Positive/Neutral/Negative). Keyword Flags table: Keyword | Mentions | Trend (▲/▼ vs prior period) | Severity | Suggested Action. Source breakdown bar chart (Google / Booking / Tripadvisor / Trip.com / Other). Filter by property + date range.
  > ✅ Done when: Keyword table shows `bedbug: 4 mentions ⬆ CRITICAL — Professional treatment required`. Source chart percentages sum to 100%.

### Module: Action Plan Generator

- [ ] **W3-10** `p0` `XL` `feature` `action-plan` `week-3`
  **Action plan rules engine + task generation**
  Rule-based engine (Supabase function or Next.js API route): 
  - Any open CRITICAL complaint > 0 days → generate Critical task
  - Any CRITICAL keyword alert → generate Critical task
  - Any HIGH complaint > 2 days unresolved → generate High task
  - Any supplier saving > €50/month → generate Medium task
  - Any utility spike CRITICAL → generate High task
  De-duplicate: same source complaint → same task (upsert by `source_ref`). Generate task with title, description, source reference, suggested owner, cost estimate (from complaint/financial data if available), suggested deadline.
  > ✅ Done when: Running engine with 4 bedbug reviews + 1 overdue AC complaint generates exactly 2 tasks (bedbug: Critical, AC: Critical). Re-running doesn't create duplicates.

- [ ] **W3-11** `p0` `L` `feature` `action-plan` `week-3`
  **Action plan dashboard view + task management**
  Page `/dashboard/action-plan`. "Generate Plan" button triggers rules engine. Tasks grouped by priority (Critical → High → Medium → Low). Per task card: checkbox, title, source, owner (assign dropdown), cost estimate, target date, progress bar (0-100% slider). Filter by property + priority. Completed tasks move to "Resolved" section.
  > ✅ Done when: Clicking "Generate Plan" produces tasks within 3 seconds. Updating progress to 100% moves task to Resolved. Owner assignment saves to DB.

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## WEEK 4 — Polish & Deploy
### Target: Day 22–28
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### Module: Reports & Export

- [ ] **W4-1** `p1` `M` `feature` `reports` `week-4`
  **CSV export: Complaints, Reviews, Financials, Action Plan**
  Export buttons on each module's list page. Generate CSV client-side using `papaparse`. Complaints CSV: all filtered rows with all fields. Reviews CSV: review text, rating, source, sentiment, flags, date. Financials CSV: revenue entries per property with commission calcs. Action plan CSV: tasks with priority, owner, deadline, progress. Filename includes property name + date range.
  > ✅ Done when: Exporting 50 complaints produces valid CSV that opens in Excel. Columns match what's shown in the table.

- [ ] **W4-2** `p1` `L` `feature` `reports` `week-4`
  **Audit report: Full printable summary page**
  Page `/dashboard/reports/generate`. Select: property (or All), date range. Generates a structured page with sections: Executive Summary (KPI snapshot), Critical Findings (top 5 alerts), Financial Recommendations (supplier savings + commission loss), Complaint Summary table, Review Sentiment summary, Action Plan summary. Browser print (`window.print()`) with print-specific CSS (hide sidebar, clean layout). Option to "Save as PDF" via browser print dialog.
  > ✅ Done when: Generating report for "All Properties, This Quarter" renders all sections with real data. Print preview shows clean layout without nav elements.

- [ ] **W4-3** `p2` `M` `feature` `reports` `week-4`
  **Email notifications: Resend integration for alerts + reports**
  Integrate Resend (free 3000 emails/month). Triggers: (1) New CRITICAL alert → email Admin + assigned Manager. (2) Complaint unresolved after threshold → email Manager. (3) Weekly summary report email (Sunday 8am) → email Admin. Use React Email templates for branded HTML emails.
  > ✅ Done when: Creating a CRITICAL alert sends email to admin within 60 seconds. Weekly summary email received with correct data snapshot.

### Module: Final Polish

- [ ] **W4-4** `p1` `L` `chore` `infra` `week-4`
  **Mobile responsive audit: All pages tested on 375px**
  Audit all pages on 375px (iPhone SE) and 768px (iPad). Fix: tables → card lists on mobile, filters → collapsible panel, charts → horizontal scroll container, forms → full-width inputs, action buttons → sticky bottom bar on mobile. Test on real device or Chrome DevTools.
  > ✅ Done when: Dashboard, Complaint list, Complaint form, Review analytics, Financial dashboard all usable on iPhone SE. No horizontal overflow. Tap targets ≥ 44px.

- [ ] **W4-5** `p1` `M` `chore` `infra` `week-4`
  **Loading states, empty states, error boundaries**
  Add skeleton loaders to all data tables and KPI cards. Empty state illustrations (with Tailwind/SVG) for: no complaints, no reviews, no financial data, no alerts. React error boundaries on all major page sections with "Something went wrong — try refreshing" fallback. Toast notifications (shadcn Toaster) for all create/update/delete actions.
  > ✅ Done when: Dashboard on slow network shows skeletons, not blank space. Deleting a complaint shows success toast. Broken API shows error boundary, not white screen.

- [ ] **W4-6** `p0` `L` `chore` `infra` `week-4`
  **Vercel production deployment: Config, env vars, domain**
  Deploy to Vercel. Configure all production env vars (Supabase prod project, Resend API key). Set up custom domain (if client has one) or use `.vercel.app` subdomain. Configure Vercel cron job (optional, for weekly email). Add `robots.txt` blocking indexing (internal tool). Test all auth flows on production URL.
  > ✅ Done when: Production URL loads, login works, all 5 properties seeded, all modules functional. No console errors on production.

- [ ] **W4-7** `p1` `M` `chore` `infra` `week-4`
  **Performance: Page load < 3 seconds, Lighthouse ≥ 80**
  Run Lighthouse on Dashboard, Complaints, and Reviews pages. Fix: add `next/image` for any images, add `Suspense` boundaries with streaming, add `loading.tsx` route segments, verify no N+1 queries (check Supabase logs), add DB indexes on `property_id` + `created_at` if missing, paginate all lists.
  > ✅ Done when: Lighthouse Performance ≥ 80 on all three pages. Dashboard with 5 properties + 50 reviews loads in < 3 seconds on 4G (Chrome throttling).

- [ ] **W4-8** `p1` `M` `chore` `infra` `week-4`
  **Client onboarding: Data seeding + staff training guide**
  Write `ONBOARDING.md` with: step-by-step Supabase Studio instructions to add real property names, how to invite staff users and assign roles, how to import Google Review CSV (with export instructions), how to log first complaint, how to run first action plan. Seed real property names (replace Hotel A/B/C with actual names once provided by client).
  > ✅ Done when: A non-technical person can follow ONBOARDING.md and have the system populated with real data in < 1 hour.

- [ ] **W4-9** `p1` `S` `chore` `infra` `week-4`
  **Security: GDPR basics + data protection**
  Add Privacy Notice to login page footer ("Guest data processed under GDPR Art. 6(1)(f)"). Add `audit_logs` entries for all create/update/delete on complaints and reviews (user_id, action, record_id, timestamp). Add data retention notice to report page ("Data retained for 5 years per policy"). Confirm Supabase data is stored in EU region.
  > ✅ Done when: Login page shows privacy notice. Every complaint edit creates an audit_log row. Supabase project region confirmed as EU (Frankfurt/Ireland).

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PHASE 2 — AI Layer
### Target: Month 2 (post-MVP validation)
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

> **Note:** Phase 2 only starts after client validates MVP and approves Phase 2 budget.  
> **AI Provider:** Claude Haiku 4.5 (fast, cheap, accurate). Est. cost: <€20/month at MVP scale.

- [ ] **P2-1** `p1` `L` `feature` `ai` `phase-2`
  **Claude API: Supabase Edge Function for review analysis**
  Create Supabase Edge Function `analyze-review`. On new review insert (DB trigger): call Claude Haiku 4.5 with review text → return `{ sentiment: "positive"|"neutral"|"negative", sentiment_score: 0-1, key_issues: string[], key_positives: string[], suggested_response: string }` as Zod-validated JSON. Write results back to review row. Catches nuanced complaints rule-based matching misses.
  > ✅ Done when: Review "the mattress situation was horrifying, we had uninvited guests in the night" → classified Negative, key_issues includes "bedbug" (inferred, not literally mentioned).

- [ ] **P2-2** `p1` `M` `feature` `ai` `phase-2`
  **AI sentiment override: Show AI vs rule-based sentiment**
  On review detail and analytics, show both: Rule-based sentiment badge + AI sentiment badge. Discrepancies flagged (e.g. rule-based = Neutral, AI = Negative). Admin can "confirm" which is correct → trains keyword list. Analytics: toggle between rule-based and AI sentiment breakdown.
  > ✅ Done when: Discrepancy badge visible where AI and rule-based disagree. Confirming AI sentiment creates new keyword rule suggestion.

- [ ] **P2-3** `p2` `L` `feature` `ai` `phase-2`
  **AI-generated review responses: Draft with one click**
  On review detail: "Draft Response" button. Calls Claude Haiku with: property name, review text, sentiment, key issues. Returns a professional, empathetic response draft (under 200 words). Editable text area pre-filled with draft. "Copy" button. Audit log records response draft generated (not sent — system does not post responses automatically).
  > ✅ Done when: Negative bedbug review → draft response acknowledges issue, apologises, states action taken. Draft is editable before copying.

- [ ] **P2-4** `p2` `L` `feature` `ai` `phase-2`
  **AI action plan enrichment: Better task descriptions**
  After rule-based engine generates tasks, pass each task to Claude Haiku with: issue type, property type (hostel/hotel), source reviews/complaints, cost estimate. Returns enriched description with: specific recommended action, estimated fix time, risk if ignored. Replace generic task body with AI-enriched version.
  > ✅ Done when: AC leak task gets enriched to: "Clear condensate drain line — 80% of AC leaks in Mediterranean climates are drain blockages. Fix time: 2 hours. Parts: <€30. Risk if ignored: ceiling water damage (€2,000+ repair) + 1-star review."

- [ ] **P2-5** `p2` `M` `feature` `ai` `phase-2`
  **AI weekly insight email: Automated Sunday summary**
  Extend weekly email: include AI-generated paragraph summarising the week's top 3 issues per property and one strategic recommendation. Calls Claude Haiku with aggregated weekly data. Tone: concise, professional, actionable (like a consultant's brief). Max 300 words per property.
  > ✅ Done when: Sunday email received with "This week at Bee Hostel Paphos: 4 bedbug mentions (up from 0 last week). Recommend thermal treatment before peak season..." section per property.

- [ ] **P2-6** `p3` `XL` `feature` `ai` `phase-2`
  **Google Reviews auto-import: CSV export guide + scheduled import**
  Since Google Reviews API requires Google Business Profile OAuth (complex), implement: (1) Detailed in-app guide with screenshots showing how to export reviews from Google Maps as CSV. (2) Scheduled import endpoint — upload CSV to Supabase Storage, trigger Edge Function to process on upload. (3) Duplicate detection on import. Future: if client gets Google API access, replace with live API.
  > ✅ Done when: Manager follows in-app guide, exports from Google, uploads CSV → reviews imported with correct property mapping in < 60 seconds.

---

## Notes & Decisions Log

| Date | Decision | Reason |
|---|---|---|
| 2026-06-19 | Next.js 14 over Vue/Django | Vercel native, single repo for frontend + API routes |
| 2026-06-19 | Supabase over raw PostgreSQL | Auth + RLS + Storage + Realtime built-in, free tier |
| 2026-06-19 | Client-side PDF via browser print | Avoids Vercel 10s serverless timeout for Puppeteer |
| 2026-06-19 | Rule-based AI for MVP | No AI API costs in MVP, Phase 2 adds Claude Haiku |
| 2026-06-19 | CSV import only (no OTA APIs) | Booking.com/Google APIs require partner agreements (weeks) |
| 2026-06-19 | UptimeRobot keep-alive | Supabase free tier pauses after 7 days inactivity |
| 2026-06-19 | Resend for email | Free 3000/month, React Email templates, simple API |
| 2026-06-19 | Phase 2 AI deferred | Validate business value in MVP first before API spend |
