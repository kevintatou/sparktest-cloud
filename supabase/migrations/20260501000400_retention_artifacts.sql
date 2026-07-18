-- Retention policies, run artifacts, and flaky test detection
-- Depends on: 20260429000100_initial_cloud_schema.sql

-- ============================================================
-- Retention policies (per-project, per-resource)
-- ============================================================
create table retention_policies (
    id uuid primary key default gen_random_uuid(),
    project_id uuid not null references projects(id) on delete cascade,
    resource_type text not null check (resource_type in ('runs', 'logs', 'artifacts')),
    retention_days integer not null default 30,
    max_storage_bytes bigint,
    auto_delete boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (project_id, resource_type)
);

-- ============================================================
-- Run artifacts (files attached to test runs)
-- ============================================================
create table artifacts (
    id uuid primary key default gen_random_uuid(),
    run_id uuid not null references test_runs(id) on delete cascade,
    project_id uuid not null references projects(id) on delete cascade,
    name text not null,
    path text not null,
    size_bytes bigint not null default 0,
    content_type text not null default 'application/octet-stream',
    storage_key text not null,
    checksum text,
    uploaded_at timestamptz not null default now(),
    expires_at timestamptz
);

-- ============================================================
-- Flaky test tracking
-- ============================================================
create table flaky_tests (
    id uuid primary key default gen_random_uuid(),
    project_id uuid not null references projects(id) on delete cascade,
    definition_id uuid not null references test_definitions(id) on delete cascade,
    flake_rate numeric(5, 2) not null default 0,
    total_runs integer not null default 0,
    flaky_runs integer not null default 0,
    consecutive_passes integer not null default 0,
    first_flake_at timestamptz,
    last_flake_at timestamptz,
    status text not null default 'active' check (status in ('active', 'resolved', 'muted')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (project_id, definition_id)
);

create table flaky_test_runs (
    id uuid primary key default gen_random_uuid(),
    flaky_test_id uuid not null references flaky_tests(id) on delete cascade,
    run_id uuid not null references test_runs(id) on delete cascade,
    was_flaky boolean not null default false,
    previous_status text,
    current_status text,
    detected_at timestamptz not null default now()
);

-- ============================================================
-- Indexes
-- ============================================================
create index idx_retention_policies_project on retention_policies(project_id);
create index idx_artifacts_run on artifacts(run_id);
create index idx_artifacts_project on artifacts(project_id);
create index idx_artifacts_expires on artifacts(expires_at) where expires_at is not null;
create index idx_flaky_tests_project on flaky_tests(project_id);
create index idx_flaky_tests_rate on flaky_tests(project_id, flake_rate desc);
create index idx_flaky_test_runs_flaky on flaky_test_runs(flaky_test_id, detected_at desc);

-- ============================================================
-- RLS
-- ============================================================
alter table retention_policies enable row level security;
alter table artifacts enable row level security;
alter table flaky_tests enable row level security;
alter table flaky_test_runs enable row level security;
