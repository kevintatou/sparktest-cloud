# SparkTest Cloud Auth Plan

SparkTest Cloud has two different callers:

- humans using the web dashboard
- agents running in customer Kubernetes clusters

They should not use the same auth mechanism.

## Human Auth

Use Supabase Auth for users.

Why:

- fastest path to login/signup
- avoids custom password/session security
- supports OAuth and email flows
- keeps auth and Postgres in one provider
- reuses the existing SparkTest Supabase account/projects

Backend responsibilities:

- verify Supabase JWTs on API requests
- map `auth.users.id` to local `profiles.id`
- enforce project membership in our database

Local database should still own product authorization. Supabase proves identity; SparkTest decides which projects the user can access.

Minimal tables:

- `profiles`
  - `id`
  - `email`
  - `name`
  - `created_at`
  - `updated_at`
- `projects`
  - `id`
  - `name`
  - `created_at`
  - `updated_at`
- `project_members`
  - `project_id`
  - `user_id`
  - `role`
  - `created_at`

Roles for MVP:

- `owner`
- `member`

Do not build complex RBAC yet.

## Agent Auth

Use project-scoped agent tokens.

Agents are non-human callers. They run in customer clusters and need stable credentials that can be rotated/revoked independently from user accounts.

Minimal tables:

- `agent_tokens`
  - `id`
  - `project_id`
  - `name`
  - `token_hash`
  - `last_used_at`
  - `revoked_at`
  - `created_at`
- `agents`
  - `id`
  - `project_id`
  - `token_id`
  - `name`
  - `version`
  - `last_seen_at`
  - `status`
  - `created_at`
  - `updated_at`

Token rules:

- generate a random token once
- show it once in the UI
- store only a hash
- allow revoke/regenerate
- token grants access to exactly one project

Agent endpoints:

- `POST /api/agent/check-in`
- `GET /api/agent/jobs/next`
- `POST /api/agent/runs/:id/status`
- `POST /api/agent/runs/:id/logs`

Agent request header:

```text
Authorization: Bearer st_agent_...
```

## Security Boundary

Humans:

- can manage projects and definitions through Supabase-authenticated API requests

Agents:

- can only read queued work for their project
- can only update runs assigned to their project
- cannot create users, projects, billing, or definitions

## Implementation Notes

Start with backend middleware/helper functions:

- `require_user(request) -> UserContext`
- `require_agent(request) -> AgentContext`
- `require_project_member(user, project_id)`

Keep authorization checks explicit in handlers until patterns settle.
