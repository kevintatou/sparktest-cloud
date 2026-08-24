# Next Steps

This repo now has the first SparkTest Cloud control-plane loop: projects, OSS-shaped test definitions, queued runs, project-scoped agent tokens, agent check-in, a Rust agent MVP, Supabase/Postgres-backed storage, and cloud-agent-focused billing copy.

## Before Production

- Apply `supabase/migrations/20260429000100_initial_cloud_schema.sql` to the hosted Supabase project.
- Set production environment variables: `DATABASE_URL`, `SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, Stripe keys, and `NEXT_PUBLIC_API_URL`.
- Add billing persistence migrations for plans, subscriptions, project entitlements, and usage snapshots.
- Replace the current header/local fallback auth in the frontend with a Supabase login/session UI.
- Decide the first paid packaging: keep Pro as a low-cost cloud-agent starter, then add Team/Business for serious multi-agent use.

## Product Work Left

- Add GitHub Actions integration for API-triggered runs.
- Add scheduled runs and webhook triggers.
- Add execution history detail pages with logs, artifacts, and result metadata.
- Add multi-agent routing: target runs to a specific agent, cluster, label, or environment.
- Add RBAC for project owners and members.
- Add longer retention and storage controls by plan.
- Add audit log events for token creation, revocation, run creation, and project membership changes.

## Team / Business Roadmap

- Team: more cloud agent tokens, more seats, longer retention, webhooks, schedules, and CI integrations.
- Business: RBAC, audit logs, SSO/SAML, SCIM later, multi-cluster routing, flaky test insights, and priority support.
- Enterprise later: self-managed control plane, dedicated onboarding, compliance support, and custom retention.

## Deployment Model

SparkTest Cloud should sell the hosted control plane, not hosted compute. Customers run agents in their own infrastructure. The cloud service stores definitions, queues runs, tracks logs/results, manages auth/billing, and coordinates agents. Agents execute work in the customer cluster and report results back.
