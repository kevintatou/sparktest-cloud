create extension if not exists pgcrypto;

create table profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    email text not null,
    name text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table projects (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    slug text not null unique,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table project_members (
    project_id uuid not null references projects(id) on delete cascade,
    profile_id uuid not null references profiles(id) on delete cascade,
    role text not null check (role in ('owner', 'member')),
    created_at timestamptz not null default now(),
    primary key (project_id, profile_id)
);

create table agent_tokens (
    id uuid primary key default gen_random_uuid(),
    project_id uuid not null references projects(id) on delete cascade,
    name text not null,
    token_hash text not null unique,
    last_used_at timestamptz,
    revoked_at timestamptz,
    created_at timestamptz not null default now()
);

create table agents (
    id uuid primary key default gen_random_uuid(),
    project_id uuid not null references projects(id) on delete cascade,
    token_id uuid references agent_tokens(id) on delete set null,
    name text not null,
    version text,
    status text not null default 'offline' check (status in ('online', 'offline', 'error')),
    last_seen_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table executors (
    id uuid primary key default gen_random_uuid(),
    project_id uuid not null references projects(id) on delete cascade,
    name text not null,
    executor_type text not null,
    image text,
    config jsonb not null default '{}'::jsonb,
    status text not null default 'active',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table test_definitions (
    id uuid primary key default gen_random_uuid(),
    project_id uuid not null references projects(id) on delete cascade,
    name text not null,
    description text,
    image text not null,
    commands jsonb not null default '[]'::jsonb,
    executor_id uuid references executors(id) on delete set null,
    labels jsonb not null default '[]'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table test_suites (
    id uuid primary key default gen_random_uuid(),
    project_id uuid not null references projects(id) on delete cascade,
    name text not null,
    description text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table test_suite_definitions (
    suite_id uuid not null references test_suites(id) on delete cascade,
    definition_id uuid not null references test_definitions(id) on delete cascade,
    position integer not null default 0,
    primary key (suite_id, definition_id)
);

create table test_runs (
    id uuid primary key default gen_random_uuid(),
    project_id uuid not null references projects(id) on delete cascade,
    definition_id uuid references test_definitions(id) on delete set null,
    suite_id uuid references test_suites(id) on delete set null,
    executor_id uuid references executors(id) on delete set null,
    agent_id uuid references agents(id) on delete set null,
    status text not null default 'queued' check (status in ('queued', 'running', 'passed', 'failed', 'cancelled', 'error')),
    result jsonb,
    error text,
    queued_at timestamptz not null default now(),
    started_at timestamptz,
    finished_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table run_logs (
    id uuid primary key default gen_random_uuid(),
    run_id uuid not null references test_runs(id) on delete cascade,
    stream text not null default 'stdout' check (stream in ('stdout', 'stderr', 'system')),
    line text not null,
    sequence bigint not null,
    created_at timestamptz not null default now(),
    unique (run_id, sequence)
);

alter table profiles enable row level security;
alter table projects enable row level security;
alter table project_members enable row level security;
alter table agent_tokens enable row level security;
alter table agents enable row level security;
alter table executors enable row level security;
alter table test_definitions enable row level security;
alter table test_suites enable row level security;
alter table test_suite_definitions enable row level security;
alter table test_runs enable row level security;
alter table run_logs enable row level security;

create index idx_project_members_profile_id on project_members(profile_id);
create index idx_agent_tokens_project_id on agent_tokens(project_id);
create index idx_agents_project_id on agents(project_id);
create index idx_executors_project_id on executors(project_id);
create index idx_test_definitions_project_id on test_definitions(project_id);
create index idx_test_suites_project_id on test_suites(project_id);
create index idx_test_runs_project_status on test_runs(project_id, status);
create index idx_run_logs_run_id_sequence on run_logs(run_id, sequence);
