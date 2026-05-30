-- Billing persistence: plans, subscriptions, entitlements, and usage tracking
-- This migration depends on: 20260429000100_initial_cloud_schema.sql

-- ============================================================
-- Plans
-- ============================================================
create table plans (
    id uuid primary key default gen_random_uuid(),
    slug text not null unique,
    name text not null,
    price_cents integer not null default 0,
    billing_interval text not null default 'month' check (billing_interval in ('month', 'year')),
    stripe_price_id text unique,
    features jsonb not null default '{}'::jsonb,
    is_active boolean not null default true,
    sort_order integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- ============================================================
-- Subscriptions
-- ============================================================
create table subscriptions (
    id uuid primary key default gen_random_uuid(),
    project_id uuid not null references projects(id) on delete cascade,
    plan_id uuid not null references plans(id) on delete restrict,
    stripe_subscription_id text unique,
    stripe_customer_id text,
    status text not null default 'active'
        check (status in ('active', 'past_due', 'canceled', 'trialing', 'incomplete', 'paused')),
    current_period_start timestamptz,
    current_period_end timestamptz,
    cancel_at_period_end boolean not null default false,
    canceled_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- ============================================================
-- Project entitlements (derived from plan, may be overridden)
-- ============================================================
create table project_entitlements (
    id uuid primary key default gen_random_uuid(),
    project_id uuid not null references projects(id) on delete cascade unique,
    max_projects integer not null default 1,
    max_agents integer not null default 1,
    max_tokens integer not null default 1,
    max_seats integer not null default 1,
    max_runs_per_day integer not null default 50,
    retention_days integer not null default 7,
    storage_bytes bigint not null default 1073741824, -- 1 GB
    webhooks_enabled boolean not null default false,
    schedules_enabled boolean not null default false,
    audit_log_enabled boolean not null default false,
    priority_support boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- ============================================================
-- Usage snapshots (daily roll-ups for billing & dashboard)
-- ============================================================
create table usage_snapshots (
    id uuid primary key default gen_random_uuid(),
    project_id uuid not null references projects(id) on delete cascade,
    snapshot_date date not null default current_date,
    run_count integer not null default 0,
    passed_count integer not null default 0,
    failed_count integer not null default 0,
    storage_bytes bigint not null default 0,
    agent_count integer not null default 0,
    seat_count integer not null default 0,
    created_at timestamptz not null default now(),
    unique (project_id, snapshot_date)
);

-- ============================================================
-- Indexes
-- ============================================================
create index idx_subscriptions_project_id on subscriptions(project_id);
create index idx_subscriptions_stripe_customer on subscriptions(stripe_customer_id);
create index idx_subscriptions_status on subscriptions(status);
create index idx_usage_snapshots_project_date on usage_snapshots(project_id, snapshot_date desc);

-- ============================================================
-- RLS
-- ============================================================
alter table plans enable row level security;
alter table subscriptions enable row level security;
alter table project_entitlements enable row level security;
alter table usage_snapshots enable row level security;

-- ============================================================
-- Seed default plans
-- ============================================================
insert into plans (slug, name, price_cents, billing_interval, features, sort_order) values
(
    'free', 'Free', 0, 'month',
    '{"max_projects": 1, "max_agents": 1, "max_tokens": 1, "seats": 1, "log_retention_days": 7, "result_storage_gb": 1, "runs_per_day": 50, "support": "community"}'::jsonb,
    0
),
(
    'pro', 'Pro', 1900, 'month',
    '{"max_projects": 5, "max_agents": 3, "max_tokens": 5, "seats": 3, "log_retention_days": 30, "result_storage_gb": 10, "runs_per_day": 500, "support": "email", "webhooks": true, "schedules": true}'::jsonb,
    1
),
(
    'team', 'Team', 4900, 'month',
    '{"max_projects": 20, "max_agents": 10, "max_tokens": 20, "seats": 10, "log_retention_days": 90, "result_storage_gb": 50, "runs_per_day": 2000, "support": "priority", "webhooks": true, "schedules": true, "audit_log": true}'::jsonb,
    2
),
(
    'business', 'Business', 14900, 'month',
    '{"max_projects": -1, "max_agents": -1, "max_tokens": -1, "seats": 25, "log_retention_days": 365, "result_storage_gb": 200, "runs_per_day": -1, "support": "priority", "webhooks": true, "schedules": true, "audit_log": true, "sso": true, "rbac": true}'::jsonb,
    3
);
