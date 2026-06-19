-- ============================================================
-- Migration 003: Keyword Flagging Engine + Alert Thresholds
-- ============================================================
-- Run AFTER 001 and 002.
-- Adds two triggers on the reviews table:
--   1. BEFORE INSERT/UPDATE → flag keywords, derive sentiment
--   2. AFTER  INSERT        → fire alerts when threshold crossed

-- ─── 1. KEYWORD FLAGGING TRIGGER ────────────────────────────

create or replace function flag_review_keywords()
returns trigger language plpgsql as $$
declare
  kw_row    record;
  matched   text[]  := '{}';
  neg_hits  int     := 0;
  pos_hits  int     := 0;
begin
  for kw_row in
    select keyword, category, severity
    from   review_keywords
    where  is_active = true
  loop
    if new.review_text ilike '%' || kw_row.keyword || '%' then
      matched  := array_append(matched, kw_row.keyword);
      if kw_row.severity in ('critical', 'warning') then
        neg_hits := neg_hits + 1;
      elsif kw_row.severity = 'positive' then
        pos_hits := pos_hits + 1;
      end if;
    end if;
  end loop;

  new.flagged_keywords := matched;
  new.flag_count       := coalesce(array_length(matched, 1), 0);

  -- Derive sentiment from keywords, fall back to rating
  if neg_hits > 0 then
    new.sentiment       := 'negative';
    new.sentiment_score := greatest(-1.0, -0.5 - (neg_hits * 0.15));
  elsif pos_hits > 0 then
    new.sentiment       := 'positive';
    new.sentiment_score := least(1.0, 0.5 + (pos_hits * 0.1));
  else
    new.sentiment := case
      when new.rating >= 7 then 'positive'
      when new.rating >= 5 then 'neutral'
      else 'negative'
    end;
    new.sentiment_score := round(((new.rating / 10.0) - 0.5) * 2, 3);
  end if;

  return new;
end;
$$;

create trigger trg_reviews_flag_keywords
  before insert or update of review_text on reviews
  for each row execute function flag_review_keywords();

-- ─── 2. ALERT THRESHOLD TRIGGER ─────────────────────────────

create or replace function check_keyword_alert_thresholds()
returns trigger language plpgsql as $$
declare
  kw          text;
  kw_row      record;
  hit_count   int;
  existing_id uuid;
begin
  foreach kw in array coalesce(new.flagged_keywords, '{}')
  loop
    select * into kw_row
    from   review_keywords
    where  keyword = kw and is_active = true;

    if not found then continue; end if;

    -- Count mentions in the last 30 days for this property
    select count(*) into hit_count
    from   reviews
    where  property_id = new.property_id
      and  review_date >= current_date - interval '30 days'
      and  review_text ilike '%' || kw || '%';

    if hit_count >= kw_row.threshold then
      -- Check for existing active/acknowledged alert
      select id into existing_id
      from   alerts
      where  property_id   = new.property_id
        and  source_keyword = kw
        and  status in ('active', 'acknowledged')
      limit 1;

      if existing_id is not null then
        update alerts
        set    mention_count = hit_count,
               updated_at    = now()
        where  id = existing_id;
      else
        insert into alerts (
          property_id, type, severity, title, message,
          source_keyword, source_ref_id, mention_count, status
        ) values (
          new.property_id,
          'keyword_threshold',
          case kw_row.severity
            when 'critical' then 'critical'::alert_severity
            when 'warning'  then 'high'::alert_severity
            else                 'medium'::alert_severity
          end,
          'Keyword spike: "' || kw || '"',
          '"' || kw || '" mentioned ' || hit_count
            || ' times in the last 30 days at this property.',
          kw,
          new.id,
          hit_count,
          'active'
        );
      end if;
    end if;
  end loop;

  return new;
end;
$$;

create trigger trg_reviews_check_alert_thresholds
  after insert on reviews
  for each row execute function check_keyword_alert_thresholds();
