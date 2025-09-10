# GitHub Copilot Instructions for SparkTest SaaS Cloud

This document provides context and guidelines for GitHub Copilot and other AI assistants working on the SparkTest SaaS Cloud project.

## Project Overview

SparkTest SaaS Cloud is a monorepo containing a test execution platform built with:

- **Frontend**: Next.js 14 with TypeScript, Tailwind CSS, and Radix UI
- **Backend**: Rust with Axum web framework
- **Database**: PostgreSQL (ready), in-memory storage (current)
- **Package Manager**: pnpm workspaces

## Architecture Patterns

### Directory Structure

```
apps/saas/
├── backend/          # Rust backend
│   ├── core/        # Database models and core types
│   ├── api/         # Axum REST API server
│   └── bin/         # Binary executable
└── frontend/        # Next.js TypeScript app
packages/
├── core/            # Shared TypeScript types (@sparktest/core)
└── ui/              # Reusable UI components (@sparktest/ui)
```

### Key Entities

- **TestDefinition**: Test code with metadata (supports JavaScript, Python, Rust)
- **TestRun**: Execution instance with status tracking
- **Executor**: Test execution environment (local, kubernetes, docker)
- **TestSuite**: Collection of test definitions

## Coding Guidelines

### TypeScript (Frontend & Packages)

- Use **camelCase** for variables and functions
- Use **PascalCase** for types, interfaces, and React components
- Use **kebab-case** for file names (except React components)
- Prefer `interface` over `type` for object shapes
- Use `const` assertions for immutable data
- Always define return types for exported functions

### Rust (Backend)

- Use **snake_case** for functions and variables
- Use **PascalCase** for types and structs
- Use `Result<T, anyhow::Error>` for fallible operations
- Prefer `async`/`await` over manual futures
- Use `serde` for serialization with proper derives
- Include comprehensive error handling

### API Design

- Follow REST conventions: `/api/{resource}`
- Use standard HTTP methods (GET, POST, PUT, DELETE)
- Return JSON responses with consistent error format
- Include proper status codes
- Validate input data before processing

### React Components

- Use functional components with hooks
- Prefer composition over inheritance
- Extract reusable logic into custom hooks
- Use TypeScript props interfaces
- Follow Radix UI patterns for accessibility

## Development Workflow

### Common Commands

```bash
# Install dependencies
pnpm install

# Build packages first, then apps
pnpm build:packages
pnpm build:apps

# Development servers
pnpm dev:frontend    # Next.js on :3000
pnpm dev:backend     # Rust API on :3001
pnpm dev:all         # Both concurrently

# Testing and quality
pnpm test
pnpm lint
pnpm format
```

### Type Safety

- Maintain consistency between Rust and TypeScript types
- Use shared types from `@sparktest/core` package
- Validate API responses match expected types
- Use proper error types throughout the stack

## Best Practices

### When Adding Features

1. **Start with types**: Define interfaces/structs first
2. **Update shared packages**: Modify `@sparktest/core` if needed
3. **Backend first**: Implement Rust API endpoints
4. **Frontend integration**: Consume API in Next.js components
5. **Test thoroughly**: Verify type safety end-to-end

### Error Handling

- **Rust**: Use `anyhow::Error` with context
- **TypeScript**: Use proper error boundaries and try-catch
- **API**: Return consistent error format with helpful messages

### Performance

- **Frontend**: Use Next.js built-in optimizations
- **Backend**: Leverage Rust's performance, use async properly
- **Database**: Prepare for PostgreSQL migration from in-memory

### State Management

- **Frontend**: React state, consider Zustand for complex state
- **Backend**: `Arc<Mutex<>>` for current in-memory storage
- **Future**: Replace with proper PostgreSQL operations

## File Naming Conventions

- **React Components**: `PascalCase.tsx` (e.g., `TestDefinition.tsx`)
- **Utilities**: `kebab-case.ts` (e.g., `api-client.ts`)
- **Rust files**: `snake_case.rs` (e.g., `test_definition.rs`)
- **Types**: Match the primary export (e.g., `types.ts`)

## Testing Strategy

- **Unit tests**: Focus on business logic
- **Integration tests**: Test API endpoints
- **E2E tests**: Critical user workflows
- **Type tests**: Ensure TypeScript/Rust compatibility

## Code Review Guidelines

- Verify type safety across language boundaries
- Check for proper error handling
- Ensure consistent naming conventions
- Validate API design follows REST principles
- Review for security implications (especially in SaaS context)

---

This project is inspired by the open-source [SparkTest](https://github.com/kevintatou/sparktest) project and follows its design principles while adding SaaS-specific features like multi-tenancy and user management.
