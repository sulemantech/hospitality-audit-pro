-- Action plans: one row per AI generation
create table if not exists action_plans (
  id               uuid primary key default gen_random_uuid(),
  property_id      uuid references properties(id) on delete cascade,
  summary          text not null,
  open_complaints  int  not null default 0,
  active_alerts    int  not null default 0,
  flagged_reviews  int  not null default 0,
  generated_at     timestamptz not null default now()
);

-- Individual tasks generated within a plan
create table if not exists action_tasks (
  id            uuid primary key default gen_random_uuid(),
  plan_id       uuid not null references action_plans(id) on delete cascade,
  priority      text not null check (priority in ('critical', 'high', 'medium', 'low')),
  title         text not null,
  description   text,
  category      text,
  property_name text,
  assigned_to   text,
  due_in_days   int,
  due_date      date,
  reasoning     text,
  status        text not null default 'open' check (status in ('open', 'in_progress', 'done')),
  completed_at  timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists idx_action_plans_property_date
  on action_plans(property_id, generated_at desc);

create index if not exists idx_action_tasks_plan
  on action_tasks(plan_id);
