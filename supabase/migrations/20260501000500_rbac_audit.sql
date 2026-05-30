-- RBAC, audit logs, API keys, and security controls
-- Depends on: 20260429000100_initial_cloud_schema.sql

-- ============================================================
-- Roles (project-level RBAC)
-- ============================================================
create table roles (
    id uuid primary key default gen_random_uuid(),
    project_id uuid not null references projects(id) on delete cascade,
    name text not null,
    description text,
    permissions jsonb not null default '[]'::jsonb,
    is_default boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (project_id, name)
);

-- ============================================================
-- Member ↔ role mapping (extends project_members)
-- ============================================================
alter table project_members add column if not exists role_id uuid references roles(id) on delete set null;
alter table project_members add column if not exists invited_by uuid references profiles(id) on delete set null;
alter table project_members add column if not exists invited_at timestamptz;

-- ============================================================
-- Audit log (immutable event stream)
-- ============================================================
create table audit_logs (
    id uuid primary key default gen_random_uuid(),
    project_id uuid not null references projects(id) on delete cascade,
    actor_id uuid references profiles(id) on delete set null,
    actor_email text,
    action text not null,
    resource_type text not null,
    resource_id text,
    metadata jsonb not null default '{}'::jsonb,
    ip_address inet,
    user_agent text,
    created_at timestamptz not null default now()
);

-- ============================================================
-- API keys (machine-to-machine auth)
-- ============================================================
create table api_keys (
    id uuid primary key default gen_random_uuid(),
    project_id uuid not null references projects(id) on delete cascade,
    name text not null,
    key_prefix text not null,
    key_hash text not null unique,
    permissions jsonb not null default '["read"]'::jsonb,
    last_used_at timestamptz,
    expires_at timestamptz,
    revoked_at timestamptz,
    created_by uuid references profiles(id) on delete set null,
    created_at timestamptz not null default now()
);

-- ============================================================
-- Indexes
-- ============================================================
create index idx_roles_project on roles(project_id);
create index idx_audit_logs_project on audit_logs(project_id, created_at desc);
create index idx_audit_logs_actor on audit_logs(actor_id);
create index idx_audit_logs_action on audit_logs(action);
create index idx_audit_logs_resource on audit_logs(resource_type, resource_id);
create index idx_api_keys_project on api_keys(project_id);
create index idx_api_keys_hash on api_keys(key_hash);
create index idx_api_keys_prefix on api_keys(key_prefix);

-- ============================================================
-- RLS
-- ============================================================
alter table roles enable row level security;
alter table audit_logs enable row level security;
alter table api_keys enable row level security;

-- ============================================================
-- Seed default roles
-- ============================================================
-- Roles are created per-project when needed; no global seeds.
-- Default roles: Owner (all), Admin (manage), Member (execute), Viewer (read)
