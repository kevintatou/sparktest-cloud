-- CI integrations, scheduled runs, and webhook delivery
-- Depends on: 20260429000100_initial_cloud_schema.sql

-- ============================================================
-- CI integrations (GitHub Actions, GitLab CI, Bitbucket Pipelines)
-- ============================================================
create table ci_integrations (
    id uuid primary key default gen_random_uuid(),
    project_id uuid not null references projects(id) on delete cascade,
    provider text not null check (provider in ('github', 'gitlab', 'bitbucket')),
    repo_owner text not null,
    repo_name text not null,
    installation_id text,
    access_token_enc text,
    config jsonb not null default '{}'::jsonb,
    status text not null default 'active' check (status in ('active', 'inactive', 'error')),
    last_sync_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (project_id, provider, repo_owner, repo_name)
);

-- ============================================================
-- Scheduled runs (cron-based recurring test execution)
-- ============================================================
create table schedules (
    id uuid primary key default gen_random_uuid(),
    project_id uuid not null references projects(id) on delete cascade,
    name text not null,
    definition_id uuid references test_definitions(id) on delete cascade,
    suite_id uuid references test_suites(id) on delete cascade,
    cron_expression text not null,
    timezone text not null default 'UTC',
    enabled boolean not null default true,
    last_run_at timestamptz,
    next_run_at timestamptz,
    run_count integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    check (definition_id is not null or suite_id is not null)
);

-- ============================================================
-- Webhooks (outgoing event notifications)
-- ============================================================
create table webhooks (
    id uuid primary key default gen_random_uuid(),
    project_id uuid not null references projects(id) on delete cascade,
    name text not null,
    url text not null,
    secret_hash text,
    events text[] not null default '{}'::text[],
    enabled boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table webhook_deliveries (
    id uuid primary key default gen_random_uuid(),
    webhook_id uuid not null references webhooks(id) on delete cascade,
    event text not null,
    payload jsonb not null,
    response_status integer,
    response_body text,
    duration_ms integer,
    success boolean not null default false,
    attempt integer not null default 1,
    delivered_at timestamptz not null default now()
);

-- ============================================================
-- Indexes
-- ============================================================
create index idx_ci_integrations_project on ci_integrations(project_id);
create index idx_schedules_project on schedules(project_id);
create index idx_schedules_next_run on schedules(next_run_at) where enabled = true;
create index idx_webhooks_project on webhooks(project_id);
create index idx_webhook_deliveries_webhook on webhook_deliveries(webhook_id, delivered_at desc);

-- ============================================================
-- RLS
-- ============================================================
alter table ci_integrations enable row level security;
alter table schedules enable row level security;
alter table webhooks enable row level security;
alter table webhook_deliveries enable row level security;
