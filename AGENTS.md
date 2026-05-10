# Repository Guidelines

## Project Structure & Module Organization

This is a pnpm and Cargo monorepo for SparkTest Cloud. The SaaS frontend lives in `apps/saas/frontend`, using Next.js, TypeScript, Tailwind CSS, and Jest tests under `src/**/__tests__`. The Rust backend is split into workspace crates under `apps/saas/backend`: `core` for domain/database types, `api` for Axum REST handlers, and `bin` for the executable. Shared TypeScript packages live in `packages/core` and `packages/ui`. Supabase migrations are in `supabase/migrations`, deployment helpers are in `scripts`, and Docker entry points are `Dockerfile`, `docker-compose.yml`, and `docker-compose.dev.yml`.

## Build, Test, and Development Commands

- `pnpm install`: install Node workspace dependencies.
- `pnpm dev`: run the Next.js frontend at `localhost:3000`.
- `pnpm dev:backend`: run the Rust API server.
- `pnpm dev:all`: run frontend and backend concurrently.
- `pnpm build`: build shared packages, then apps.
- `pnpm test`: build packages and run app tests.
- `pnpm lint:all`: run linting plus Prettier format checks.
- `pnpm type-check`: run TypeScript checks across packages and apps.
- `cargo build` / `cargo test`: build or test all Rust crates.
- `pnpm docker:dev`: start the Docker Compose development stack.

## Coding Style & Naming Conventions

Use TypeScript for frontend and shared package code, and Rust for backend services. Prettier is configured for 2-space indentation, semicolons, single quotes, trailing commas where valid, and 80-column wrapping. React components use PascalCase filenames or established local patterns, hooks use `use-*` names, and tests use `*.test.ts` or `*.test.tsx`. Keep package exports stable through each package’s `src/index.ts`. Run `cargo fmt` before submitting Rust changes.

## Testing Guidelines

Frontend tests use Jest with Testing Library and are colocated in `__tests__` directories, for example `apps/saas/frontend/src/hooks/__tests__/use-billing.test.ts`. Prefer focused unit tests for hooks, API clients, storage logic, and billing behavior. Run `pnpm test` for the TypeScript test path and `cargo test` for backend changes. Add regression tests with bug fixes when behavior is observable.

## Commit & Pull Request Guidelines

Recent history uses short imperative commit subjects such as `Fix duplicate workflow runs...` and `Add comprehensive unit tests...`. Keep commits focused and describe the user-visible or CI-visible change. Pull requests should include a concise summary, linked issue when applicable, test results (`pnpm test`, `cargo test`, or why not run), and screenshots for UI changes.

## Security & Configuration Tips

Start from `.env.example` for local configuration. Do not commit secrets, production database URLs, Stripe keys, or Supabase credentials. Keep schema changes in timestamped files under `supabase/migrations`.
