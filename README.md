# SparkTest Cloud - SaaS Monorepo

A SaaS monorepo containing Next.js frontend and Rust Axum backend applications.

## Structure

```
apps/
  saas-frontend/     # Next.js frontend application
  saas-backend/      # Rust Axum backend application
packages/
  sparktest-core/    # Core functionality package (placeholder)
  sparktest-ui/      # UI components package (placeholder)
```

## Requirements

- Node.js 20+
- pnpm 10+
- Rust 1.70+
- Cargo

## Getting Started

### Install dependencies
```bash
pnpm install
```

### Development

Start the frontend:
```bash
pnpm run dev:frontend
# Frontend will be available at http://localhost:3000
```

Start the backend:
```bash
pnpm run dev:backend
# Backend will be available at http://localhost:3001
```

### Building

Build the frontend:
```bash
pnpm run build:frontend
```

Build the backend:
```bash
pnpm run build:backend
```

### Testing

Test the backend:
```bash
pnpm run test:backend
```

## Package Management

This monorepo uses:
- **pnpm workspaces** for JavaScript/TypeScript packages
- **Cargo workspaces** for Rust packages

The frontend imports placeholder packages `@sparktest/core` and `@sparktest/ui` from the local packages/ directory.
The backend can import `sparktest-core` from crates.io (commented out for now).
