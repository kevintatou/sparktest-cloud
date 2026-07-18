# SparkTest Cloud Roadmap

SparkTest Cloud should stay close to SparkTest OSS. The goal is not to build a bigger Testkube. The goal is a hosted control plane for the same simple loop: define tests, run them in a customer cluster, see status/logs/history.

## Current Decision

Continue with the existing `sparktest-cloud` repo and current stack for now:

- Next.js frontend
- Rust/Axum backend
- Rust cluster agent later
- Supabase Auth
- Supabase-hosted PostgreSQL persistence
- Stripe billing later

Do not pivot to Encore/Leap yet. Encore remains an option if the backend becomes a drag, but the immediate problem is product scope and data model alignment, not framework choice.

## Product Boundary

### OSS

SparkTest OSS should remain a tight self-hosted product:

- test definitions
- test suites
- executors
- runs
- run details/logs
- Kubernetes execution
- simple local/Docker/Kubernetes deployment

### Cloud

SparkTest Cloud adds only the managed layer:

- login/accounts
- projects
- hosted dashboard
- agent connection
- queued runs
- stored history/logs
- billing

Keep these out until the core loop works:

- analytics
- alerting
- audit logs
- GitHub app
- integrations
- workflow marketplace
- complex RBAC
- hosted test execution

## Auth Direction

Use two auth systems:

1. Human auth with Supabase Auth.
2. Agent auth with project-scoped agent tokens.

Humans log into the dashboard with Supabase Auth. The backend verifies Supabase JWTs and maps `auth.users.id` to local `profiles`, projects, and project memberships.

Agents do not use Supabase Auth. Agents run in customer clusters and authenticate using long-lived project-scoped tokens generated in SparkTest Cloud.

The frontend may use Supabase Auth for login/session state, but product data should still flow through the SparkTest Cloud API. The Rust API owns project authorization and talks to Postgres through `DATABASE_URL`.

## Data Model Alignment

Cloud models should mirror OSS first:

- `projects`
- `profiles`
- `project_members`
- `agent_tokens`
- `agents`
- `test_definitions`
- `test_suites`
- `executors`
- `test_runs`
- `run_logs`

`test_definitions` should use the OSS shape:

- `name`
- `description`
- `image`
- `commands[]`
- `executor_id`
- `labels[]`

Avoid the current SaaS-only `code`/`language` model unless there is a specific later feature for code-based tests.

## Agent Model

The agent is a private cluster-side runner.

Flow:

1. User creates project in Cloud.
2. User creates agent token.
3. User installs SparkTest agent in their Kubernetes cluster.
4. Agent polls Cloud for queued runs.
5. Agent creates Kubernetes Jobs in the customer cluster.
6. Agent streams logs/status/results back to Cloud.

Cloud never needs direct inbound access to the customer cluster.

## Implementation Order

1. Trim SaaS UI navigation to the core product.
2. Replace in-memory backend storage with Postgres migrations.
3. Align Cloud test definition/suite/run models with OSS.
4. Add Supabase Auth-backed human auth.
5. Add projects and project membership.
6. Add agent tokens and agent check-in endpoint.
7. Add queued run endpoint.
8. Build Rust agent MVP.
9. Connect agent run execution to existing SparkTest Kubernetes job logic.
10. Add billing gates after the agent loop works.

## First Paid MVP

Charge for hosted control plane, not test compute.

Initial value:

- hosted dashboard
- remote control of test runs
- run logs/history
- agent connectivity
- no need to self-host the SparkTest app

Initial plans (2026-07-09: focusing on Free + Pro only until there's real usage; Team/Business revisited later):

- Free: 1 project, 1 agent, limited runs/history
- Pro: $29/month — full control-plane loop, no compute cost to us
- Team/Business: deferred, not being built yet

Exact limits can wait until the run/agent loop works.
