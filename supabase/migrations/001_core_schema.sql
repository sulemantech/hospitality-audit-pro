-- ============================================================
-- Bee Hospitality Audit Pro — Core Schema
-- Migration 001: Properties, Complaints, Reviews, Alerts
-- ============================================================

-- ─── Extensions ──────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- fast text search on reviews

-- ─── ENUMs ───────────────────────────────────────────────────

create type property_type as enum ('hotel', 'hostel');
create type property_status as enum ('active', 'inactive');

create type complaint_severity as enum ('critical', 'high', 'medium', 'low');
create type complaint_status as enum ('open', 'pending', 'resolved', 'closed');
create type complaint_category as enum (
  'cleanliness', 'maintenance', 'noise', 'staff',
  'facilities', 'pest', 'safety', 'billing', 'other'
);
create type complaint_source as enum ('guest_report', 'staff_observation', 'review');

create type review_source as enum (
  'booking.com', 'google', 'tripadvisor', 'airbnb', 'expedia', 'direct', 'other'
);
create type review_sentiment as enum ('positive', 'neutral', 'negative');

create type keyword_severity as enum ('critical', 'warning', 'positive');

create type alert_severity as enum ('critical', 'high', 'medium', 'low');
create type alert_type as enum ('keyword_threshold', 'complaint_overdue', 'utility_spike', 'manual');
create type alert_status as enum ('active', 'acknowledged', 'resolved');

create type action_item_priority as enum ('critical', 'high', 'medium', 'low');
create type action_item_status as enum ('todo', 'in_progress', 'done', 'dismissed');
create type action_item_source as enum ('complaint', 'review', 'financial', 'manual');

-- ─── PROPERTIES ──────────────────────────────────────────────

create table properties (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  type        property_type not null,
  location    text not null,
  total_rooms int not null default 0,
  status      property_status not null default 'active',
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table properties is 'The 5 Bee Hospitality properties — 2 hostels + 3 hotels';

-- ─── COMPLAINTS ──────────────────────────────────────────────

create table complaints (
  id              uuid primary key default uuid_generate_v4(),
  property_id     uuid not null references properties(id) on delete cascade,
  room_number     text,
  guest_name      text,
  category        complaint_category not null,
  severity        complaint_severity not null default 'medium',
  status          complaint_status not null default 'open',
  source          complaint_source not null default 'guest_report',
  description     text not null,
  reported_by     text not null default 'Staff', -- replaced with user name once auth added
  assigned_to     text,
  photo_urls      text[] default '{}',
  resolved_at     timestamptz,
  -- SLA tracking
  sla_deadline    timestamptz, -- auto-set by trigger based on severity
  is_overdue      boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table complaints is 'Guest complaints logged by staff. Core daily workflow.';
comment on column complaints.sla_deadline is 'Critical=1d, High=2d, Medium=5d, Low=7d from created_at';

-- Activity timeline for each complaint
create table complaint_updates (
  id            uuid primary key default uuid_generate_v4(),
  complaint_id  uuid not null references complaints(id) on delete cascade,
  author        text not null default 'Staff',
  action        text not null, -- 'logged', 'updated', 'escalated', 'assigned', 'resolved', 'closed', 'note'
  note          text,
  created_at    timestamptz not null default now()
);

comment on table complaint_updates is 'Timeline of all activity on a complaint';

-- ─── REVIEWS ─────────────────────────────────────────────────

create table reviews (
  id                    uuid primary key default uuid_generate_v4(),
  property_id           uuid not null references properties(id) on delete cascade,
  source                review_source not null,
  -- Normalised to /10 regardless of source (Google /5 → ×2, Booking /10 → keep)
  rating                numeric(3,1) not null check (rating >= 1 and rating <= 10),
  raw_rating            numeric(4,1), -- original value from source
  reviewer_name         text,
  review_text           text not null,
  review_date           date not null,
  -- Dedup hash — prevents re-importing same review
  content_hash          text not null,
  -- Keyword analysis (populated by DB function on insert)
  flagged_keywords      text[] default '{}',
  flag_count            int not null default 0,
  -- Rule-based sentiment (populated by DB function)
  sentiment             review_sentiment,
  sentiment_score       numeric(4,3), -- -1.0 to 1.0
  -- Phase 2 AI fields (null until Claude integration)
  ai_sentiment          review_sentiment,
  ai_key_issues         text[],
  ai_key_positives      text[],
  ai_suggested_response text,
  ai_analysed_at        timestamptz,
  imported_at           timestamptz not null default now(),
  created_at            timestamptz not null default now()
);

comment on table reviews is 'Guest reviews imported from OTAs via CSV. Keyword-flagged on insert.';
comment on column reviews.content_hash is 'md5(property_id || source || review_date || review_text) — prevents duplicates';
comment on column reviews.rating is 'Always out of 10 — Google /5 multiplied by 2 on import';

-- ─── REVIEW KEYWORDS ─────────────────────────────────────────

create table review_keywords (
  id           uuid primary key default uuid_generate_v4(),
  keyword      text not null unique,
  category     text not null, -- 'pest', 'facilities', 'staff', 'cleanliness', etc.
  severity     keyword_severity not null default 'warning',
  -- Alert threshold: how many mentions in 30 days before alert fires
  threshold    int not null default 3,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

comment on table review_keywords is 'Configurable keyword list. Matched against review_text on import.';

-- ─── ALERTS ──────────────────────────────────────────────────

create table alerts (
  id              uuid primary key default uuid_generate_v4(),
  property_id     uuid references properties(id) on delete cascade,
  type            alert_type not null,
  severity        alert_severity not null,
  title           text not null,
  message         text not null,
  -- Source reference (complaint id, keyword, etc.)
  source_keyword  text,
  source_ref_id   uuid,
  mention_count   int, -- for keyword alerts
  -- Resolution
  status          alert_status not null default 'active',
  acknowledged_at timestamptz,
  acknowledged_by text,
  resolved_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table alerts is 'Unified alert feed shown on dashboard. Fires from keyword thresholds, overdue complaints, etc.';

-- ─── ACTION ITEMS ─────────────────────────────────────────────

create table action_items (
  id            uuid primary key default uuid_generate_v4(),
  property_id   uuid references properties(id) on delete set null,
  title         text not null,
  description   text not null,
  priority      action_item_priority not null default 'medium',
  status        action_item_status not null default 'todo',
  source        action_item_source not null default 'manual',
  source_ref_id uuid, -- complaint_id or review_id that triggered this
  assigned_to   text,
  due_date      date,
  progress      int not null default 0 check (progress >= 0 and progress <= 100),
  cost_estimate numeric(10,2),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table action_items is 'Prioritised tasks generated by rules engine from complaints + review alerts';

-- ─── INDEXES ─────────────────────────────────────────────────

-- Complaints
create index idx_complaints_property_id  on complaints(property_id);
create index idx_complaints_status       on complaints(status);
create index idx_complaints_severity     on complaints(severity);
create index idx_complaints_created_at   on complaints(created_at desc);
create index idx_complaints_property_status on complaints(property_id, status);

-- Complaint updates
create index idx_complaint_updates_complaint_id on complaint_updates(complaint_id);
create index idx_complaint_updates_created_at   on complaint_updates(created_at desc);

-- Reviews
create index idx_reviews_property_id    on reviews(property_id);
create index idx_reviews_source         on reviews(source);
create index idx_reviews_review_date    on reviews(review_date desc);
create index idx_reviews_sentiment      on reviews(sentiment);
create index idx_reviews_content_hash   on reviews(content_hash); -- fast dedup check
create index idx_reviews_property_date  on reviews(property_id, review_date desc);
-- Full text search on review content
create index idx_reviews_text_trgm on reviews using gin(review_text gin_trgm_ops);

-- Alerts
create index idx_alerts_property_id  on alerts(property_id);
create index idx_alerts_status       on alerts(status);
create index idx_alerts_severity     on alerts(severity);
create index idx_alerts_created_at   on alerts(created_at desc);

-- Action items
create index idx_action_items_property_id on action_items(property_id);
create index idx_action_items_status      on action_items(status);
create index idx_action_items_priority    on action_items(priority);

-- ─── TRIGGERS ────────────────────────────────────────────────

-- Auto-update updated_at on any row change
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_properties_updated_at
  before update on properties
  for each row execute function set_updated_at();

create trigger trg_complaints_updated_at
  before update on complaints
  for each row execute function set_updated_at();

create trigger trg_alerts_updated_at
  before update on alerts
  for each row execute function set_updated_at();

create trigger trg_action_items_updated_at
  before update on action_items
  for each row execute function set_updated_at();

-- Auto-set SLA deadline on new complaint based on severity
create or replace function set_complaint_sla()
returns trigger language plpgsql as $$
begin
  new.sla_deadline = case new.severity
    when 'critical' then new.created_at + interval '1 day'
    when 'high'     then new.created_at + interval '2 days'
    when 'medium'   then new.created_at + interval '5 days'
    when 'low'      then new.created_at + interval '7 days'
  end;
  return new;
end;
$$;

create trigger trg_complaint_sla
  before insert on complaints
  for each row execute function set_complaint_sla();

-- Auto-log "Complaint logged" entry on new complaint
create or replace function log_complaint_created()
returns trigger language plpgsql as $$
begin
  insert into complaint_updates(complaint_id, author, action, note)
  values (new.id, new.reported_by, 'logged', 'Complaint logged — ' || new.category || ' (' || new.severity || ')');
  return new;
end;
$$;

create trigger trg_complaint_created_log
  after insert on complaints
  for each row execute function log_complaint_created();

-- ─── VIEWS ───────────────────────────────────────────────────

-- Property health summary — used by dashboard
create or replace view property_health as
select
  p.id                                    as property_id,
  p.name                                  as property_name,
  p.type                                  as property_type,
  p.location,
  -- Complaints
  count(c.id) filter (
    where c.status in ('open', 'pending')
  )                                       as open_complaints,
  count(c.id) filter (
    where c.severity = 'critical'
    and c.status in ('open', 'pending')
  )                                       as critical_complaints,
  -- Reviews (last 30 days)
  round(avg(r.rating) filter (
    where r.review_date >= current_date - 30
  ), 1)                                   as avg_rating_30d,
  count(r.id) filter (
    where r.review_date >= current_date - 30
  )                                       as reviews_30d,
  count(r.id) filter (
    where r.sentiment = 'negative'
    and r.review_date >= current_date - 30
  )                                       as negative_reviews_30d,
  -- Alerts
  count(a.id) filter (
    where a.status = 'active'
    and a.severity = 'critical'
  )                                       as critical_alerts,
  count(a.id) filter (
    where a.status = 'active'
  )                                       as total_active_alerts,
  -- Action items overdue
  count(ai.id) filter (
    where ai.status in ('todo', 'in_progress')
    and ai.due_date < current_date
  )                                       as overdue_actions
from properties p
left join complaints c  on c.property_id = p.id
left join reviews r     on r.property_id = p.id
left join alerts a      on a.property_id = p.id
left join action_items ai on ai.property_id = p.id
where p.status = 'active'
group by p.id, p.name, p.type, p.location;

comment on view property_health is 'Live property health metrics — source for dashboard KPI cards and property table';

-- Recent keyword hits — used by alert generation
create or replace view keyword_hit_counts as
select
  p.id                                          as property_id,
  p.name                                        as property_name,
  kw.keyword,
  kw.category,
  kw.severity,
  kw.threshold,
  count(r.id)                                   as hit_count_30d,
  count(r.id) >= kw.threshold                   as threshold_exceeded
from review_keywords kw
cross join properties p
left join reviews r on r.property_id = p.id
  and r.review_date >= current_date - 30
  and r.review_text ilike '%' || kw.keyword || '%'
where kw.is_active = true
group by p.id, p.name, kw.keyword, kw.category, kw.severity, kw.threshold;

comment on view keyword_hit_counts is 'Per-property keyword mention counts in last 30 days. Powers alert generation.';
