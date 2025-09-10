# SparkTest SaaS Cloud

A Software-as-a-Service (SaaS) monorepo for SparkTest, built with modern technologies and following the OSS design principles from [sparktest](https://github.com/kevintatou/sparktest).

## Architecture

This is a monorepo containing:

```
apps/
  saas/
     backend/  (Rust Axum)
       core/   - Core types and database models
       api/    - Axum REST API server
       bin/    - Binary executable
     frontend/ (Next.js)
       src/    - Next.js application with TypeScript
packages/
  core/       - Shared TypeScript types (@sparktest/core)
  ui/         - Reusable UI components (@sparktest/ui)
```

## Features

- **Multi-Tenant SaaS Architecture**: Organization-based tenancy with user management
- **Comprehensive CRUD Operations**: Complete Create, Read, Update, Delete functionality for:
  - SaaS Test Definitions (with organizational context)
  - Test Runs (with tenant isolation)
  - Executors (with organizational ownership)
  - Test Suites (with organizational scope)
  - Organizations and Users
- **Dual Storage Modes**: Supports both local storage and API backend modes
- **Modern Tech Stack**:
  - Frontend: Next.js 14 with App Router, TypeScript, Tailwind CSS, Radix UI
  - Backend: Rust with Axum, multi-tenancy support, PostgreSQL-ready
  - Storage: In-memory (current), PostgreSQL migration planned
- **Monorepo Architecture**: pnpm workspaces with shared TypeScript types
- **End-to-End Type Safety**: Consistent entity definitions across TypeScript and Rust
- **Public Resource Sharing**: Test definitions can be shared across organizations

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm
- Rust 1.70+
- Cargo

### Installation

```bash
# Install dependencies
pnpm install

# Build packages
pnpm build:packages

# Build applications
pnpm build:apps
```

### Development

#### Frontend Development

```bash
# Start frontend development server
pnpm dev

# Or specifically:
pnpm dev:frontend
```

The frontend will be available at http://localhost:3000

#### Backend Development

```bash
# Start backend API server
pnpm dev:backend

# Or using cargo directly:
cargo run -p sparktest-saas-bin
```

The API will be available at http://localhost:3001

#### Full Stack Development

```bash
# Start both frontend and backend concurrently
pnpm dev:all
```

### Production

#### Frontend Build & Start

```bash
pnpm build:saas-frontend
cd apps/saas/frontend
pnpm start
```

#### Backend Build & Run

```bash
cargo build --release
cargo run --release -p sparktest-saas-bin
```

## API Endpoints

The backend provides a multi-tenant REST API with the following endpoints:

### Core Health Check
- `GET /api/health` - Health check endpoint

### SaaS Test Definitions (Multi-tenant)
- `GET /api/test-definitions` - List test definitions (filtered by organization)
- `POST /api/test-definitions` - Create new test definition (with organizational context)
- `GET /api/test-definitions/:id` - Get specific test definition (with tenant validation)
- `PUT /api/test-definitions/:id` - Update test definition (with ownership validation)
- `DELETE /api/test-definitions/:id` - Delete test definition (with ownership validation)

### SaaS Test Runs (Multi-tenant)
- `GET /api/test-runs` - List test runs (filtered by organization)
- `POST /api/test-runs` - Create new test run (with organizational context)
- `GET /api/test-runs/:id` - Get specific test run (with tenant validation)

### SaaS Executors (Multi-tenant)
- `GET /api/executors` - List executors (filtered by organization)
- `POST /api/executors` - Create new executor (with organizational context)
- `GET /api/executors/:id` - Get specific executor (with tenant validation)
- `PUT /api/executors/:id` - Update executor (with ownership validation)
- `DELETE /api/executors/:id` - Delete executor (with ownership validation)

### SaaS Test Suites (Multi-tenant)
- `GET /api/test-suites` - List test suites (filtered by organization)
- `POST /api/test-suites` - Create new test suite (with organizational context)
- `GET /api/test-suites/:id` - Get specific test suite (with tenant validation)
- `PUT /api/test-suites/:id` - Update test suite (with ownership validation)
- `DELETE /api/test-suites/:id` - Delete test suite (with ownership validation)

**Note**: All endpoints (except health check) include multi-tenant filtering and validation to ensure data isolation between organizations.

## Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```bash
PORT=3001
DATABASE_URL=postgresql://user:password@localhost/sparktest_saas
RUST_LOG=info
```

### Storage Modes

The system implements a flexible `StorageService` abstraction supporting two modes:

1. **API Mode** (default): Frontend communicates with Rust backend API
   - Multi-tenant data filtering at the backend level
   - Real-time data sharing between users in the same organization
   - Proper tenant isolation and security
   
2. **Local Mode**: Frontend uses browser localStorage for offline development
   - Tenant-aware local storage with organization-based keys
   - Useful for offline development and testing
   - Data persists locally per organization context

Configure in `packages/core/src/config.ts`:

```typescript
export const defaultConfig: AppConfig = {
  backend_url: 'http://localhost:3001',
  storage_mode: 'api', // or 'local'
  debug: false,
};
```

## Development Commands

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build:packages

# Build all applications
pnpm build:apps

# Development servers
pnpm dev              # Frontend only
pnpm dev:frontend     # Frontend only
pnpm dev:backend      # Backend only
pnpm dev:all          # Both concurrently

# Testing
pnpm test             # Run tests
pnpm type-check       # Type checking

# Linting & formatting
pnpm lint             # Lint code
pnpm format           # Format code
pnpm lint:all         # Lint and format check

# Rust commands
cargo build           # Build Rust backend
cargo test            # Run Rust tests
cargo check           # Check Rust code
```

## Technology Stack

### Frontend

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library

### Backend

- **Rust** - Systems programming language
- **Axum** - Web framework
- **Tokio** - Async runtime
- **Serde** - Serialization framework
- **UUID** - Unique identifiers
- **Chrono** - Date/time handling

### Shared

- **pnpm** - Package manager with workspace support
- **TypeScript** - Shared type definitions
- **Prettier** - Code formatting
- **ESLint** - Linting

## Project Structure

```
├── apps/
│   └── saas/
│       ├── backend/
│       │   ├── core/       # Rust core library
│       │   ├── api/        # Axum API server
│       │   └── bin/        # Binary executable
│       └── frontend/       # Next.js application
│           ├── src/app/    # App Router pages
│           ├── src/components/ # React components
│           └── src/lib/    # Utilities
├── packages/
│   ├── core/              # Shared TypeScript types
│   └── ui/                # Reusable UI components
├── Cargo.toml            # Rust workspace
├── pnpm-workspace.yaml   # pnpm workspace
└── package.json          # Root package.json
```

## Contributing

1. Follow the established patterns from the OSS sparktest repository
2. Maintain type safety across TypeScript and Rust
3. Write tests for new functionality
4. Use conventional commits
5. Ensure all builds pass before submitting PRs

## License

MIT License - see LICENSE file for details.

## AI Assistant Context

This project includes comprehensive context for AI assistants like GitHub Copilot:

- **MCP Configuration**: `.mcp/config.json` - Detailed project structure and patterns
- **Copilot Instructions**: `.github/copilot-instructions.md` - AI-specific development guidelines
- **Development Guidelines**: `DEVELOPMENT_GUIDELINES.md` - Comprehensive coding standards

These files help AI assistants understand:

- Project architecture and technology stack
- Coding conventions and best practices
- API design patterns and entity relationships
- Development workflow and common commands

For optimal AI assistance, refer to these context files when working on the project.

## Inspiration

Based on the design principles and architecture of the open-source [SparkTest](https://github.com/kevintatou/sparktest) project.

MVP inspiration: http://209.38.43.8/
