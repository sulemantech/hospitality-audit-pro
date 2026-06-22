-- ============================================================
-- Migration 006: AI Review Analysis columns
-- ============================================================
-- Adds Gemini-populated columns to the reviews table.
-- Existing keyword-based columns stay untouched.
-- Run in Supabase SQL Editor after 005.

alter table reviews
  add column if not exists ai_summary       text,
  add column if not exists ai_severity      text
    check (ai_severity in ('critical', 'high', 'medium', 'low', 'positive')),
  add column if not exists ai_emotion       text,
  add column if not exists ai_topics        text[],
  add column if not exists ai_action        text,
  add column if not exists ai_systemic_risk boolean default false,
  add column if not exists ai_analyzed_at   timestamptz;

-- Index so the nightly job can quickly find unanalyzed reviews
create index if not exists idx_reviews_ai_analyzed_at
  on reviews (ai_analyzed_at)
  where ai_analyzed_at is null;

comment on column reviews.ai_summary       is 'One-line GM-readable summary of what the guest really said';
comment on column reviews.ai_severity      is 'AI-assessed severity, may differ from keyword-based sentiment';
comment on column reviews.ai_emotion       is 'Dominant emotion: angry | frustrated | disappointed | neutral | satisfied | delighted';
comment on column reviews.ai_topics        is 'Specific topics mentioned: staff, checkout, cleanliness, etc.';
comment on column reviews.ai_action        is 'Concrete suggested action for staff within 24h';
comment on column reviews.ai_systemic_risk is 'True if this likely reflects a recurring systemic issue';
comment on column reviews.ai_analyzed_at   is 'Timestamp of last Gemini analysis — null means not yet analyzed';
