# GitHub Copilot Instructions for SparkTest SaaS Cloud

This document provides context and guidelines for GitHub Copilot and other AI assistants working on the SparkTest SaaS Cloud project.

## Project Overview

SparkTest SaaS Cloud is a multi-tenant SaaS monorepo containing a test execution platform built with:

- **Frontend**: Next.js 14 with TypeScript, App Router, Tailwind CSS, and Radix UI
- **Backend**: Rust with Axum web framework and multi-tenancy support
- **Database**: PostgreSQL (ready), in-memory storage (current)
- **Package Manager**: pnpm workspaces
- **Architecture**: Organization-based multi-tenancy with user management

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

- **SaasTestDefinition**: Test code with metadata and organizational context (supports JavaScript, Python, Rust)
- **SaasTestRun**: Execution instance with status tracking and tenant isolation
- **SaasExecutor**: Test execution environment with organizational ownership (local, kubernetes, docker)
- **SaasTestSuite**: Collection of test definitions within organization scope
- **Organization**: Multi-tenant root entity for SaaS model
- **User**: User entity with organizational membership

### Multi-Tenancy Model

- **Organization-based tenancy**: Each organization is a separate tenant
- **User membership**: Users belong to organizations and can only access their organization's resources
- **Resource isolation**: All SaaS entities include `user_id` and `organization_id` for proper data separation
- **Public sharing**: Test definitions can be marked as public for cross-organization sharing

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
- Include proper status codes and multi-tenant filtering
- Validate input data before processing
- Apply organization-based filtering for all tenant-scoped resources

### React Components

- Use functional components with hooks
- Prefer composition over inheritance
- Extract reusable logic into custom hooks
- Use TypeScript props interfaces with proper SaaS entity types
- Follow Radix UI patterns for accessibility
- Implement storage service abstraction for local/API modes

### Storage Architecture

- **StorageService interface**: Abstraction for local and API storage modes
- **API mode**: Frontend communicates with Rust backend via REST API
- **Local mode**: Frontend uses local storage for offline development
- **Type safety**: Consistent entity definitions between Rust and TypeScript

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

1. **Start with types**: Define interfaces/structs first in both Rust and TypeScript
2. **Consider multi-tenancy**: Add `user_id` and `organization_id` fields where appropriate
3. **Update shared packages**: Modify `@sparktest/core` for type definitions
4. **Backend first**: Implement Rust API endpoints with proper tenant filtering
5. **Frontend integration**: Consume API in Next.js components using StorageService
6. **Test thoroughly**: Verify type safety and multi-tenant isolation end-to-end

### Error Handling

- **Rust**: Use `anyhow::Error` with context and proper error propagation
- **TypeScript**: Use proper error boundaries and try-catch with typed errors
- **API**: Return consistent error format with helpful messages and proper HTTP status codes

### Multi-Tenant Development

- **Always filter by organization**: Ensure all queries include organization-based filtering
- **User context**: Maintain user and organization context throughout the application
- **Data isolation**: Never allow cross-tenant data access
- **Public resources**: Handle public test definitions that can be shared across organizations

### Performance

- **Frontend**: Use Next.js built-in optimizations
- **Backend**: Leverage Rust's performance, use async properly
- **Database**: Prepare for PostgreSQL migration from in-memory

### State Management

- **Frontend**: React state with StorageService abstraction, consider Zustand for complex state
- **Backend**: `Arc<Mutex<>>` for current in-memory storage, PostgreSQL for future persistence
- **Storage modes**: Support both local storage and API backend modes
- **Multi-tenant context**: Maintain organization and user context throughout the application

### Development Workflow

```bash
# Install dependencies
pnpm install

# Build packages first, then apps
pnpm build:packages
pnpm build:apps

# Development servers
pnpm dev              # Frontend only (Next.js on :3000)
pnpm dev:backend      # Rust API on :3001
pnpm dev:all          # Both concurrently

# Testing and quality
pnpm test
pnpm lint
pnpm format
pnpm type-check
```

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

- Verify type safety across language boundaries (TypeScript ↔ Rust)
- Check for proper error handling and multi-tenant data isolation
- Ensure consistent naming conventions across languages
- Validate API design follows REST principles with proper tenant filtering
- Review for security implications (especially tenant isolation in SaaS context)
- Confirm StorageService abstraction is properly implemented
- Test multi-tenant scenarios and public resource sharing

## SaaS-Specific Considerations

### Security
- **Tenant isolation**: Ensure no cross-tenant data leakage
- **Authentication**: Implement proper user authentication and session management
- **Authorization**: Role-based access control within organizations
- **Data validation**: Validate all inputs and sanitize user-generated content

### Performance
- **Database queries**: Optimize for multi-tenant filtering
- **Caching**: Consider tenant-aware caching strategies
- **Resource limits**: Implement proper resource quotas per organization

### Scalability
- **Database design**: Prepare for PostgreSQL migration with proper indexing
- **API design**: Design for horizontal scaling and load balancing
- **Multi-tenant optimization**: Efficient data partitioning strategies

---

This project is inspired by the open-source [SparkTest](https://github.com/kevintatou/sparktest) project and follows its design principles while adding SaaS-specific features like multi-tenancy and user management.
