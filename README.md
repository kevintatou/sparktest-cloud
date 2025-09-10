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

- **Full CRUD Operations**: Complete Create, Read, Update, Delete functionality for:
  - Test Definitions
  - Test Runs
  - Executors
  - Test Suites
- **Storage Service**: Supports both local storage and API modes
- **Modern Stack**:
  - Frontend: Next.js 14, TypeScript, Tailwind CSS, Radix UI
  - Backend: Rust, Axum, PostgreSQL (ready), In-memory storage (current)
- **Monorepo**: pnpm workspaces with shared packages
- **Type Safety**: End-to-end TypeScript/Rust type safety

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

The backend provides a REST API with the following endpoints:

- `GET /api/health` - Health check
- `GET|POST /api/test-definitions` - List/create test definitions
- `GET|PUT|DELETE /api/test-definitions/:id` - Get/update/delete test definition
- `GET|POST /api/test-runs` - List/create test runs
- `GET /api/test-runs/:id` - Get test run
- `GET|POST /api/executors` - List/create executors (placeholder)
- `GET|PUT|DELETE /api/executors/:id` - Manage executors (placeholder)
- `GET|POST /api/test-suites` - List/create test suites (placeholder)
- `GET|PUT|DELETE /api/test-suites/:id` - Manage test suites (placeholder)

## Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```bash
PORT=3001
DATABASE_URL=postgresql://user:password@localhost/sparktest_saas
RUST_LOG=info
```

### Storage Modes

The system supports two storage modes:

1. **API Mode** (default): Frontend communicates with backend API
2. **Local Mode**: Frontend uses local storage (for offline usage)

Configure in `packages/core/src/config.ts`.

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
