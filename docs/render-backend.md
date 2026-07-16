# Render Backend

SparkTest Cloud's SaaS API is a Rust Axum service. Render should deploy it as a
Rust web service from the repository root.

## Service

The checked-in `render.yaml` defines:

- Service name: `sparktest-cloud-api`
- Runtime: Rust
- Build command: `cargo build --release -p sparktest-saas-bin`
- Start command: `./target/release/sparktest-saas-server`
- Health check: `/api/health`

The server reads `PORT` from the environment, which Render provides for web
services.

## Required Environment Variables

Set these in Render before the first useful deploy:

- `DATABASE_URL`: Supabase Postgres connection string.
- `SUPABASE_JWT_SECRET`: Supabase Auth JWT secret.
- `RUST_LOG`: `info`

Billing is optional until Stripe checkout is ready:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRO_PRICE_ID`
- `STRIPE_FREE_PRICE_ID`

Without `DATABASE_URL`, the backend falls back to `memory://local`, which loses
state on restart.

## Connect Vercel Preview Frontends

After Render deploys, copy the Render service URL, for example:

```text
https://sparktest-cloud-api.onrender.com
```

Set this Vercel environment variable for Preview deployments:

```text
NEXT_PUBLIC_API_URL=https://sparktest-cloud-api.onrender.com
```

Then redeploy the Vercel preview. The browser frontend will call the Render Rust
API instead of `localhost:3001`.
