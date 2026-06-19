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
-- ============================================================
-- Bee Hospitality Audit Pro — Seed Data
-- Migration 002: 5 properties + complaints + reviews + keywords
-- ============================================================

-- ─── PROPERTIES ──────────────────────────────────────────────

insert into properties (id, name, type, location, total_rooms, status, description) values
  ('a1000000-0000-0000-0000-000000000001', 'Bee Hostel Paphos',   'hostel', 'Paphos, Cyprus',    30, 'active', 'Budget hostel near the harbour, popular with backpackers and young travellers. 8 dorms + 6 private rooms.'),
  ('a1000000-0000-0000-0000-000000000002', 'Bee Hostel Limassol', 'hostel', 'Limassol, Cyprus',  25, 'active', 'City-centre hostel close to the Old Port. Mix of dorms and private en-suite rooms. Strong repeat guest base.'),
  ('a1000000-0000-0000-0000-000000000003', 'Elysium Boutique Hotel', 'hotel', 'Nicosia, Cyprus', 60, 'active', '4-star boutique hotel in the capital. Business travellers and long-stay guests. Full breakfast included.'),
  ('a1000000-0000-0000-0000-000000000004', 'Aphrodite Bay Hotel',  'hotel', 'Larnaca, Cyprus',   45, 'active', '3-star beachfront hotel 10 minutes from Larnaca airport. Mostly package tour guests via Booking.com.'),
  ('a1000000-0000-0000-0000-000000000005', 'Ayia Napa Sands Hotel','hotel', 'Ayia Napa, Cyprus', 80, 'active', '4-star resort hotel. Peak season June–September. High volume of reviews and complaints during summer.');

-- ─── REVIEW KEYWORDS ─────────────────────────────────────────

insert into review_keywords (keyword, category, severity, threshold) values
  -- Critical pest/safety
  ('bedbug',            'pest',         'critical', 2),
  ('bed bug',           'pest',         'critical', 2),
  ('cockroach',         'pest',         'critical', 2),
  ('mouse',             'pest',         'critical', 2),
  ('pest',              'pest',         'critical', 3),
  ('uninvited guest',   'pest',         'critical', 1), -- AI catches this as bedbug
  -- High priority facilities
  ('no hot water',      'facilities',   'warning',  3),
  ('hot water',         'facilities',   'warning',  4),
  ('air conditioning',  'facilities',   'warning',  3),
  ('ac not working',    'facilities',   'warning',  2),
  ('air con',           'facilities',   'warning',  3),
  ('no wifi',           'facilities',   'warning',  5),
  ('wifi slow',         'facilities',   'warning',  5),
  -- Cleanliness
  ('dirty',             'cleanliness',  'warning',  4),
  ('smell',             'cleanliness',  'warning',  5),
  ('smelly',            'cleanliness',  'warning',  4),
  ('mould',             'cleanliness',  'warning',  3),
  ('stain',             'cleanliness',  'warning',  4),
  ('bathroom dirty',    'cleanliness',  'warning',  3),
  -- Staff
  ('rude staff',        'staff',        'warning',  2),
  ('unhelpful',         'staff',        'warning',  3),
  ('ignored',           'staff',        'warning',  3),
  -- Positive keywords
  ('clean',             'cleanliness',  'positive', 999),
  ('spotless',          'cleanliness',  'positive', 999),
  ('great staff',       'staff',        'positive', 999),
  ('friendly',          'staff',        'positive', 999),
  ('helpful',           'staff',        'positive', 999),
  ('excellent',         'overall',      'positive', 999),
  ('amazing',           'overall',      'positive', 999),
  ('perfect location',  'location',     'positive', 999),
  ('good value',        'value',        'positive', 999),
  ('will return',       'loyalty',      'positive', 999),
  ('highly recommend',  'loyalty',      'positive', 999);

-- ─── COMPLAINTS ──────────────────────────────────────────────
-- Realistic mix: 2 critical, 4 high, 6 medium, 3 low
-- spread across properties, varying ages (to show overdue status)

insert into complaints
  (id, property_id, room_number, guest_name, category, severity, status, source, description, reported_by, assigned_to, created_at, updated_at)
values
  -- CRITICAL
  ('c1000000-0000-0000-0000-000000000001',
   'a1000000-0000-0000-0000-000000000001', '12', 'Maria K.',
   'pest', 'critical', 'open', 'guest_report',
   'Guest reported what appears to be a bedbug on the mattress of bed 3 in Room 12. Guest is very upset and has taken a photo. Requested immediate room change.',
   'Chris (Front Desk)', 'Christos',
   now() - interval '5 hours', now() - interval '5 hours'),

  ('c1000000-0000-0000-0000-000000000002',
   'a1000000-0000-0000-0000-000000000003', '204', 'Ahmed Al-Hassan',
   'maintenance', 'critical', 'open', 'guest_report',
   'AC unit completely non-functional. Guest checked in with two young children. Room temperature reached 32°C. Guest threatened to leave and post a 1-star review.',
   'Elysium Reception', 'Maintenance',
   now() - interval '1 day 3 hours', now() - interval '1 day 3 hours'),

  -- HIGH
  ('c1000000-0000-0000-0000-000000000003',
   'a1000000-0000-0000-0000-000000000002', '8B', 'Thomas M.',
   'noise', 'high', 'pending', 'guest_report',
   'Guest in dorm 8B reports excessive noise from the adjacent common room after 1am. Third consecutive night. Guest has asked for a room transfer.',
   'Limassol Night Staff', null,
   now() - interval '3 days', now() - interval '2 days'),

  ('c1000000-0000-0000-0000-000000000004',
   'a1000000-0000-0000-0000-000000000004', '315', 'Sandra & Peter B.',
   'cleanliness', 'high', 'open', 'guest_report',
   'Shower curtain has visible mould along the bottom. Bathroom tiles have black staining. Towels provided had a brown stain. Guests took photos.',
   'Larnaca Front Desk', 'Housekeeping Supervisor',
   now() - interval '18 hours', now() - interval '18 hours'),

  ('c1000000-0000-0000-0000-000000000005',
   'a1000000-0000-0000-0000-000000000005', '502', 'Yiannis P.',
   'facilities', 'high', 'open', 'guest_report',
   'No hot water in room 502 for the past 2 days. Guest raised it at check-in yesterday and again this morning. Still unresolved.',
   'Ayia Napa Front Desk', 'Engineering',
   now() - interval '2 days 5 hours', now() - interval '2 days 5 hours'),

  ('c1000000-0000-0000-0000-000000000006',
   'a1000000-0000-0000-0000-000000000001', '6', null,
   'maintenance', 'high', 'open', 'staff_observation',
   'Room 6 ceiling has a water stain approximately 30cm in diameter above the bed. Appeared after last night''s rain. No active drip but stain is spreading.',
   'Chris (Front Desk)', null,
   now() - interval '1 day', now() - interval '1 day'),

  -- MEDIUM
  ('c1000000-0000-0000-0000-000000000007',
   'a1000000-0000-0000-0000-000000000003', '118', 'Eleni D.',
   'noise', 'medium', 'pending', 'guest_report',
   'Corridor noise from housekeeping trolleys starting at 7am woke the guest. Requests housekeeping to begin after 9am or operate more quietly.',
   'Elysium Reception', null,
   now() - interval '4 days', now() - interval '4 days'),

  ('c1000000-0000-0000-0000-000000000008',
   'a1000000-0000-0000-0000-000000000002', null, 'Backpacker group (5 pax)',
   'facilities', 'medium', 'open', 'guest_report',
   'WiFi in the female dorm section is extremely slow — barely usable. Works fine in lobby. Guests working remotely and very frustrated.',
   'Limassol Front Desk', 'IT / Maintenance',
   now() - interval '6 days', now() - interval '6 days'),

  ('c1000000-0000-0000-0000-000000000009',
   'a1000000-0000-0000-0000-000000000004', '401', 'Ronke A.',
   'cleanliness', 'medium', 'resolved', 'guest_report',
   'Hair found on pillow case and bed sheet at check-in. Room had not been properly turned over from previous guest. Guest requested full linen change.',
   'Larnaca Front Desk', 'Housekeeping',
   now() - interval '5 days', now() - interval '4 days 20 hours'),

  ('c1000000-0000-0000-0000-000000000010',
   'a1000000-0000-0000-0000-000000000005', 'Pool area', null,
   'safety', 'medium', 'open', 'staff_observation',
   'Pool gate latch broken — gate can be pushed open from outside. Safety risk especially with children guests. Flagged by lifeguard on morning inspection.',
   'Ayia Napa Lifeguard', 'Maintenance',
   now() - interval '2 days', now() - interval '2 days'),

  ('c1000000-0000-0000-0000-000000000011',
   'a1000000-0000-0000-0000-000000000003', '307', 'David C.',
   'staff', 'medium', 'pending', 'guest_report',
   'Guest reports that reception staff were dismissive when he asked for restaurant recommendations. Said he was told "we don''t have that information" — basic hospitality failure.',
   'Manager on duty', null,
   now() - interval '3 days', now() - interval '3 days'),

  ('c1000000-0000-0000-0000-000000000012',
   'a1000000-0000-0000-0000-000000000001', '14', 'Lena V.',
   'facilities', 'medium', 'open', 'guest_report',
   'Locker in Room 14 has a broken lock. Guest cannot secure their valuables. Especially concerning for shared dorm environment.',
   'Chris (Front Desk)', null,
   now() - interval '1 day 10 hours', now() - interval '1 day 10 hours'),

  -- LOW
  ('c1000000-0000-0000-0000-000000000013',
   'a1000000-0000-0000-0000-000000000004', 'Breakfast room', null,
   'facilities', 'low', 'open', 'guest_report',
   'Coffee machine in breakfast room makes a loud grinding noise when starting. Several guests have commented. Not urgent but affects morning experience.',
   'Larnaca F&B Staff', null,
   now() - interval '7 days', now() - interval '7 days'),

  ('c1000000-0000-0000-0000-000000000014',
   'a1000000-0000-0000-0000-000000000002', null, null,
   'cleanliness', 'low', 'resolved', 'staff_observation',
   'Common bathroom floor had a buildup of soap scum around the drain. Cleaned and reported to ensure daily check added to housekeeping list.',
   'Limassol Housekeeper', null,
   now() - interval '10 days', now() - interval '9 days'),

  ('c1000000-0000-0000-0000-000000000015',
   'a1000000-0000-0000-0000-000000000005', 'Lobby', null,
   'other', 'low', 'closed', 'guest_report',
   'Guest requested a Cyprus tourism map and information leaflets. None available at reception. Minor but easy to fix — contact the Cyprus Tourism Organisation.',
   'Ayia Napa Reception', null,
   now() - interval '14 days', now() - interval '12 days');

-- Add some manual timeline updates for the resolved/pending complaints
insert into complaint_updates (complaint_id, author, action, note, created_at)
values
  ('c1000000-0000-0000-0000-000000000003', 'Christos (Manager)', 'updated',
   'Offered guest a room transfer to Room 10A. Guest declined — prefers to stay put but requests noise to stop by midnight.', now() - interval '2 days 10 hours'),

  ('c1000000-0000-0000-0000-000000000003', 'Limassol Night Staff', 'note',
   'Common room closed at 11:30pm last night. Guest appeared satisfied this morning.', now() - interval '1 day 8 hours'),

  ('c1000000-0000-0000-0000-000000000009', 'Housekeeping Supervisor', 'updated',
   'Full linen change completed within 20 minutes of complaint. Guest thanked staff. Flagging for review of room turnover checklist.', now() - interval '4 days 22 hours'),

  ('c1000000-0000-0000-0000-000000000009', 'Christos (Manager)', 'resolved',
   'Complaint resolved. Will add "linen spot check" step to room turnover SOP.', now() - interval '4 days 20 hours'),

  ('c1000000-0000-0000-0000-000000000004', 'Housekeeping Supervisor', 'updated',
   'Sent housekeeping to assess. Shower curtain replacement ordered. Expected delivery tomorrow. Offered guest a room upgrade to 320 as interim solution.', now() - interval '12 hours');

-- ─── REVIEWS ─────────────────────────────────────────────────
-- 50 realistic reviews spread across 5 properties, various sources
-- Includes bedbug pattern at Paphos, AC complaints at Hotel A

insert into reviews
  (property_id, source, rating, raw_rating, reviewer_name, review_text, review_date, content_hash, sentiment)
values

-- BEE HOSTEL PAPHOS — 10 reviews, bedbug pattern building (3 mentions → should trigger CRITICAL alert)
('a1000000-0000-0000-0000-000000000001', 'booking.com', 4.0, 4.0, 'TravellerDE_Klaus',
 'Great location near the harbour. Staff were friendly and helpful. However I noticed what looked like a bedbug on my mattress on the second night. Reported to staff but not sure it was taken seriously.',
 current_date - 25, md5('a10001booking.com' || (current_date - 25)::text || 'great location near the harbour'), 'negative'),

('a1000000-0000-0000-0000-000000000001', 'google', 2.0, 1.0, 'Sarah M.',
 'Cannot recommend. Found a bedbug in my bed on the first night. Staff moved me to another room but I found another one there too. My luggage was potentially contaminated. Disgusting experience.',
 current_date - 18, md5('a10001google' || (current_date - 18)::text || 'cannot recommend found a bedbug'), 'negative'),

('a1000000-0000-0000-0000-000000000001', 'tripadvisor', 3.0, 1.5, 'BackpackerAnonymous',
 'Fun hostel with good vibe. Met lots of travellers. Negative: I had uninvited guests in the night on my mattress (if you know what I mean). Woke up with bites. Bedbug problem needs to be dealt with urgently.',
 current_date - 12, md5('a10001tripadvisor' || (current_date - 12)::text || 'fun hostel with good vibe'), 'negative'),

('a1000000-0000-0000-0000-000000000001', 'booking.com', 8.0, 8.0, 'Nomad_Nico',
 'Solid budget option in Paphos. Clean enough, helpful staff. The breakfast is simple but does the job. WiFi was good throughout. Would stay again.',
 current_date - 30, md5('a10001booking.com' || (current_date - 30)::text || 'solid budget option in paphos'), 'positive'),

('a1000000-0000-0000-0000-000000000001', 'google', 9.0, 4.5, 'Elisa_PT',
 'Amazing hostel! Great staff, very clean, perfect location for exploring Paphos. The pool area is a nice touch. Highly recommend for solo travellers.',
 current_date - 45, md5('a10001google' || (current_date - 45)::text || 'amazing hostel great staff'), 'positive'),

('a1000000-0000-0000-0000-000000000001', 'booking.com', 7.0, 7.0, 'Marcus_SE',
 'Good value for money. The dorm was a bit loud at night but that is hostel life. Friendly staff and great common areas. Location is excellent — 5 minutes from the beach.',
 current_date - 20, md5('a10001booking.com' || (current_date - 20)::text || 'good value for money dorm'), 'positive'),

('a1000000-0000-0000-0000-000000000001', 'tripadvisor', 6.0, 3.0, 'JourneyJane_UK',
 'Mixed experience. The common room is lively and the staff are nice. But our room smelled musty when we arrived and the curtains were dirty. Needs better deep cleaning.',
 current_date - 8, md5('a10001tripadvisor' || (current_date - 8)::text || 'mixed experience common room'), 'neutral'),

('a1000000-0000-0000-0000-000000000001', 'google', 8.0, 4.0, 'CyprusFirstTimer',
 'Really enjoyed my stay! Perfect base for seeing Paphos. Chris at the front desk was incredibly helpful with restaurant recommendations. Will return.',
 current_date - 35, md5('a10001google' || (current_date - 35)::text || 'really enjoyed my stay chris'), 'positive'),

('a1000000-0000-0000-0000-000000000001', 'booking.com', 5.0, 5.0, 'Reviewer_PL',
 'Average hostel. Nothing special. The hot water was inconsistent — sometimes hot, sometimes cold. Locker in dorm was broken. Staff tried to help but limited options.',
 current_date - 15, md5('a10001booking.com' || (current_date - 15)::text || 'average hostel nothing special'), 'neutral'),

('a1000000-0000-0000-0000-000000000001', 'tripadvisor', 9.0, 4.5, 'ExpatCyprus',
 'One of the best hostels I have stayed at in Cyprus. Spotless, well managed, great location. The breakfast was simple but fresh. Highly recommend.',
 current_date - 50, md5('a10001tripadvisor' || (current_date - 50)::text || 'one of the best hostels cyprus'), 'positive'),

-- BEE HOSTEL LIMASSOL — 10 reviews, mostly positive, WiFi complaints
('a1000000-0000-0000-0000-000000000002', 'booking.com', 8.5, 8.5, 'Sonia_GR',
 'Excellent hostel in Limassol. Great location near the old port. Staff were friendly and full of local knowledge. Clean rooms and good breakfast.',
 current_date - 10, md5('a10002booking.com' || (current_date - 10)::text || 'excellent hostel limassol'), 'positive'),

('a1000000-0000-0000-0000-000000000002', 'google', 7.0, 3.5, 'DigitalNomad_FR',
 'Good hostel overall but the WiFi in the dorm rooms was painfully slow. I work remotely and could not use it for video calls. Had to go to cafes. Otherwise clean and good value.',
 current_date - 5, md5('a10002google' || (current_date - 5)::text || 'good hostel overall wifi slow'), 'neutral'),

('a1000000-0000-0000-0000-000000000002', 'tripadvisor', 9.0, 4.5, 'HappyTraveller_AU',
 'Absolutely loved this place! The staff were amazing, especially the morning team. Perfect location. Will return every time I visit Cyprus.',
 current_date - 22, md5('a10002tripadvisor' || (current_date - 22)::text || 'absolutely loved this place'), 'positive'),

('a1000000-0000-0000-0000-000000000002', 'booking.com', 6.5, 6.5, 'StudentTraveller_IT',
 'Good for the price. The dorm was clean but WiFi was very slow. Also the noise from the street was noticeable at night. Earplugs recommended.',
 current_date - 14, md5('a10002booking.com' || (current_date - 14)::text || 'good for the price dorm clean'), 'neutral'),

('a1000000-0000-0000-0000-000000000002', 'google', 8.0, 4.0, 'Sarah_IE',
 'Friendly staff, clean facilities, great location. The communal kitchen was well-equipped. Only minor complaint is the no wifi in dorm issue.',
 current_date - 7, md5('a10002google' || (current_date - 7)::text || 'friendly staff clean facilities'), 'positive'),

('a1000000-0000-0000-0000-000000000002', 'booking.com', 9.5, 9.5, 'PerfectStay_NL',
 'Perfect stay. The staff went above and beyond. Room was spotless. One of my best hostel experiences in Europe. Highly recommend.',
 current_date - 40, md5('a10002booking.com' || (current_date - 40)::text || 'perfect stay staff above beyond'), 'positive'),

('a1000000-0000-0000-0000-000000000002', 'tripadvisor', 7.5, 3.75, 'CasualTraveller_US',
 'Decent hostel. Nothing to complain about, nothing to rave about. The WiFi connection could be better — no wifi signal in the far dorm rooms.',
 current_date - 18, md5('a10002tripadvisor' || (current_date - 18)::text || 'decent hostel nothing to complain'), 'neutral'),

('a1000000-0000-0000-0000-000000000002', 'google', 9.0, 4.5, 'PhotoTraveller_JP',
 'Beautiful hostel. Clean, modern, great vibe. The staff were so helpful with day trips and recommendations. Limassol is a great city — this hostel is the perfect base.',
 current_date - 55, md5('a10002google' || (current_date - 55)::text || 'beautiful hostel clean modern'), 'positive'),

('a1000000-0000-0000-0000-000000000002', 'booking.com', 5.0, 5.0, 'Budget_Traveller_RO',
 'OK for the price but I expected more. The bathroom was clean but the smell was a bit off in the corridor. Beds were comfortable. WiFi was unusably slow in room.',
 current_date - 9, md5('a10002booking.com' || (current_date - 9)::text || 'ok for the price expected more'), 'neutral'),

('a1000000-0000-0000-0000-000000000002', 'tripadvisor', 8.0, 4.0, 'Long_Stayer_DE',
 'Stayed 10 nights and it was great. Very friendly and helpful staff. Good breakfast. Clean. WiFi in common areas is fine but weak in rooms.',
 current_date - 30, md5('a10002tripadvisor' || (current_date - 30)::text || 'stayed 10 nights was great'), 'positive'),

-- ELYSIUM BOUTIQUE HOTEL — 10 reviews, AC complaints, mostly high ratings
('a1000000-0000-0000-0000-000000000003', 'booking.com', 8.0, 8.0, 'BusinessTraveller_GB',
 'Great hotel for business travel. Central location, helpful staff. The breakfast was excellent. Only issue was that the air conditioning was not cold enough — room stayed warm.',
 current_date - 6, md5('a10003booking.com' || (current_date - 6)::text || 'great hotel business travel'), 'positive'),

('a1000000-0000-0000-0000-000000000003', 'google', 6.0, 3.0, 'FamilyHoliday_AE',
 'Disappointing for a 4-star hotel. The air conditioning in our room was barely functional. With young children this was a serious problem. Staff were polite but slow to fix it.',
 current_date - 3, md5('a10003google' || (current_date - 3)::text || 'disappointing 4-star air conditioning'), 'negative'),

('a1000000-0000-0000-0000-000000000003', 'tripadvisor', 9.0, 4.5, 'LuxurySeeker_CH',
 'Beautiful boutique hotel. The rooms are tastefully decorated and the staff are attentive. Breakfast was outstanding. Will definitely return.',
 current_date - 20, md5('a10003tripadvisor' || (current_date - 20)::text || 'beautiful boutique hotel rooms'), 'positive'),

('a1000000-0000-0000-0000-000000000003', 'booking.com', 7.5, 7.5, 'Conference_Guest_CY',
 'Good hotel. Room was clean and well furnished. The AC unit was making a strange noise but otherwise worked. Breakfast selection was excellent.',
 current_date - 12, md5('a10003booking.com' || (current_date - 12)::text || 'good hotel room clean well furnished'), 'positive'),

('a1000000-0000-0000-0000-000000000003', 'google', 9.5, 4.75, 'HoneymoonCouple_IT',
 'Perfect hotel for a romantic stay. Staff were incredibly attentive. Room was spotless. Highly recommend the penthouse suite — amazing views of Nicosia.',
 current_date - 35, md5('a10003google' || (current_date - 35)::text || 'perfect hotel romantic stay'), 'positive'),

('a1000000-0000-0000-0000-000000000003', 'tripadvisor', 7.0, 3.5, 'FrequentFlyer_US',
 'Good hotel but not exceptional. Staff were helpful but some seemed undertrained — basic questions about the city were met with uncertainty. Location is excellent for business.',
 current_date - 28, md5('a10003tripadvisor' || (current_date - 28)::text || 'good hotel not exceptional staff'), 'neutral'),

('a1000000-0000-0000-0000-000000000003', 'booking.com', 5.0, 5.0, 'DisappointedGuest_DE',
 'For a boutique hotel claiming 4 stars, I expected much better. The air con was not working properly — had to call reception twice. Eventually they sent maintenance but it was still too warm.',
 current_date - 4, md5('a10003booking.com' || (current_date - 4)::text || 'boutique hotel claiming 4 stars'), 'negative'),

('a1000000-0000-0000-0000-000000000003', 'google', 8.5, 4.25, 'CyprusResident_LV',
 'Stayed for a local wedding. The hotel handled the group beautifully. Excellent food, attentive staff, great facilities. Would return for the restaurant alone.',
 current_date - 42, md5('a10003google' || (current_date - 42)::text || 'stayed for local wedding hotel'), 'positive'),

('a1000000-0000-0000-0000-000000000003', 'tripadvisor', 8.0, 4.0, 'SoloTraveller_NO',
 'Comfortable and well located. Staff were friendly and helpful. Good breakfast. Only niggle is the air conditioning was a bit noisy at night — kept waking me up.',
 current_date - 15, md5('a10003tripadvisor' || (current_date - 15)::text || 'comfortable well located staff'), 'positive'),

('a1000000-0000-0000-0000-000000000003', 'booking.com', 9.0, 9.0, 'CorporateTravel_PL',
 'Excellent hotel. Clean, quiet, well managed. The breakfast is probably the best I have had in Cyprus. Staff remembered my name from a previous stay — impressive attention to detail.',
 current_date - 60, md5('a10003booking.com' || (current_date - 60)::text || 'excellent hotel clean quiet breakfast'), 'positive'),

-- APHRODITE BAY HOTEL LARNACA — 10 reviews, mostly positive
('a1000000-0000-0000-0000-000000000004', 'booking.com', 8.0, 8.0, 'BeachLover_UK',
 'Great beachfront location. Room was clean and the view was wonderful. Staff were efficient at check-in. Food at the restaurant was good value. Will return.',
 current_date - 8, md5('a10004booking.com' || (current_date - 8)::text || 'great beachfront location room'), 'positive'),

('a1000000-0000-0000-0000-000000000004', 'expedia', 7.0, 3.5, 'Package_Tourist_IE',
 'Decent hotel for the price. Beach access is the main selling point. Room was a bit dated but clean. Breakfast included was a plus. Staff helpful.',
 current_date - 20, md5('a10004expedia' || (current_date - 20)::text || 'decent hotel for the price beach'), 'neutral'),

('a1000000-0000-0000-0000-000000000004', 'google', 9.0, 4.5, 'GreekCypriot_CY',
 'Stayed for a long weekend. Excellent service — staff went out of their way to make us feel welcome. Beach is clean and close. Highly recommend.',
 current_date - 15, md5('a10004google' || (current_date - 15)::text || 'stayed for long weekend excellent'), 'positive'),

('a1000000-0000-0000-0000-000000000004', 'tripadvisor', 6.0, 3.0, 'TripAdvisor_Critic_DE',
 'The room was dirty when we arrived — hairs on the bed and a stain on the carpet. Reported to reception who apologised and sent housekeeping. Clean after but should not happen.',
 current_date - 5, md5('a10004tripadvisor' || (current_date - 5)::text || 'room was dirty when we arrived'), 'negative'),

('a1000000-0000-0000-0000-000000000004', 'booking.com', 8.5, 8.5, 'FamilyTrip_SE',
 'Perfect family hotel. Kids loved the beach. Pool was clean and not too crowded. Staff were brilliant with our children. Breakfast had great variety. One of our best holidays.',
 current_date - 25, md5('a10004booking.com' || (current_date - 25)::text || 'perfect family hotel kids beach'), 'positive'),

('a1000000-0000-0000-0000-000000000004', 'expedia', 7.5, 3.75, 'CoupleGetaway_NL',
 'Good hotel. The view from our room was spectacular. Food was good. Only complaint is the WiFi was a bit slow in the room. Overall a great trip.',
 current_date - 32, md5('a10004expedia' || (current_date - 32)::text || 'good hotel view from room spectacular'), 'positive'),

('a1000000-0000-0000-0000-000000000004', 'google', 8.0, 4.0, 'Reviewer_AUS',
 'Very pleasant stay. The hotel is a bit dated in decor but extremely clean and well maintained. Staff were professional and helpful. Good location near the airport.',
 current_date - 18, md5('a10004google' || (current_date - 18)::text || 'very pleasant stay hotel dated decor'), 'positive'),

('a1000000-0000-0000-0000-000000000004', 'tripadvisor', 7.0, 3.5, 'Annual_Visitor_RU',
 'I come here every year. The quality has been consistent. Staff know me by name now. The beach is the real star. Breakfast could use more variety but no major complaints.',
 current_date - 40, md5('a10004tripadvisor' || (current_date - 40)::text || 'come here every year quality'), 'positive'),

('a1000000-0000-0000-0000-000000000004', 'booking.com', 5.5, 5.5, 'ToughCritic_GB',
 'The hotel is showing its age. The bathroom had a smell and the furniture was worn. Staff were fine. The beach access is the only real positive here. Needs refurbishment.',
 current_date - 12, md5('a10004booking.com' || (current_date - 12)::text || 'hotel showing its age bathroom smell'), 'negative'),

('a1000000-0000-0000-0000-000000000004', 'google', 9.0, 4.5, 'Honeymooner_CY',
 'We spent our honeymoon here and it was magical. The staff decorated our room with flowers without being asked. Outstanding personal touches. Highly recommend for couples.',
 current_date - 50, md5('a10004google' || (current_date - 50)::text || 'spent our honeymoon here magical'), 'positive'),

-- AYIA NAPA SANDS HOTEL — 10 reviews, seasonal volume, high expectations
('a1000000-0000-0000-0000-000000000005', 'booking.com', 8.5, 8.5, 'ClubMed_FR',
 'Great resort hotel. The pool area is fantastic and the entertainment team is excellent. Food was varied and tasty. Beach is a 2-minute walk. Highly recommend for summer holidays.',
 current_date - 10, md5('a10005booking.com' || (current_date - 10)::text || 'great resort hotel pool area'), 'positive'),

('a1000000-0000-0000-0000-000000000005', 'tripadvisor', 7.0, 3.5, 'PartyTraveller_UK',
 'Good hotel for Ayia Napa. The nightlife is close by which is what we wanted. Hotel itself is clean and well run. Hot water pressure was a bit low in our room but not a dealbreaker.',
 current_date - 7, md5('a10005tripadvisor' || (current_date - 7)::text || 'good hotel ayia napa nightlife'), 'positive'),

('a1000000-0000-0000-0000-000000000005', 'google', 6.0, 3.0, 'FamilyFromRomania',
 'Mixed experience. The hotel is large and can feel impersonal. There was no hot water for the first 2 hours after we checked in. Staff were slow to respond. Pool was nice though.',
 current_date - 3, md5('a10005google' || (current_date - 3)::text || 'mixed experience hotel large impersonal'), 'neutral'),

('a1000000-0000-0000-0000-000000000005', 'booking.com', 9.0, 9.0, 'SummerHoliday_IL',
 'Perfect summer holiday. Everything was great — rooms clean, food excellent, beach beautiful, staff friendly. Kids had an amazing time. Will return next summer without question.',
 current_date - 20, md5('a10005booking.com' || (current_date - 20)::text || 'perfect summer holiday everything great'), 'positive'),

('a1000000-0000-0000-0000-000000000005', 'tripadvisor', 4.0, 2.0, 'DisappointedMum_IE',
 'Not what we expected for a 4-star resort. The room was dirty on arrival — sand on the floor and a smell. The pool was overcrowded. No hot water in the evenings. Very disappointing.',
 current_date - 6, md5('a10005tripadvisor' || (current_date - 6)::text || 'not what expected 4-star resort dirty'), 'negative'),

('a1000000-0000-0000-0000-000000000005', 'google', 9.5, 4.75, 'BeachHoliday_IL',
 'Amazing resort. Perfect for families. The beach access is incredible and the staff are superb. Clean rooms, great food, excellent entertainment. Five stars from us.',
 current_date - 30, md5('a10005google' || (current_date - 30)::text || 'amazing resort perfect for families'), 'positive'),

('a1000000-0000-0000-0000-000000000005', 'booking.com', 7.0, 7.0, 'BackToBack_DE',
 'Second year here. Generally good. Noticed the hot water issue in rooms near the pool — seems like a recurring problem judging by other reviews. Management should look into it.',
 current_date - 15, md5('a10005booking.com' || (current_date - 15)::text || 'second year here generally good hot water'), 'neutral'),

('a1000000-0000-0000-0000-000000000005', 'tripadvisor', 8.0, 4.0, 'GroupTrip_GR',
 'Came here with 8 friends. The hotel managed our group well. Rooms were clean and spacious. Staff organised a private pool area for us which was brilliant. Good value for money.',
 current_date - 22, md5('a10005tripadvisor' || (current_date - 22)::text || 'came here with 8 friends hotel'), 'positive'),

('a1000000-0000-0000-0000-000000000005', 'google', 5.0, 2.5, 'HonestReview_CZ',
 'The hotel has potential but is poorly managed in peak season. Dirty rooms, slow service, no hot water for half our stay. The pool saved the holiday. For the price, not acceptable.',
 current_date - 4, md5('a10005google' || (current_date - 4)::text || 'hotel has potential poorly managed'), 'negative'),

('a1000000-0000-0000-0000-000000000005', 'booking.com', 9.0, 9.0, 'SunSeeker_NL',
 'Brilliant holiday. Spotless hotel, amazing food, wonderful staff. The entertainment every evening was a highlight. Ayia Napa is fantastic in July. Will return.',
 current_date - 35, md5('a10005booking.com' || (current_date - 35)::text || 'brilliant holiday spotless hotel amazing'), 'positive');

-- ─── ALERTS ──────────────────────────────────────────────────
-- Pre-populate with alerts that match the seed data above

insert into alerts (property_id, type, severity, title, message, source_keyword, mention_count, status) values

  ('a1000000-0000-0000-0000-000000000001',
   'keyword_threshold', 'critical',
   'BEDBUG ALERT — Bee Hostel Paphos',
   '3 reviews in the past 30 days mention bedbugs. This exceeds the threshold of 2. Immediate professional inspection required.',
   'bedbug', 3, 'active'),

  ('a1000000-0000-0000-0000-000000000003',
   'keyword_threshold', 'high',
   'AC issues — Elysium Boutique Hotel',
   '3 reviews in the past 30 days mention air conditioning problems. Threshold reached. Engineering inspection recommended before peak season.',
   'air conditioning', 3, 'active'),

  ('a1000000-0000-0000-0000-000000000005',
   'keyword_threshold', 'high',
   'Hot water complaints — Ayia Napa Sands Hotel',
   '3 reviews mention hot water issues in the past 30 days. Likely plumbing/boiler issue in pool-facing rooms. Engineering inspection required.',
   'hot water', 3, 'active'),

  ('a1000000-0000-0000-0000-000000000002',
   'keyword_threshold', 'high',
   'WiFi complaints — Bee Hostel Limassol',
   '4 reviews mention poor WiFi in the past 30 days. Threshold of 5 approaching. Check router coverage in dorm rooms.',
   'wifi slow', 4, 'active'),

  ('a1000000-0000-0000-0000-000000000001',
   'complaint_overdue', 'critical',
   'Critical complaint overdue — Bee Hostel Paphos',
   'Complaint C-001 (pest/bedbug) has been open for 5 hours without resolution. SLA is 24 hours.',
   null, null, 'active');

-- ─── ACTION ITEMS ─────────────────────────────────────────────

insert into action_items (property_id, title, description, priority, status, source, due_date, assigned_to) values

  ('a1000000-0000-0000-0000-000000000001',
   'Emergency pest treatment — Bee Hostel Paphos',
   '3 bedbug mentions in reviews + active complaint in Room 12. Call licensed pest control immediately. Quarantine Room 12 and any flagged rooms. Inspect all mattresses. Document treatment for health compliance.',
   'critical', 'todo', 'review',
   current_date, 'Christos (Manager)'),

  ('a1000000-0000-0000-0000-000000000003',
   'HVAC servicing — Elysium Boutique Hotel',
   'AC complaints in 3 reviews and active complaint in Room 204 (guest with children). Book full HVAC service before summer peak. Check refrigerant levels and air filters across all rooms.',
   'critical', 'in_progress', 'complaint',
   current_date + 1, 'Maintenance'),

  ('a1000000-0000-0000-0000-000000000005',
   'Plumbing inspection — Ayia Napa Sands Hotel (pool-facing rooms)',
   'Hot water complaints in 3 reviews all reference rooms near the pool. Likely a boiler capacity or pipe insulation issue in that wing. Engineering to inspect and report.',
   'high', 'todo', 'review',
   current_date + 2, 'Engineering'),

  ('a1000000-0000-0000-0000-000000000002',
   'WiFi router upgrade — Bee Hostel Limassol dorm wing',
   '4 reviews mention slow WiFi specifically in dorm rooms. Lobby WiFi is fine. Add a second access point to cover the far dorm corridor. Budget: €80-150.',
   'high', 'todo', 'review',
   current_date + 5, null),

  (null,
   'Review OTA commission rates with Booking.com',
   'Booking.com commission at 15% across all properties. Request a review meeting — properties with high volume may qualify for reduced rates (12-13%). Potential saving: €15,000+/yr.',
   'medium', 'todo', 'manual',
   current_date + 14, 'Owner');
