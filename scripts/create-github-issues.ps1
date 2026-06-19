# ============================================================
# Bee Hospitality Audit System — Bulk GitHub Issue Creator
# ============================================================
# Prerequisites:
#   1. Install GitHub CLI: winget install --id GitHub.cli
#   2. Authenticate:       gh auth login
#   3. Run this script:    .\scripts\create-github-issues.ps1
#
# The script creates: labels → milestones → epics → all issues
# Safe to re-run: gh handles duplicate labels/milestones gracefully
# ============================================================

$REPO = "sulemantech/hospitality-audit-pro"

Write-Host "`n🐝 Bee Hospitality — Creating GitHub Issues" -ForegroundColor Yellow
Write-Host "Repository: $REPO`n" -ForegroundColor Cyan

# ============================================================
# STEP 1: LABELS
# ============================================================
Write-Host "📌 Step 1/4 — Creating labels..." -ForegroundColor Cyan

$labels = @(
    # Priority
    @{ name = "p0-critical";  color = "B60205"; description = "Must fix immediately — blocks launch" },
    @{ name = "p1-high";      color = "D93F0B"; description = "High priority — current sprint" },
    @{ name = "p2-medium";    color = "E4E669"; description = "Medium priority — next sprint" },
    @{ name = "p3-low";       color = "0E8A16"; description = "Low priority — backlog" },
    # Type
    @{ name = "epic";         color = "6E40C9"; description = "Top-level epic grouping issues" },
    @{ name = "feature";      color = "0075CA"; description = "New user-facing feature" },
    @{ name = "chore";        color = "E4E669"; description = "Infrastructure, setup, config" },
    @{ name = "bug";          color = "D73A4A"; description = "Something is broken" },
    # Module
    @{ name = "infra";        color = "BFD4F2"; description = "Infrastructure & DevOps" },
    @{ name = "auth";         color = "C5DEF5"; description = "Authentication & RBAC" },
    @{ name = "complaints";   color = "FBCA04"; description = "Complaint Register module" },
    @{ name = "reviews";      color = "F9D0C4"; description = "Review Analytics module" },
    @{ name = "financials";   color = "C2E0C6"; description = "Financial Leak Tracker module" },
    @{ name = "dashboard";    color = "E4E669"; description = "Executive Dashboard module" },
    @{ name = "action-plan";  color = "D4C5F9"; description = "Action Plan Generator module" },
    @{ name = "reports";      color = "BFD4F2"; description = "Reports & Export module" },
    @{ name = "ai";           color = "0E8A16"; description = "AI Layer — Claude integration" },
    # Size
    @{ name = "XS";           color = "EDEDED"; description = "Size: < 2 hours" },
    @{ name = "S";            color = "EDEDED"; description = "Size: 2-4 hours" },
    @{ name = "M";            color = "EDEDED"; description = "Size: 4-8 hours" },
    @{ name = "L";            color = "EDEDED"; description = "Size: 1-2 days" },
    @{ name = "XL";           color = "EDEDED"; description = "Size: 2-3 days" },
    # Milestone (also as labels for quick filtering)
    @{ name = "week-1";       color = "1D76DB"; description = "Milestone: Week 1 — Foundation" },
    @{ name = "week-2";       color = "1D76DB"; description = "Milestone: Week 2 — Core Operations" },
    @{ name = "week-3";       color = "1D76DB"; description = "Milestone: Week 3 — Intelligence Layer" },
    @{ name = "week-4";       color = "1D76DB"; description = "Milestone: Week 4 — Polish & Deploy" },
    @{ name = "phase-2";      color = "5319E7"; description = "Milestone: Phase 2 — AI Layer" }
)

foreach ($label in $labels) {
    $result = gh label create $label.name --color $label.color --description $label.description --repo $REPO 2>&1
    if ($result -match "already exists") {
        Write-Host "  ↩ Label '$($label.name)' already exists" -ForegroundColor DarkGray
    } else {
        Write-Host "  ✓ Label '$($label.name)'" -ForegroundColor Green
    }
}

# ============================================================
# STEP 2: MILESTONES
# ============================================================
Write-Host "`n📅 Step 2/4 — Creating milestones..." -ForegroundColor Cyan

$milestones = @(
    @{ title = "Week 1 — Foundation";           description = "Project scaffold, DB schema, auth, RBAC, properties, users, seed data" },
    @{ title = "Week 2 — Core Operations";      description = "Complaint register, review import, keyword flagging, alerts" },
    @{ title = "Week 3 — Intelligence Layer";   description = "Financial tracker, executive dashboard, review analytics, action plan engine" },
    @{ title = "Week 4 — Polish & Deploy";      description = "Export, reports, mobile polish, performance, Vercel deploy, onboarding" },
    @{ title = "Phase 2 — AI Layer";            description = "Claude Haiku integration, AI sentiment, response drafting, enriched action plans" }
)

foreach ($ms in $milestones) {
    $result = gh api repos/$REPO/milestones --method POST -f title=$ms.title -f description=$ms.description 2>&1
    if ($result -match "already_exists" -or $result -match "Validation Failed") {
        Write-Host "  ↩ Milestone '$($ms.title)' already exists" -ForegroundColor DarkGray
    } else {
        Write-Host "  ✓ Milestone '$($ms.title)'" -ForegroundColor Green
    }
}

# ============================================================
# STEP 3: EPICS
# ============================================================
Write-Host "`n🏛️  Step 3/4 — Creating epics..." -ForegroundColor Cyan

$epics = @(
    @{
        title = "EPIC: Foundation & Infrastructure"
        labels = "epic,infra,p0-critical"
        body = @"
## Overview
All infrastructure, project setup, database schema, and CI/CD needed before any feature work can begin.

## Deliverables
- Next.js 14 + TypeScript + Tailwind + shadcn/ui scaffold
- Supabase dev + prod projects configured
- Full database schema with all tables, indexes, RLS
- Vercel deployment configured
- Seed data for 5 properties

## Child Issues
- W1-1: Project scaffold
- W1-2: Supabase project setup
- W1-3: Database schema migrations
- W1-4: Supabase keep-alive (prevent 7-day pause)
- W1-5: Seed data
- W1-10: App shell layout
"@
    },
    @{
        title = "EPIC: User Authentication & RBAC"
        labels = "epic,auth,p0-critical"
        body = @"
## Overview
Secure authentication and role-based access control for 4 roles: Admin, Manager, Staff, Viewer.

## Roles
| Role | Access |
|---|---|
| Admin | Full access all properties |
| Manager | Read/write assigned property |
| Staff | Create complaints, no financials |
| Viewer | Read-only, no user management |

## Child Issues
- W1-6: Email/password auth + forgot password
- W1-7: Supabase RLS for all 4 roles
- W1-8: User management CRUD (Admin only)
- W1-9: Property management CRUD (Admin only)
"@
    },
    @{
        title = "EPIC: Complaint Register"
        labels = "epic,complaints,p0-critical"
        body = @"
## Overview
Digital complaint tracking from submission to resolution, replacing paper/WhatsApp.

## Key Features
- Filterable complaint list
- Full complaint form with property-type-aware categories
- Activity timeline per complaint
- Photo attachments with client-side compression
- Auto-escalation for overdue complaints

## Child Issues
- W2-1: Complaint list view
- W2-2: New complaint form
- W2-3: Complaint detail + timeline
- W2-4: Photo upload
- W2-5: Auto-escalation
"@
    },
    @{
        title = "EPIC: Review Analytics"
        labels = "epic,reviews,p0-critical"
        body = @"
## Overview
Import guest reviews, flag critical keywords, track sentiment trends across properties.

## Key Features
- CSV import wizard with column mapping
- Configurable keyword flagging (bedbug, AC, hot water, etc.)
- Rule-based sentiment scoring
- Alert generation when keywords cross thresholds
- Review analytics dashboard

## Child Issues
- W2-6: CSV import wizard
- W2-7: Review list view
- W2-8: Keyword flagging engine
- W2-9: Alert generation
- W2-10: Keyword-based sentiment scoring
- W2-11: Review detail with keyword highlights
- W3-9: Review analytics dashboard
"@
    },
    @{
        title = "EPIC: Financial Leak Tracker"
        labels = "epic,financials,p1-high"
        body = @"
## Overview
Track revenue, OTA commissions, supplier costs, and utility spend to identify financial leaks.

## Key Features
- Manual revenue entry by property + OTA channel
- Auto-calculate OTA commission loss
- Supplier price comparison (current vs wholesale)
- Utility spike detection
- Financial leak dashboard

## Child Issues
- W3-1: Revenue entry form
- W3-2: Supplier price comparison
- W3-3: Utility readings + spike detection
- W3-4: Financial leak dashboard
"@
    },
    @{
        title = "EPIC: Executive Dashboard"
        labels = "epic,dashboard,p0-critical"
        body = @"
## Overview
Single-screen overview of all 5 properties with KPIs, alerts, and comparison tools.

## Key Features
- 4 global KPI cards
- Property overview table with trends
- Color-coded alert panel
- Property type filter + date range
- Side-by-side property comparison

## Child Issues
- W3-5: KPI cards + property overview table
- W3-6: Alert panel
- W3-7: Property comparison view
- W3-8: Date range + property type filters
"@
    },
    @{
        title = "EPIC: Action Plan Generator"
        labels = "epic,action-plan,p0-critical"
        body = @"
## Overview
Automatically generate prioritised action plans from complaints, review keyword alerts, and financial findings.

## How It Works
Rule engine evaluates:
- Open critical/high complaints → generate tasks
- Keyword alert thresholds crossed → generate tasks
- Supplier savings opportunities → generate tasks
- Utility spikes → generate tasks

Phase 2: Claude Haiku enriches task descriptions with specific recommendations.

## Child Issues
- W3-10: Rules engine + task generation
- W3-11: Action plan dashboard view
"@
    },
    @{
        title = "EPIC: Reports & Export"
        labels = "epic,reports,p1-high"
        body = @"
## Overview
Export data as CSV and generate printable audit reports for stakeholders.

## Key Features
- CSV export for complaints, reviews, financials, action plans
- Full audit report page (printable → PDF via browser)
- Email delivery via Resend

## Child Issues
- W4-1: CSV export (all modules)
- W4-2: Printable audit report
- W4-3: Email notifications via Resend
"@
    },
    @{
        title = "EPIC: Phase 2 — AI Layer (Claude Integration)"
        labels = "epic,ai,p2-medium,phase-2"
        body = @"
## Overview
Post-MVP AI enhancement layer using Claude Haiku 4.5 for deeper review analysis and action plan enrichment.

## AI Features
- True semantic sentiment analysis (catches "uninvited guests" = bedbugs)
- AI vs rule-based sentiment comparison
- One-click professional review response drafts
- AI-enriched action plan task descriptions
- AI weekly insight email paragraph

## Cost Estimate
~€5-20/month at MVP scale using Claude Haiku 4.5 (claude-haiku-4-5-20251001)

## Child Issues
- P2-1: Claude API Supabase Edge Function
- P2-2: AI sentiment with comparison view
- P2-3: Review response drafting
- P2-4: Action plan enrichment
- P2-5: AI weekly insight email
- P2-6: Google Reviews auto-import guide
"@
    }
)

foreach ($epic in $epics) {
    $labelArr = $epic.labels -split ","
    $labelArgs = $labelArr | ForEach-Object { "--label"; $_ }
    $result = gh issue create --repo $REPO --title $epic.title --body $epic.body @labelArgs 2>&1
    Write-Host "  ✓ Epic: $($epic.title)" -ForegroundColor Green
}

# ============================================================
# STEP 4: FEATURE ISSUES
# ============================================================
Write-Host "`n🎯 Step 4/4 — Creating feature issues..." -ForegroundColor Cyan

# Helper: get milestone number by title
function Get-MilestoneNumber($title) {
    $milestones = gh api repos/$REPO/milestones --jq ".[] | select(.title == `"$title`") | .number" 2>/dev/null
    return $milestones.Trim()
}

$issues = @(

    # ── WEEK 1 ──────────────────────────────────────────────
    @{
        title = "W1-1: Project scaffold — Next.js 14 + TypeScript + Tailwind + shadcn/ui"
        labels = "p0-critical,M,chore,infra,week-1"
        milestone = "Week 1 — Foundation"
        body = @"
## Task
Init monorepo with \`create-next-app --typescript\`. Configure tsconfig strict mode, install Tailwind, init shadcn/ui with neutral base, setup path aliases (\`@/\`). Add \`.env.local\` template with all required keys.

## Acceptance Criteria
- [ ] \`npm run dev\` starts without errors
- [ ] shadcn \`Button\` component renders on \`/\`
- [ ] \`npm run build\` passes with 0 TypeScript errors
- [ ] \`.env.local.example\` documents all env vars
"@
    },
    @{
        title = "W1-2: Supabase dev + prod project setup + env vars"
        labels = "p0-critical,S,chore,infra,week-1"
        milestone = "Week 1 — Foundation"
        body = @"
## Task
Create two Supabase projects (dev, prod) in EU region (Frankfurt/Ireland — required for GDPR). Store \`NEXT_PUBLIC_SUPABASE_URL\`, \`NEXT_PUBLIC_SUPABASE_ANON_KEY\`, \`SUPABASE_SERVICE_ROLE_KEY\` in \`.env.local\`. Set up matching env vars in Vercel dashboard for prod.

## Acceptance Criteria
- [ ] Supabase client connects without error from Next.js API route
- [ ] Both dev and prod projects in EU region
- [ ] Vercel env vars set for production project
"@
    },
    @{
        title = "W1-3: Database schema — Full migration set in Supabase"
        labels = "p0-critical,XL,chore,infra,week-1"
        milestone = "Week 1 — Foundation"
        body = @"
## Task
Write and run SQL migrations for all core tables. Store migration files in \`/supabase/migrations/\`.

## Tables Required
- \`profiles\` (extends auth.users: role, property_id, name)
- \`properties\` (id, name, type, location, status)
- \`complaints\` (id, property_id, category, priority, status, guest_name, room_bed, description, reported_by, created_at)
- \`complaint_updates\` (id, complaint_id, user_id, note, status_change, created_at)
- \`attachments\` (id, complaint_id, storage_path, size_kb, mime_type)
- \`reviews\` (id, property_id, reviewer_name, rating, text, source, date, sentiment, sentiment_score, imported_by)
- \`review_keywords\` (id, keyword, category, severity, threshold, active)
- \`review_keyword_matches\` (id, review_id, keyword_id, matched_at)
- \`financial_entries\` (id, property_id, type, channel, gross_amount, commission_rate, net_amount, period_month, period_year)
- \`supplier_prices\` (id, property_id, item, unit, current_cost, potential_cost, monthly_usage)
- \`utility_readings\` (id, property_id, utility_type, period_month, period_year, amount_eur, units)
- \`alerts\` (id, property_id, type, severity, message, source_ref, acknowledged_at)
- \`tasks\` (id, property_id, title, description, priority, owner_id, cost_estimate, deadline, progress, source_ref, status)
- \`audit_logs\` (id, user_id, action, table_name, record_id, created_at)

## Acceptance Criteria
- [ ] All tables visible in Supabase Studio
- [ ] Foreign keys enforced (complaint.property_id → properties.id, etc.)
- [ ] Indexes on property_id + created_at on all main tables
- [ ] Seed script runs without FK violations
"@
    },
    @{
        title = "W1-4: Supabase keep-alive — Prevent 7-day free tier pause"
        labels = "p0-critical,S,chore,infra,week-1"
        milestone = "Week 1 — Foundation"
        body = @"
## Task
Supabase free tier pauses after 7 days of inactivity. Set up a keep-alive ping.

## Implementation
1. Create a Supabase Edge Function \`keep-alive\` that runs \`SELECT 1\`
2. OR use the Next.js API route \`/api/ping\` that queries \`SELECT count(*) FROM properties\`
3. Register the URL with UptimeRobot (free tier) — ping every 5 minutes

## Acceptance Criteria
- [ ] UptimeRobot monitor shows green status
- [ ] Supabase project stays active through a weekend with no manual logins
- [ ] Ping endpoint returns 200 with \`{ status: "ok" }\`
"@
    },
    @{
        title = "W1-5: Seed data — 5 properties + demo users + sample records"
        labels = "p0-critical,L,chore,infra,week-1"
        milestone = "Week 1 — Foundation"
        body = @"
## Task
SQL seed script for realistic demo data.

## Data to Seed
- 5 properties: Bee Hostel Paphos (hostel), Bee Hostel Limassol (hostel), Hotel A/B/C (hotel) — update names when client provides
- 5 users: admin@bee.com (Admin), christos@bee.com (Manager → Paphos), chris@bee.com (Staff → Paphos), finance@bee.com (Viewer), manager2@bee.com (Manager → Limassol)
- 15 sample complaints (mix of priorities, statuses, properties)
- 25 sample reviews (mix of positive/negative/neutral, with bedbug/AC mentions for demo)
- Basic financial entries for 3 months

## Acceptance Criteria
- [ ] \`npm run seed\` populates all tables
- [ ] Dashboard shows non-empty state on first load
- [ ] Each role user can log in with password \`Demo1234!\`
- [ ] Review analytics shows keyword flags from seeded data
"@
    },
    @{
        title = "W1-6: Auth — Email/password login, logout, forgot password"
        labels = "p0-critical,L,feature,auth,week-1"
        milestone = "Week 1 — Foundation"
        body = @"
## Task
Implement Supabase Auth with \`@supabase/ssr\`.

## Pages
- \`/login\` — email + password form, remember me, forgot password link
- \`/forgot-password\` — email input, send reset link
- \`/reset-password\` — new password form (linked from email)
- Auth middleware in \`middleware.ts\` protecting all \`/dashboard/*\` routes
- Redirect unauthenticated users to \`/login?redirect=<path>\`

## Acceptance Criteria
- [ ] Login/logout cycle works end-to-end
- [ ] Password reset email received within 60s and link is valid
- [ ] Unauthenticated request to \`/dashboard\` → redirects to \`/login\`
- [ ] Login with wrong password shows error message (not console log)
- [ ] Session persists across browser refresh
"@
    },
    @{
        title = "W1-7: RBAC — Supabase Row Level Security for Admin/Manager/Staff/Viewer"
        labels = "p0-critical,XL,feature,auth,week-1"
        milestone = "Week 1 — Foundation"
        body = @"
## Task
Define and test RLS policies for all 4 roles across all tables.

## Policy Matrix
| Table | Admin | Manager | Staff | Viewer |
|---|---|---|---|---|
| properties | CRUD all | R assigned | R assigned | R all |
| complaints | CRUD all | CRUD assigned | CRU assigned (no delete) | R all |
| reviews | CRUD all | CRUD assigned | R assigned | R all |
| financial_entries | CRUD all | CRUD assigned | No access | R all |
| tasks | CRUD all | CRUD assigned | R assigned | R all |
| alerts | CRUD all | R assigned | R assigned | R assigned |
| profiles (users) | CRUD all | R all | R self | R all |

Role stored in \`profiles.role\`. Property scope via \`profiles.property_id\`.

## Acceptance Criteria
- [ ] Manager cannot read another property's complaints (test via Supabase Studio)
- [ ] Staff INSERT on complaints succeeds; DELETE returns 403
- [ ] Viewer SELECT on financial_entries returns rows; INSERT returns 403
- [ ] Admin can read/write everything across all properties
"@
    },
    @{
        title = "W1-8: User management — Admin CRUD (invite, role assign, deactivate)"
        labels = "p0-critical,L,feature,auth,week-1"
        milestone = "Week 1 — Foundation"
        body = @"
## Task
Admin-only page \`/dashboard/users\` for managing staff accounts.

## Features
- List all users: name, email, role badge, assigned property, status (active/deactivated)
- Invite user by email (Supabase \`admin.createUser\` with email invitation)
- Edit user: change role, change assigned property
- Deactivate user (set \`profiles.active = false\`, not hard delete)
- Deactivated user gets 403 on login attempt

## Acceptance Criteria
- [ ] Admin invites user → user receives email → user sets password → can log in
- [ ] Admin changes role → new role takes effect on next request (no re-login required)
- [ ] Deactivated user sees "Account deactivated" on login attempt
- [ ] Non-admin cannot access \`/dashboard/users\`
"@
    },
    @{
        title = "W1-9: Property management — Admin CRUD"
        labels = "p0-critical,M,feature,auth,week-1"
        milestone = "Week 1 — Foundation"
        body = @"
## Task
Admin-only page \`/dashboard/properties\` for managing the 5 properties.

## Form Fields
- Name* (text)
- Type* (Hostel / Hotel — toggle or select)
- Location (city, country)
- Status (Active / Inactive)
- Description (textarea, optional)

## Acceptance Criteria
- [ ] Admin creates a new property → it appears in all property dropdowns across the app
- [ ] Hostel vs Hotel type determines complaint category list in complaint form
- [ ] Inactive property hidden from non-admin dropdowns
- [ ] Non-admin cannot navigate to \`/dashboard/properties\`
"@
    },
    @{
        title = "W1-10: App shell — Sidebar, topbar, mobile nav"
        labels = "p1-high,S,chore,infra,week-1"
        milestone = "Week 1 — Foundation"
        body = @"
## Task
Persistent app shell wrapping all dashboard pages.

## Layout
- **Sidebar (desktop):** Logo, nav items (Dashboard, Complaints, Reviews, Financials, Action Plan, Reports, Settings/Admin), active route highlight, role-gated items (hide Financials from Staff, hide Settings from non-Admin)
- **Topbar:** Property context switcher (Admin = all properties, others = assigned only), notification bell (alert count badge), user avatar + name + logout
- **Mobile (< 768px):** Hamburger → slide-in drawer with same nav. Bottom tab bar for key actions (optional)

## Acceptance Criteria
- [ ] All nav items route correctly
- [ ] Mobile drawer opens/closes without layout shift
- [ ] Property switcher persists selection in URL param (\`?property=uuid\`)
- [ ] Staff user does not see Financials nav item
- [ ] Non-admin does not see Admin/Settings nav item
"@
    },

    # ── WEEK 2 ──────────────────────────────────────────────
    @{
        title = "W2-1: Complaint list — Filterable, sortable table"
        labels = "p0-critical,M,feature,complaints,week-2"
        milestone = "Week 2 — Core Operations"
        body = @"
## Task
Page \`/dashboard/complaints\`. Main list view for all complaints.

## Columns
ID | Property | Category | Priority (badge) | Status (badge) | Reporter | Created At | Days Open

## Filters
- Property dropdown (respects RBAC — Admin sees all)
- Status (Open / In Progress / Resolved / Closed / All)
- Priority (Critical / High / Medium / Low / All)
- Category (dynamic based on property types in portfolio)
- Date range picker

## Acceptance Criteria
- [ ] Filters combine with AND logic
- [ ] Sort by any column (click header)
- [ ] Pagination: 20 per page with page indicator
- [ ] Days Open column turns red when overdue (Critical > 1d, High > 2d, Medium > 5d)
- [ ] Zero-complaint state shows empty illustration with 'Log First Complaint' CTA
"@
    },
    @{
        title = "W2-2: New complaint form — Full data entry with Zod validation"
        labels = "p0-critical,L,feature,complaints,week-2"
        milestone = "Week 2 — Core Operations"
        body = @"
## Task
Modal or page \`/dashboard/complaints/new\` for logging complaints.

## Fields
- Property* (dropdown — RBAC filtered)
- Category* (dynamic: hostel categories for hostels, hotel categories for hotels)
- Priority* (Critical / High / Medium / Low)
- Guest Name (optional)
- Room/Bed (text)
- Source* (Guest Report / Staff Observation / Review Mention / Inspection)
- Description* (textarea, min 20 chars)

## Hostel Categories
bedbug, ac, hot_water, curtains, cleaning, noise, staff, bedding, locker, wifi

## Hotel Categories
cleanliness, staff_service, checkin_checkout, breakfast, room_comfort, amenities, noise, maintenance, wifi, value

## Acceptance Criteria
- [ ] Form rejects empty required fields with inline errors (not alert box)
- [ ] Hostel shows hostel categories, hotel shows hotel categories
- [ ] Submission creates record and redirects to detail view
- [ ] \`reported_by\` auto-set to current user (not a form field)
- [ ] Success toast shown on submission
"@
    },
    @{
        title = "W2-3: Complaint detail — Full view + activity timeline"
        labels = "p0-critical,L,feature,complaints,week-2"
        milestone = "Week 2 — Core Operations"
        body = @"
## Task
Page \`/dashboard/complaints/[id]\` showing full complaint and history.

## Sections
1. **Header:** ID, property, priority badge, status badge, days open counter
2. **Details:** Category, source, guest name, room/bed, description
3. **Activity Timeline:** Chronological list of: created, updated, escalated, resolved — each with user avatar, timestamp, note
4. **Photos:** Thumbnails of attached photos (from W2-4)
5. **Actions (role-gated):**
   - Add Update (note + optional status change) — Manager+
   - Escalate (increase priority + add escalation note) — Manager+
   - Resolve (move to Resolved + resolution note) — Manager+
   - Close (move to Closed) — Admin only

## Acceptance Criteria
- [ ] Timeline shows all history in chronological order
- [ ] Adding an update inserts new timeline entry without full page reload
- [ ] Resolve action changes status badge immediately
- [ ] Staff user sees Add Update but not Resolve/Close
- [ ] Escalation changes priority badge and adds 🔺 ESCALATED timeline entry
"@
    },
    @{
        title = "W2-4: Photo upload — Client-side compression + Supabase Storage"
        labels = "p0-critical,M,feature,complaints,week-2"
        milestone = "Week 2 — Core Operations"
        body = @"
## Task
Photo attachment for complaints. Compress on client before upload to save Supabase Storage quota.

## Implementation
- Library: \`browser-image-compression\` (npm)
- Max output size: 500KB per image
- Max resolution: 1920px on longest side
- Upload to Supabase Storage bucket: \`complaint-photos\`
- Storage path: \`{property_id}/{complaint_id}/{timestamp}-{filename}\`
- Write path to \`attachments\` table on success
- Max 3 photos per complaint
- Show upload progress bar

## Acceptance Criteria
- [ ] 8MB phone photo compressed to < 500KB before upload
- [ ] Upload completes in < 5 seconds on normal connection
- [ ] Thumbnail visible in complaint detail immediately after upload
- [ ] Photos survive page refresh (stored in Supabase, not blob URLs)
- [ ] Delete photo button visible to Manager+ (removes from Storage + DB)
"@
    },
    @{
        title = "W2-5: Auto-escalation — Flag overdue complaints by priority"
        labels = "p1-high,S,feature,complaints,week-2"
        milestone = "Week 2 — Core Operations"
        body = @"
## Task
Flag complaints that have been unresolved past their priority-based SLA.

## SLA Rules
| Priority | Escalate After |
|---|---|
| Critical | 1 day |
| High | 2 days |
| Medium | 5 days |
| Low | 14 days |

## Implementation
Option A: Supabase scheduled function (cron) runs daily
Option B: Computed column — \`is_overdue\` as DB function checking \`now() - created_at > sla_hours\`

On overdue detection: write to \`alerts\` table with severity matching complaint priority.

## Acceptance Criteria
- [ ] Complaint created 2+ days ago with High priority shows overdue badge (🔴 red border) in list
- [ ] Overdue alert appears in dashboard alert panel
- [ ] Resolving the complaint removes overdue badge
"@
    },
    @{
        title = "W2-6: CSV import wizard — Drag & drop, column mapping, deduplication"
        labels = "p0-critical,L,feature,reviews,week-2"
        milestone = "Week 2 — Core Operations"
        body = @"
## Task
Multi-step import wizard at \`/dashboard/reviews/import\`.

## Steps
1. **Upload:** Drag & drop or file picker. Accept .csv. Show filename + row count.
2. **Map Columns:** Dropdown for each target field (reviewer_name, rating, text, date, source, property). Auto-detect common column names.
3. **Preview:** First 5 rows as table. Show detected source (Google/Booking/etc from filename or user selection).
4. **Import:** Progress bar. Process in batches of 50. Deduplicate by hash of (text + date + property_id).
5. **Summary:** Imported X / Skipped Y (duplicate) / Error Z (invalid data). Link to review list.

## Acceptance Criteria
- [ ] Upload a 50-row Google Sheets CSV export → all rows imported correctly
- [ ] Re-importing same file shows 0 new, 50 skipped
- [ ] Invalid date format shows row-level error (row 12: invalid date '13/06-2026')
- [ ] Import does not time out for files up to 500 rows
"@
    },
    @{
        title = "W2-7: Review list — Search, filter, sort"
        labels = "p1-high,M,feature,reviews,week-2"
        milestone = "Week 2 — Core Operations"
        body = @"
## Task
Page \`/dashboard/reviews\`. List all imported reviews.

## Columns
Property | Reviewer | Rating (⭐ stars) | Snippet (first 80 chars) | Source badge | Date | Sentiment badge | Flags count

## Filters
- Property (dropdown, RBAC filtered)
- Source (Google / Booking.com / Tripadvisor / Trip.com / Other)
- Rating range (1-2 / 3 / 4-5)
- Date range
- Flagged only toggle

## Acceptance Criteria
- [ ] Text search returns reviews containing the query (searches reviewer_name + review text)
- [ ] Flagged-only toggle shows only reviews with ≥ 1 keyword match
- [ ] Clicking a row expands preview or navigates to detail
- [ ] Source badge colours: Google=blue, Booking=navy, Tripadvisor=green, Trip.com=red
"@
    },
    @{
        title = "W2-8: Keyword flagging engine — Configurable keywords + SQL matching"
        labels = "p0-critical,L,feature,reviews,week-2"
        milestone = "Week 2 — Core Operations"
        body = @"
## Task
Configurable keyword flagging system with admin UI and automatic matching on review insert.

## Default Keywords (seed into review_keywords table)
| Keyword | Category | Severity | Threshold |
|---|---|---|---|
| bedbug / bed bug | pest | critical | 2 |
| ac / air conditioning | maintenance | warning | 3 |
| hot water | maintenance | warning | 3 |
| curtain | maintenance | warning | 5 |
| dirty | cleanliness | warning | 5 |
| smell / odour | cleanliness | warning | 5 |
| chris | staff | positive | n/a |
| clean | cleanliness | positive | n/a |
| value | value | positive | n/a |
| friendly | staff | positive | n/a |

## Implementation
- DB trigger on \`reviews\` INSERT: call function that matches all active keywords (case-insensitive, partial match via ILIKE) and inserts to \`review_keyword_matches\`
- Admin page \`/dashboard/settings/keywords\` for CRUD on keywords

## Acceptance Criteria
- [ ] Review containing "found a bed bug" → matched to bedbug keyword with critical severity
- [ ] Review containing "AC was dripping" → matched to ac keyword
- [ ] Admin can add custom keyword "toilet" with severity warning
- [ ] Deactivated keywords not matched on new imports
"@
    },
    @{
        title = "W2-9: Alert generation — Threshold-based rules from keyword flags"
        labels = "p0-critical,M,feature,reviews,week-2"
        milestone = "Week 2 — Core Operations"
        body = @"
## Task
Automatically generate alerts when keyword mention counts cross thresholds.

## Trigger
After each keyword match insert, check: count of matches for this keyword + property in last 30 days. If count >= keyword.threshold → upsert alert.

## Alert Record
\`\`\`
property_id, type='review_keyword', severity,
message='bedbug mentioned 4 times in last 30 days — professional treatment required',
source_ref='keyword:bedbug', created_at
\`\`\`

## Alert Severity Mapping
- keyword.severity = 'critical' → alert.severity = 'critical'
- keyword.severity = 'warning' → alert.severity = 'high' if count > threshold*2 else 'medium'

## Acceptance Criteria
- [ ] Import 3 reviews with "bedbug" → CRITICAL alert created for that property
- [ ] Dashboard alert panel shows the alert immediately (after refresh)
- [ ] Alert message includes keyword, count, and suggested action
- [ ] Alert auto-resolves (sets resolved_at) when count drops below threshold
"@
    },
    @{
        title = "W2-10: Sentiment scoring — Keyword-based (no AI)"
        labels = "p1-high,M,feature,reviews,week-2"
        milestone = "Week 2 — Core Operations"
        body = @"
## Task
Score each review's sentiment based on positive vs negative keyword matches. No external API — pure SQL logic.

## Algorithm
1. Count positive keyword matches (chris, clean, value, friendly, etc.) = P
2. Count negative keyword matches (bedbug, dirty, noise, etc.) = N
3. If P=0 and N=0: check rating — ≥4 → Positive, =3 → Neutral, ≤2 → Negative
4. If P or N > 0: score = (P - N) / (P + N)
   - score > 0.3 → Positive
   - score -0.3 to 0.3 → Neutral
   - score < -0.3 → Negative

Run on import and on keyword list change (backfill).

## Acceptance Criteria
- [ ] Review "great staff, clean rooms, loved Chris" → Positive
- [ ] Review "bedbug, ac broken, dirty bathroom" → Negative
- [ ] Review "nice location, small room, ok wifi" → Neutral (no keyword matches, rating=3)
- [ ] Sentiment shown as badge in review list and detail
"@
    },
    @{
        title = "W2-11: Review detail — Full text + keyword highlights"
        labels = "p1-high,S,feature,reviews,week-2"
        milestone = "Week 2 — Core Operations"
        body = @"
## Task
Review detail view at \`/dashboard/reviews/[id]\`.

## Sections
1. **Header:** Property, source badge, rating (stars), date, sentiment badge
2. **Review text** with matched keywords highlighted (red = critical, amber = warning, green = positive)
3. **Keyword Matches list:** each matched keyword with category + severity
4. **Reviewer:** name (anonymised if needed for GDPR)

## Acceptance Criteria
- [ ] "bedbug" in review text rendered with red highlight
- [ ] "chris" rendered with green highlight
- [ ] Keyword match list shows: keyword | category | severity
- [ ] No crash when review has 0 keyword matches
"@
    },

    # ── WEEK 3 ──────────────────────────────────────────────
    @{
        title = "W3-1: Revenue entry — Manual revenue + OTA channel logging"
        labels = "p0-critical,L,feature,financials,week-3"
        milestone = "Week 3 — Intelligence Layer"
        body = @"
## Task
Form at \`/dashboard/financials/revenue/new\` for logging revenue by property, period, and OTA channel.

## Fields
- Property*
- Period (month + year picker)*
- Channel* (Direct / Booking.com / Expedia / Agoda / Airbnb / Other)
- Gross Revenue (€)*
- Commission Rate (% — auto-fill defaults: Booking.com=15%, Expedia=15%, Agoda=12%, Airbnb=3%, Direct=0%)
- Commission Amount (€ — auto-calc, editable override)
- Net Revenue (€ — auto-calc, read-only)

List view shows all entries with edit/delete (Manager+).

## Acceptance Criteria
- [ ] Enter €10,000 Booking.com revenue → commission auto-fills 15% → net shows €8,500
- [ ] Override commission rate to 12% → net recalculates to €8,800
- [ ] List sorted by period desc (latest first)
- [ ] Duplicate period + channel + property shows warning (not error — allow override)
"@
    },
    @{
        title = "W3-2: Supplier prices — Current vs wholesale comparison form"
        labels = "p0-critical,M,feature,financials,week-3"
        milestone = "Week 3 — Intelligence Layer"
        body = @"
## Task
Page \`/dashboard/financials/suppliers\` for comparing current vs potential supplier costs.

## Form Fields
- Property (or All — shared across properties)*
- Item name* (Milk, Bread, Cleaning Supplies, etc.)
- Unit* (litre, loaf, kg, etc.)
- Current Supplier (text)
- Current Cost (€/unit)*
- Potential Supplier (text)
- Potential Cost (€/unit)*
- Monthly Usage (units)*

## Auto-calculations
- Monthly Saving = (Current - Potential) × Monthly Usage
- Annual Saving = Monthly Saving × 12
- % Saving = (Current - Potential) / Current × 100

Table: sorted by Annual Saving desc. Total savings row at bottom.

## Acceptance Criteria
- [ ] Milk: current €2/litre, potential €1.20/litre, 60 litres/month → €48/month, €576/year, 40%
- [ ] Totals row sums all items correctly
- [ ] Edit existing item updates calculations live
"@
    },
    @{
        title = "W3-3: Utility readings — Entry + spike detection alerts"
        labels = "p1-high,M,feature,financials,week-3"
        milestone = "Week 3 — Intelligence Layer"
        body = @"
## Task
Log utility bills and automatically flag anomalous spikes.

## Form Fields
- Property*
- Utility type* (Electricity / Water / Gas)
- Period (month + year)*
- Amount (€)*
- Units consumed (optional — kWh / m³)

## Spike Detection (DB function on insert)
1. Get 3-month rolling average for this property + utility type
2. If amount > average × 1.3 → insert WARNING alert ("Water bill 35% above baseline")
3. If amount > average × 1.6 → insert CRITICAL alert ("Water bill 80% above baseline — check for leak")
4. Alert message includes suggested action (water leak → check cisterns, electricity → check HVAC)

## Acceptance Criteria
- [ ] Log water bill €551 against baseline €120 → CRITICAL alert "Water bill 359% above baseline — inspect all toilets for running cisterns"
- [ ] Readings table shows spike indicator (🔴) on flagged rows
- [ ] First 3 entries for a utility type have no baseline → no false alerts
"@
    },
    @{
        title = "W3-4: Financial leak dashboard — Revenue | Suppliers | Utilities"
        labels = "p0-critical,XL,feature,financials,week-3"
        milestone = "Week 3 — Intelligence Layer"
        body = @"
## Task
Page \`/dashboard/financials\`. The main financial overview.

## Layout
**Top KPI cards:** Total Revenue (period) | Total Commissions Lost (€ + %) | Potential Annual Savings (suppliers)

**Tab 1 — Revenue Summary:**
Table: Property | Gross Revenue | Commission | Net Revenue | % Lost
Totals row. Period selector (Month / Quarter / Year). Bar chart via Recharts.

**Tab 2 — Supplier Savings:**
Table: Item | Current Cost | Potential Cost | Monthly Saving | Annual Saving | % Saving
Total savings row at bottom.

**Tab 3 — Utility Spikes:**
Table: Property | Utility | Period | Amount | Baseline | % Above | Status badge
Only shows periods with spikes or last 6 months.

## Acceptance Criteria
- [ ] Switching period (Month → Quarter → Year) recalculates all revenue figures
- [ ] Empty state on each tab shows prompt to add data
- [ ] KPI cards update when new revenue entry added
- [ ] Revenue chart shows per-property bars grouped by period
"@
    },
    @{
        title = "W3-5: Executive dashboard — KPI cards + property overview table"
        labels = "p0-critical,XL,feature,dashboard,week-3"
        milestone = "Week 3 — Intelligence Layer"
        body = @"
## Task
Root page \`/dashboard\`. The first thing users see after login.

## Top Row: 4 KPI Cards
1. Overall Rating (avg across filtered properties, with ⭐ and trend)
2. Open Issues (complaints + keyword alerts combined, with 🔴 if critical exist)
3. Revenue YTD (€ total, with trend ▲▼ vs prior year)
4. Commissions Lost YTD (€ + % of revenue)

## Property Overview Table
Columns: Property Name | Type (badge) | Avg Rating | Open Complaints | Open Alerts | Revenue MTD | Trend
Clicking a row → filters all dashboard to that property.

All data from DB aggregation queries — not hardcoded.

## Acceptance Criteria
- [ ] Adding a new complaint increments Open Issues card (on page refresh)
- [ ] Revenue card shows correct YTD sum from financial_entries
- [ ] Property with Critical alert shows 🔴 indicator in table row
- [ ] Page loads in < 3 seconds with seed data (5 properties, 25 reviews, 15 complaints)
"@
    },
    @{
        title = "W3-6: Alert panel — Real-time, color-coded, severity sorted"
        labels = "p0-critical,L,feature,dashboard,week-3"
        milestone = "Week 3 — Intelligence Layer"
        body = @"
## Task
Alert panel on dashboard (and \`/dashboard/alerts\` full page).

## Display
- CRITICAL: Red background, 🔴 icon
- HIGH: Amber background, 🟡 icon
- MEDIUM: Blue background, 🔵 icon

Sorted: Critical first, then by created_at desc.

Each alert card shows:
- Severity badge + property name
- Message (e.g. "bedbug mentioned 4 times — urgent treatment needed")
- Age ("2 days ago")
- Dismiss button (sets acknowledged_at, removes from panel)

Dashboard shows latest 5 alerts. "View all" → \`/dashboard/alerts\` (paginated full list with filters).

## Acceptance Criteria
- [ ] Critical alerts always appear above High/Medium
- [ ] Dismiss removes from panel without page reload (optimistic update)
- [ ] Dismissed alerts still visible on \`/dashboard/alerts?show=acknowledged\`
- [ ] Alert count badge on nav item matches panel count
"@
    },
    @{
        title = "W3-7: Property comparison — Side-by-side metrics table"
        labels = "p1-high,M,feature,dashboard,week-3"
        milestone = "Week 3 — Intelligence Layer"
        body = @"
## Task
Page \`/dashboard/comparison\` for comparing up to 5 properties side-by-side.

## Metrics (rows)
Avg Rating | Open Complaints | Open Alerts | Reviews This Month | Positive Sentiment % | Revenue MTD | Commission Rate % | Utility Spend MTD

## Layout
Multi-select for properties (default: all active). Table with metric rows and property columns.
Highlight: best value per row in green, worst in red.
Bar chart (Recharts) for top 3 metrics as visual.

## Acceptance Criteria
- [ ] Select 3 properties → table shows all metrics for each
- [ ] Best value per row highlighted green, worst red
- [ ] Deselecting a property removes its column instantly
- [ ] Works with just 1 property selected (no comparison highlights)
"@
    },
    @{
        title = "W3-8: Dashboard filters — Date range + property type toggle"
        labels = "p1-high,M,feature,dashboard,week-3"
        milestone = "Week 3 — Intelligence Layer"
        body = @"
## Task
Global filter bar that controls all dashboard widgets.

## Controls
- **Date range:** presets (This Month / Last Month / This Quarter / This Year / Custom range picker)
- **Property type:** All / Hostel / Hotel (toggle buttons)

Selections update: KPI cards, property table, alert panel (filtered by date).
Persist in URL query params: \`?period=this-quarter&type=hostel\` — links are shareable.

## Acceptance Criteria
- [ ] Selecting "Last Quarter" + "Hostel only" → KPI cards and property table filter correctly
- [ ] URL updates on filter change → pasting URL in new tab reproduces the same view
- [ ] Custom date range picker allows arbitrary start/end dates
- [ ] Clearing filters resets to default (This Month, All types)
"@
    },
    @{
        title = "W3-9: Review analytics dashboard — Sentiment + keyword flags + source chart"
        labels = "p1-high,M,feature,reviews,week-3"
        milestone = "Week 3 — Intelligence Layer"
        body = @"
## Task
Page \`/dashboard/reviews/analytics\`. Analytics overview of all review data.

## Sections

**Sentiment Donut Chart (Recharts)**
% Positive / Neutral / Negative. Filter by property + date range.

**Keyword Flags Table**
Keyword | Mentions | Trend (▲/▼ vs prior period) | Severity | Suggested Action
Sorted by severity desc, then mentions desc.

**Source Breakdown Bar Chart**
Google / Booking.com / Tripadvisor / Trip.com / Other — count + % of total.

## Acceptance Criteria
- [ ] Keyword table shows "bedbug: 4 mentions ⬆ CRITICAL — Professional treatment required"
- [ ] Positive keywords (chris: 45) show with green colour, not red
- [ ] Source percentages sum to 100% (handle rounding)
- [ ] Trend ▲/▼ compares current vs prior same-length period
"@
    },
    @{
        title = "W3-10: Action plan rules engine — Auto-generate tasks from findings"
        labels = "p0-critical,XL,feature,action-plan,week-3"
        milestone = "Week 3 — Intelligence Layer"
        body = @"
## Task
Rule-based engine that generates prioritised action plan tasks from current system data.

## Rules
| Trigger | Task Priority | Example Task |
|---|---|---|
| Open Critical complaint | Critical | "Fix AC leak in Dorm 3 — complaint #C-019, 3 days old" |
| Critical keyword alert (≥ threshold) | Critical | "Professional bedbug treatment — 4 review mentions" |
| Open High complaint > 2 days | High | "Replace torn curtains — High complaint overdue" |
| Supplier saving > €50/month | Medium | "Switch milk to wholesale — save €48/month (€576/year)" |
| Utility CRITICAL spike | High | "Investigate water leak — bill 80% above baseline" |
| Utility WARNING spike | Medium | "Review electricity usage — bill 35% above baseline" |

## De-duplication
Upsert by \`source_ref\` (e.g. \`complaint:uuid\`, \`alert:uuid\`) — same source = same task (update, not create new).

## API endpoint
\`POST /api/action-plan/generate?property_id=...\` — returns list of generated/updated tasks.

## Acceptance Criteria
- [ ] 4 bedbug reviews + 1 overdue AC complaint → generates exactly 2 tasks (deduped)
- [ ] Re-running engine → 0 new tasks created if nothing changed
- [ ] Resolved complaint → source task marked stale/archived
- [ ] Each task includes: title, description, priority, source_ref, suggested owner role, cost estimate (from complaint data if available)
"@
    },
    @{
        title = "W3-11: Action plan view — Dashboard + task management"
        labels = "p0-critical,L,feature,action-plan,week-3"
        milestone = "Week 3 — Intelligence Layer"
        body = @"
## Task
Page \`/dashboard/action-plan\`. View, manage, and track generated action plan tasks.

## Layout
**Header:** Property filter, 'Generate Plan' button (triggers W3-10 engine), last generated timestamp.

**Task sections by priority:**
🔴 Critical | 🟡 High | 🔵 Medium | 🟢 Low

**Per task card:**
- Checkbox (complete)
- Title + source reference link (→ complaint or alert)
- Owner assignment (dropdown: users in this property)
- Cost estimate (€, editable)
- Target date (date picker)
- Progress slider (0-100%)

## Behaviour
- Completed tasks (progress=100%) → move to Resolved section (collapsed by default)
- Filter by property + priority

## Acceptance Criteria
- [ ] 'Generate Plan' button produces tasks within 3 seconds
- [ ] Setting progress to 100% moves task to Resolved section
- [ ] Owner assignment saves without page reload
- [ ] Critical section always rendered first, even if empty (shows "No critical issues ✅")
"@
    },

    # ── WEEK 4 ──────────────────────────────────────────────
    @{
        title = "W4-1: CSV export — Complaints, Reviews, Financials, Action Plan"
        labels = "p0-critical,M,feature,reports,week-4"
        milestone = "Week 4 — Polish & Deploy"
        body = @"
## Task
Export buttons on each module list page. Generate CSV client-side using \`papaparse\`.

## Exports
- **Complaints:** ID, property, category, priority, status, reporter, days_open, description, created_at, resolved_at
- **Reviews:** reviewer_name, property, source, rating, sentiment, keyword_flags, review_text, date
- **Revenue:** property, period, channel, gross_amount, commission_rate, commission_amount, net_amount
- **Action Plan:** title, priority, status, owner, cost_estimate, deadline, progress, source_ref

Filename format: \`bee-complaints-2026-06.csv\` (module + date range).

## Acceptance Criteria
- [ ] Exporting 50 complaints produces valid CSV that opens in Excel/Sheets with correct columns
- [ ] Export respects active filters (export what you see)
- [ ] Date range in filename matches applied filter
- [ ] Empty filtered result → CSV with headers only (no crash)
"@
    },
    @{
        title = "W4-2: Audit report — Full printable summary page"
        labels = "p1-high,L,feature,reports,week-4"
        milestone = "Week 4 — Polish & Deploy"
        body = @"
## Task
Page \`/dashboard/reports/generate\`. Generates a structured audit summary for stakeholders.

## Report Sections
1. **Cover:** Property name(s), date range, generated by, generated at
2. **Executive Summary:** 4 KPI snapshot cards
3. **Critical Findings:** Top 5 alerts with severity + description
4. **Complaint Summary:** Open complaints table grouped by priority
5. **Review Sentiment:** Donut chart + keyword flags table
6. **Financial Recommendations:** Supplier savings + commission analysis
7. **Action Plan Summary:** All open tasks by priority

## Export
- **Print / Save PDF:** \`window.print()\` with print-specific CSS (hide sidebar, clean typography, page breaks)
- No Puppeteer (Vercel serverless timeout)

## Acceptance Criteria
- [ ] Report generates for "All Properties, This Quarter" with all sections populated
- [ ] Print preview shows clean layout without nav, sidebar, or action buttons
- [ ] Page breaks between sections (no section split across pages)
- [ ] Charts render as static (Recharts SVG prints cleanly)
"@
    },
    @{
        title = "W4-3: Email notifications — Resend integration (alerts + weekly summary)"
        labels = "p2-medium,M,feature,reports,week-4"
        milestone = "Week 4 — Polish & Deploy"
        body = @"
## Task
Integrate Resend (free 3000 emails/month) for alert and report emails.

## Triggers
1. **New CRITICAL alert** → email Admin + assigned Manager within 60 seconds
2. **Complaint overdue** (per W2-5 SLA) → email assigned Manager
3. **Weekly summary** (Sunday 8am via Vercel cron) → email Admin with snapshot

## Implementation
- Use \`resend\` npm package
- Use \`@react-email/components\` for HTML templates
- Resend API key in env vars
- Vercel cron config in \`vercel.json\` for weekly email

## Acceptance Criteria
- [ ] Creating a CRITICAL alert sends email to admin@bee.com within 60 seconds
- [ ] Email is HTML-formatted (not plain text) with Bee Hospitality branding
- [ ] Weekly email received Sunday with correct property count + open issues count
- [ ] Unsubscribe link in email footer (GDPR requirement)
"@
    },
    @{
        title = "W4-4: Mobile responsive audit — All pages on 375px"
        labels = "p0-critical,L,chore,infra,week-4"
        milestone = "Week 4 — Polish & Deploy"
        body = @"
## Task
Ensure all pages are fully usable on 375px (iPhone SE) and 768px (iPad).

## Pages to Audit
Dashboard | Complaints list | Complaint detail | New complaint form | Reviews list | Review analytics | Financials | Action plan | Reports

## Common Fixes
- Data tables → card list on mobile (use Tailwind \`hidden sm:table-cell\`)
- Filter bar → collapsible panel (accordion)
- Charts → horizontal scroll container with min-width
- Form → full-width single column
- Action buttons → sticky bottom bar on mobile
- Tap targets → minimum 44×44px

## Acceptance Criteria
- [ ] No horizontal overflow on any page at 375px
- [ ] Complaint form submittable on iPhone SE without zooming
- [ ] Charts visible and readable on mobile (even if scrollable)
- [ ] All tap targets ≥ 44px (Chrome DevTools accessibility audit)
"@
    },
    @{
        title = "W4-5: Loading states, empty states, error boundaries"
        labels = "p0-critical,M,chore,infra,week-4"
        milestone = "Week 4 — Polish & Deploy"
        body = @"
## Task
Polish loading, empty, and error states across all pages.

## Loading States
- Skeleton loaders on all data tables and KPI cards (use shadcn Skeleton)
- Spinner on form submit buttons
- \`loading.tsx\` route segments for Next.js streaming

## Empty States
- No complaints: "No complaints logged yet. Everything looks good! ✅" + Log First Complaint CTA
- No reviews: "No reviews imported yet." + Import Reviews CTA
- No financial data: "Add your first revenue entry to see financial insights." + Add Revenue CTA
- No alerts: "No active alerts. All properties are in good shape. ✅"

## Error States
- React error boundary on each major page section
- Fallback: "Something went wrong — try refreshing" + Refresh button
- Toast notifications (shadcn Toaster) for all create/update/delete success/error

## Acceptance Criteria
- [ ] Dashboard on slow 3G (Chrome throttle) shows skeletons, not blank space or layout shift
- [ ] Deleting a complaint shows success toast "Complaint resolved"
- [ ] Broken API call shows error boundary, not white screen of death
- [ ] All empty states have a CTA to add data (not dead ends)
"@
    },
    @{
        title = "W4-6: Vercel production deployment — Config, env vars, domain"
        labels = "p0-critical,L,chore,infra,week-4"
        milestone = "Week 4 — Polish & Deploy"
        body = @"
## Task
Deploy to Vercel production and confirm all features work end-to-end.

## Steps
1. Connect GitHub repo to Vercel project
2. Set all production env vars (Supabase prod URL + keys, Resend API key)
3. Configure \`vercel.json\` (cron for weekly email if using Vercel cron)
4. Set up custom domain OR configure \`bee-audit.vercel.app\` subdomain
5. Add \`robots.txt\` with \`Disallow: /\` (internal tool — no indexing)
6. Test full auth flow on production URL
7. Seed production Supabase with initial data

## Acceptance Criteria
- [ ] Production URL loads dashboard without errors
- [ ] Login works with all 5 demo users on production
- [ ] All 5 properties visible in property switcher
- [ ] File upload (complaint photo) works on production
- [ ] No console errors on production (no leaked dev URLs or keys)
- [ ] HTTPS enforced (Vercel default — confirm no mixed content warnings)
"@
    },
    @{
        title = "W4-7: Performance — Page load < 3s, Lighthouse ≥ 80"
        labels = "p1-high,M,chore,infra,week-4"
        milestone = "Week 4 — Polish & Deploy"
        body = @"
## Task
Performance audit and fixes for the 3 most-used pages.

## Pages to Audit
1. \`/dashboard\` (most visited)
2. \`/dashboard/complaints\` (most written to)
3. \`/dashboard/reviews/analytics\` (heaviest queries)

## Common Fixes
- Add \`Suspense\` boundaries with streaming SSR
- Verify no N+1 queries (check Supabase query logs)
- Add \`loading.tsx\` for route segments
- Paginate all lists (20 items max per page — already planned)
- Verify DB indexes on \`property_id + created_at\` (W1-3)
- Use \`next/image\` for any images

## Acceptance Criteria
- [ ] Lighthouse Performance ≥ 80 on all 3 pages (desktop)
- [ ] Dashboard loads in < 3 seconds on simulated 4G (Chrome throttle)
- [ ] No Supabase queries taking > 500ms (visible in Supabase Studio logs)
- [ ] Zero layout shift on initial load (CLS < 0.1)
"@
    },
    @{
        title = "W4-8: Client onboarding — Data seeding guide + ONBOARDING.md"
        labels = "p1-high,M,chore,infra,week-4"
        milestone = "Week 4 — Polish & Deploy"
        body = @"
## Task
Write \`ONBOARDING.md\` and in-app onboarding checklist for the client.

## Guide Contents
1. How to log in (credentials for each user)
2. How to update property names in Supabase Studio (Hotel A → real name)
3. How to invite staff members + assign roles
4. How to export Google reviews as CSV (with screenshots/steps)
5. How to import reviews (link to CSV import wizard)
6. How to log the first complaint
7. How to run the first action plan
8. How to export the first audit report

## In-App Onboarding Checklist (admin home page widget)
- [ ] Add property details (/dashboard/properties)
- [ ] Invite first staff member (/dashboard/users)
- [ ] Import reviews (/dashboard/reviews/import)
- [ ] Log first complaint (/dashboard/complaints/new)
- [ ] Generate action plan (/dashboard/action-plan)

Hide widget once all 5 steps complete (store completion in user profile).

## Acceptance Criteria
- [ ] Non-technical person follows ONBOARDING.md → populates system in < 1 hour
- [ ] Checklist widget visible on first admin login, hidden after all steps done
- [ ] Google CSV export instructions are accurate for current Google Maps UI
"@
    },
    @{
        title = "W4-9: Security — GDPR basics + audit logging"
        labels = "p1-high,S,chore,infra,week-4"
        milestone = "Week 4 — Polish & Deploy"
        body = @"
## Task
Implement GDPR minimum requirements for an EU-based hospitality data system.

## Required Items
1. **Privacy notice** on login page footer: "Guest data is processed in accordance with GDPR Article 6(1)(f). Data controller: Bee Hospitality. Retention: 5 years."
2. **Audit log** entries for: all complaint create/update/delete, all review import, all user role changes. Stored in \`audit_logs\` table (user_id, action, table_name, record_id, old_values JSONB, new_values JSONB, created_at).
3. **Supabase EU region** confirmation: project must be in Frankfurt (eu-central-1) or Ireland (eu-west-1).
4. **Guest name handling**: Add note in complaint form "Avoid storing full guest names where possible — use room/bed reference only."
5. **Data retention note** on report page footer.

## Acceptance Criteria
- [ ] Login page shows privacy notice
- [ ] Every complaint edit creates an \`audit_logs\` row with user_id + before/after values
- [ ] Supabase project region confirmed as EU in Supabase dashboard
- [ ] Audit log accessible to Admin at \`/dashboard/settings/audit-log\`
"@
    },

    # ── PHASE 2 ──────────────────────────────────────────────
    @{
        title = "P2-1: Claude API — Supabase Edge Function for review analysis"
        labels = "p1-high,L,feature,ai,phase-2"
        milestone = "Phase 2 — AI Layer"
        body = @"
## Task
Supabase Edge Function \`analyze-review\` triggered on new review insert. Uses Claude Haiku 4.5 for deep analysis.

## Model
\`claude-haiku-4-5-20251001\` — fast, cheap (~\$0.001/review), sufficient for structured extraction

## Prompt Output (Zod schema)
\`\`\`typescript
{
  sentiment: 'positive' | 'neutral' | 'negative',
  sentiment_score: number, // 0-1
  key_issues: string[],    // ["bedbug infestation", "AC malfunction"]
  key_positives: string[], // ["friendly staff", "good location"]
  suggested_response: string // Under 200 words, professional tone
}
\`\`\`

## Trigger
Supabase DB trigger on \`reviews\` INSERT → call Edge Function → write results to \`reviews.ai_sentiment\`, \`reviews.ai_key_issues\`, \`reviews.ai_suggested_response\`.

## Acceptance Criteria
- [ ] Review "the mattress situation was horrifying, we had uninvited guests in the night" → key_issues includes "possible pest infestation" (caught without "bedbug" keyword)
- [ ] Edge Function responds in < 5 seconds
- [ ] API error → fails gracefully (null AI fields, not crashed review)
- [ ] Cost tracked: log token usage per review to \`ai_usage_logs\` table
"@
    },
    @{
        title = "P2-2: AI vs rule-based sentiment — Comparison + discrepancy view"
        labels = "p1-high,M,feature,ai,phase-2"
        milestone = "Phase 2 — AI Layer"
        body = @"
## Task
Show AI and rule-based sentiment side by side. Flag discrepancies for human review.

## Review Detail Changes
- Show both badges: "Rule-based: Positive" + "AI: Negative"
- If they differ: show 🔶 "Discrepancy — review suggested AI is more accurate"
- Admin/Manager: "Confirm AI" button → updates \`reviews.sentiment\` to AI value + logs to audit

## Analytics Dashboard Changes
- Toggle: "Rule-based view" vs "AI view" for sentiment breakdown
- Discrepancy count shown: "12 reviews where AI and rules disagree"

## Acceptance Criteria
- [ ] Discrepancy badge visible where AI and rule-based differ
- [ ] Confirming AI sentiment updates analytics donut chart
- [ ] Toggle between views updates chart without page reload
"@
    },
    @{
        title = "P2-3: Review response drafting — AI draft with one click"
        labels = "p2-medium,L,feature,ai,phase-2"
        milestone = "Phase 2 — AI Layer"
        body = @"
## Task
One-click professional review response drafting on review detail page.

## Implementation
Button "Draft Response" on review detail. Calls \`/api/ai/draft-response\` with:
- property_name
- review_text
- sentiment + key_issues (from AI analysis)
- property_type (hostel/hotel)

Claude Haiku returns draft (< 200 words). Pre-filled in editable textarea.
"Copy to clipboard" button.

**Important:** System does NOT post responses. Manager copies and posts manually.

## Acceptance Criteria
- [ ] Negative bedbug review → draft acknowledges issue, apologises, states action taken (without admitting liability)
- [ ] Positive review → warm thank-you, invite to return, mention specific positive (e.g. "glad you loved Chris's service")
- [ ] Draft appears in < 3 seconds
- [ ] \`audit_logs\` records "response draft generated" (not the draft text — privacy)
"@
    },
    @{
        title = "P2-4: Action plan AI enrichment — Better task descriptions via Claude"
        labels = "p2-medium,L,feature,ai,phase-2"
        milestone = "Phase 2 — AI Layer"
        body = @"
## Task
After rule engine generates tasks (W3-10), enrich descriptions using Claude Haiku.

## Enrichment Input (per task)
- Issue type (bedbug, AC leak, utility spike, etc.)
- Property type (hostel/hotel)
- Source data (complaint description / review text / spike amount)
- Cost estimate (from task if available)

## Enrichment Output
- Specific recommended action (not generic)
- Estimated fix time
- Risk if ignored (with real hospitality impact)
- Suggested vendor type (if relevant)

## Example
Generic: "Fix AC — source: complaint #019"
Enriched: "Clear condensate drain line and install condensate pump. 80% of AC leaks in Mediterranean climates are drain blockages. Fix time: 2-3 hours. Parts: <€30 + €150 labour. Risk if ignored: ceiling water damage (€2,000+ repair) + potential 1-star review."

## Acceptance Criteria
- [ ] AC task gets enriched with specific Cyprus-relevant recommendation
- [ ] Bedbug task includes thermal treatment recommendation + closure risk
- [ ] Enrichment runs in background (task visible immediately with basic description, AI enrichment added within 10 seconds)
"@
    },
    @{
        title = "P2-5: AI weekly insight — Automated Sunday summary paragraph"
        labels = "p2-medium,M,feature,ai,phase-2"
        milestone = "Phase 2 — AI Layer"
        body = @"
## Task
Extend the weekly summary email (W4-3) with an AI-generated insight paragraph per property.

## Input to Claude Haiku (per property)
- Weekly complaint counts by category
- New review keyword mentions + trend vs prior week
- Revenue vs prior week
- Any new critical alerts

## Output
A 100-150 word paragraph per property. Tone: concise, professional, like a consultant's brief. Actionable.

Example output:
"This week at Bee Hostel Paphos: bedbug mentions rose from 0 to 4 (critical threshold crossed). Recommend scheduling thermal treatment before peak season (July). On a positive note, Chris was mentioned positively in 12 reviews — an asset worth protecting. Revenue up 8% vs prior week, driven by direct bookings. No utility anomalies detected."

## Acceptance Criteria
- [ ] Sunday email includes AI paragraph per property
- [ ] Paragraph is ≤ 150 words
- [ ] Paragraph references actual data from the week (not hallucinated)
- [ ] If AI call fails → email sends with rule-based summary only (graceful degradation)
"@
    },
    @{
        title = "P2-6: Google Reviews guide + scheduled CSV import"
        labels = "p3-low,XL,feature,ai,phase-2"
        milestone = "Phase 2 — AI Layer"
        body = @"
## Task
Since Google Reviews API requires Business Profile OAuth (weeks of approval), implement a guided manual workflow.

## Part 1: In-App Guide
Page \`/dashboard/reviews/import/google-guide\` with:
1. Step-by-step instructions to export reviews from Google Maps
2. How to format the CSV for the import wizard
3. Screenshots (or illustrated placeholders)

## Part 2: Scheduled Upload Import
- Manager uploads exported Google CSV to Supabase Storage path \`review-imports/{property_id}/\`
- Supabase Storage trigger → Edge Function processes new files automatically
- Email notification: "12 new reviews imported from Google export"

## Future
When client gets Google Business Profile API access, replace with live API call. Schema remains identical — only data source changes.

## Acceptance Criteria
- [ ] Manager follows in-app guide → exports from Google → uploads → reviews imported in < 60 seconds
- [ ] Duplicate detection works on re-upload
- [ ] Import confirmation email received with count of new vs skipped reviews
"@
    }
)

$successCount = 0
$errorCount = 0

foreach ($issue in $issues) {
    # Get milestone number
    $msNumber = Get-MilestoneNumber $issue.milestone

    $labelArr = $issue.labels -split ","
    $labelArgs = ($labelArr | ForEach-Object { "--label `"$_`"" }) -join " "

    if ($msNumber) {
        $result = Invoke-Expression "gh issue create --repo $REPO --title `"$($issue.title)`" --body `"$($issue.body.Replace('"','\"'))`" $labelArgs --milestone $msNumber 2>&1"
    } else {
        $result = Invoke-Expression "gh issue create --repo $REPO --title `"$($issue.title)`" --body `"$($issue.body.Replace('"','\"'))`" $labelArgs 2>&1"
    }

    if ($result -match "https://github.com") {
        Write-Host "  ✓ $($issue.title)" -ForegroundColor Green
        $successCount++
    } else {
        Write-Host "  ✗ $($issue.title): $result" -ForegroundColor Red
        $errorCount++
    }
}

# ============================================================
# DONE
# ============================================================
Write-Host "`n✅ Done!" -ForegroundColor Green
Write-Host "  Created: $successCount issues" -ForegroundColor Green
if ($errorCount -gt 0) {
    Write-Host "  Errors:  $errorCount issues (see above)" -ForegroundColor Red
}
Write-Host "`n  View your issues: https://github.com/$REPO/issues" -ForegroundColor Cyan
Write-Host "  View milestones:  https://github.com/$REPO/milestones" -ForegroundColor Cyan
