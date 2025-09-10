# SparkTest SaaS Cloud - Development Guidelines

This document provides comprehensive guidelines for developing the SparkTest SaaS Cloud application, ensuring consistency and quality across the monorepo.

## Table of Contents

- [Project Architecture](#project-architecture)
- [Coding Standards](#coding-standards)
- [API Design](#api-design)
- [Testing Guidelines](#testing-guidelines)
- [Performance Guidelines](#performance-guidelines)
- [Security Guidelines](#security-guidelines)

## Project Architecture

### Monorepo Structure

Our project follows a monorepo pattern using pnpm workspaces:

```
sparktest-cloud/
├── apps/saas/
│   ├── backend/          # Rust backend services
│   │   ├── core/        # Database models and business logic
│   │   ├── api/         # REST API server (Axum)
│   │   └── bin/         # Application binary
│   └── frontend/        # Next.js application
│       ├── src/app/     # App Router pages
│       ├── src/components/ # React components
│       └── src/lib/     # Utility functions
├── packages/
│   ├── core/           # Shared TypeScript types
│   └── ui/             # Reusable UI components
└── .mcp/               # Model Context Protocol configuration
```

### Technology Stack

#### Frontend

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript 5+
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI primitives
- **Icons**: Lucide React
- **State Management**: React state (future: Zustand for complex state)

#### Backend

- **Language**: Rust 1.70+
- **Framework**: Axum for HTTP server
- **Async Runtime**: Tokio
- **Serialization**: Serde with JSON
- **Database**: PostgreSQL (planned), in-memory (current)
- **ORM**: SQLx (planned)
- **Error Handling**: anyhow

#### Shared

- **Package Manager**: pnpm with workspaces
- **Formatting**: Prettier (TS), rustfmt (Rust)
- **Linting**: ESLint (TS), Clippy (Rust)

## Coding Standards

### TypeScript Guidelines

#### Naming Conventions

- **Variables & Functions**: `camelCase`
- **Types & Interfaces**: `PascalCase`
- **Constants**: `SCREAMING_SNAKE_CASE`
- **Files**: `kebab-case.ts` (except React components: `PascalCase.tsx`)

#### Code Style

```typescript
// ✅ Good
interface TestDefinition {
  id: string;
  name: string;
  description?: string;
  code: string;
  language: 'javascript' | 'python' | 'rust';
  createdAt: string;
  updatedAt: string;
}

const createTestDefinition = async (
  data: Partial<TestDefinition>
): Promise<TestDefinition> => {
  // Implementation
};

// ❌ Bad
interface testDefinition {
  id: string;
  name: string;
  Description?: string;
  Code: string;
}

function CreateTestDefinition(data) {
  // Implementation
}
```

#### Best Practices

- Always define return types for exported functions
- Use `const` assertions for immutable data
- Prefer `interface` over `type` for object shapes
- Use utility types (`Partial`, `Pick`, `Omit`) appropriately
- Implement proper error boundaries in React components

### Rust Guidelines

#### Naming Conventions

- **Functions & Variables**: `snake_case`
- **Types & Structs**: `PascalCase`
- **Constants**: `SCREAMING_SNAKE_CASE`
- **Files**: `snake_case.rs`

#### Code Style

```rust
// ✅ Good
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SaasTestDefinition {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub code: String,
    pub language: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl Database {
    pub async fn create_test_definition(
        &self,
        definition: &SaasTestDefinition
    ) -> Result<(), anyhow::Error> {
        // Implementation
    }
}

// ❌ Bad
pub struct SaasTestDef {
    id: Uuid,
    Name: String,
    // Missing derives
}

impl Database {
    pub fn CreateTestDefinition(&self, def: SaasTestDef) {
        // Missing async, error handling
    }
}
```

#### Best Practices

- Use `Result<T, anyhow::Error>` for fallible operations
- Always add context to errors with `.context()`
- Prefer owned types in public APIs
- Use proper derives (`Debug`, `Clone`, `Serialize`, `Deserialize`)
- Document public functions with `///` comments

### React Component Guidelines

#### Component Structure

```typescript
// ✅ Good
interface TestDefinitionCardProps {
  definition: TestDefinition;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const TestDefinitionCard: React.FC<TestDefinitionCardProps> = ({
  definition,
  onEdit,
  onDelete,
}) => {
  const handleEdit = useCallback(() => {
    onEdit?.(definition.id);
  }, [definition.id, onEdit]);

  return (
    <div className="border rounded-lg p-4">
      <h3 className="text-lg font-semibold">{definition.name}</h3>
      {/* Component content */}
    </div>
  );
};
```

#### Best Practices

- Use functional components with hooks
- Define prop interfaces
- Use `useCallback` for event handlers when needed
- Prefer composition over prop drilling
- Extract custom hooks for reusable logic

## API Design

### REST Endpoints

Follow consistent REST patterns:

```
GET    /api/test-definitions       # List all test definitions
POST   /api/test-definitions       # Create new test definition
GET    /api/test-definitions/:id   # Get specific test definition
PUT    /api/test-definitions/:id   # Update test definition
DELETE /api/test-definitions/:id   # Delete test definition
```

### Request/Response Format

```typescript
// Request body (POST/PUT)
{
  "name": "Sample Test",
  "description": "A sample test definition",
  "code": "console.log('Hello, World!');",
  "language": "javascript"
}

// Success response
{
  "data": {
    "id": "uuid-here",
    "name": "Sample Test",
    // ... other fields
  }
}

// Error response
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid test definition",
    "details": {
      "field": "name",
      "issue": "Name is required"
    }
  }
}
```

### Error Handling

- Use appropriate HTTP status codes
- Return consistent error format
- Include helpful error messages
- Log errors on the server side

## Testing Guidelines

### Frontend Testing

```typescript
// Component tests
import { render, screen } from '@testing-library/react';
import { TestDefinitionCard } from './TestDefinitionCard';

describe('TestDefinitionCard', () => {
  it('renders test definition name', () => {
    const definition = {
      id: '1',
      name: 'Test Name',
      // ... other required fields
    };

    render(<TestDefinitionCard definition={definition} />);
    expect(screen.getByText('Test Name')).toBeInTheDocument();
  });
});
```

### Backend Testing

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_create_test_definition() {
        let db = Database::new("test_url").await.unwrap();
        let definition = SaasTestDefinition {
            id: Uuid::new_v4(),
            name: "Test".to_string(),
            // ... other fields
        };

        let result = db.create_test_definition(&definition).await;
        assert!(result.is_ok());
    }
}
```

## Performance Guidelines

### Frontend

- Use Next.js built-in optimizations (Image, Link components)
- Implement proper loading states
- Use React.memo for expensive components
- Lazy load components when appropriate

### Backend

- Use async/await properly
- Implement connection pooling for database
- Add appropriate indexes to database queries
- Use streaming for large responses

## Security Guidelines

### Authentication & Authorization

- Implement proper user authentication
- Use JWT tokens with appropriate expiration
- Validate user permissions for all operations
- Sanitize all user inputs

### Data Validation

```rust
// Backend validation
#[derive(Deserialize)]
pub struct CreateTestDefinitionRequest {
    #[serde(deserialize_with = "validate_name")]
    pub name: String,
    pub description: Option<String>,
    pub code: String,
    pub language: TestLanguage,
}

fn validate_name<'de, D>(deserializer: D) -> Result<String, D::Error>
where
    D: serde::Deserializer<'de>,
{
    let name = String::deserialize(deserializer)?;
    if name.trim().is_empty() {
        return Err(serde::de::Error::custom("Name cannot be empty"));
    }
    Ok(name)
}
```

### Environment Variables

- Never commit secrets to version control
- Use `.env` files for local development
- Validate required environment variables on startup

## Code Review Checklist

### General

- [ ] Code follows naming conventions
- [ ] Proper error handling implemented
- [ ] Tests added for new functionality
- [ ] Documentation updated if needed

### TypeScript

- [ ] Types are properly defined
- [ ] No `any` types used
- [ ] Props interfaces defined for components
- [ ] Proper import/export statements

### Rust

- [ ] Proper error handling with `Result`
- [ ] Appropriate derives added to structs
- [ ] Async functions used correctly
- [ ] Memory safety considerations

### API

- [ ] REST conventions followed
- [ ] Input validation implemented
- [ ] Consistent response format
- [ ] Proper HTTP status codes

---

Following these guidelines ensures consistent, maintainable, and high-quality code across the entire SparkTest SaaS Cloud project.
