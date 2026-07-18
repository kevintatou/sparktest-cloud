-- Multi-agent routing: environments, agent labels, routing rules
-- Depends on: 20260429000100_initial_cloud_schema.sql

-- ============================================================
-- Environments (logical deployment targets)
-- ============================================================
create table environments (
    id uuid primary key default gen_random_uuid(),
    project_id uuid not null references projects(id) on delete cascade,
    name text not null,
    slug text not null,
    description text,
    color text not null default '#6366f1',
    is_default boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (project_id, slug)
);

-- ============================================================
-- Agent labels (key-value metadata for routing)
-- ============================================================
create table agent_labels (
    id uuid primary key default gen_random_uuid(),
    agent_id uuid not null references agents(id) on delete cascade,
    key text not null,
    value text not null,
    created_at timestamptz not null default now(),
    unique (agent_id, key)
);

-- ============================================================
-- Routing rules (match labels → target environment/agent)
-- ============================================================
create table routing_rules (
    id uuid primary key default gen_random_uuid(),
    project_id uuid not null references projects(id) on delete cascade,
    name text not null,
    description text,
    match_labels jsonb not null default '{}'::jsonb,
    target_environment_id uuid references environments(id) on delete set null,
    target_agent_id uuid references agents(id) on delete set null,
    priority integer not null default 0,
    enabled boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- ============================================================
-- Extend test_runs with routing columns
-- ============================================================
alter table test_runs add column if not exists target_environment_id uuid references environments(id) on delete set null;
alter table test_runs add column if not exists routing_labels jsonb not null default '{}'::jsonb;
alter table test_runs add column if not exists routed_at timestamptz;

-- ============================================================
-- Extend agents with environment association
-- ============================================================
alter table agents add column if not exists environment_id uuid references environments(id) on delete set null;
alter table agents add column if not exists metadata jsonb not null default '{}'::jsonb;

-- ============================================================
-- Indexes
-- ============================================================
create index idx_environments_project on environments(project_id);
create index idx_agent_labels_agent on agent_labels(agent_id);
create index idx_agent_labels_key_value on agent_labels(key, value);
create index idx_routing_rules_project on routing_rules(project_id);
create index idx_routing_rules_priority on routing_rules(project_id, priority desc);
create index idx_test_runs_environment on test_runs(target_environment_id);
create index idx_agents_environment on agents(environment_id);

-- ============================================================
-- RLS
-- ============================================================
alter table environments enable row level security;
alter table agent_labels enable row level security;
alter table routing_rules enable row level security;

-- ============================================================
-- Seed default environments
-- ============================================================
-- Projects should create their own environments; no global seeds needed.
