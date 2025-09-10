# SparkTest SaaS Cloud - Development Guidelines

This document provides comprehensive guidelines for developing the SparkTest SaaS Cloud application, ensuring consistency and quality across the monorepo.

## Table of Contents

- [Project Architecture](#project-architecture)
- [Multi-Tenancy Model](#multi-tenancy-model)
- [Coding Standards](#coding-standards)
- [API Design](#api-design)
- [Storage Architecture](#storage-architecture)
- [Testing Guidelines](#testing-guidelines)
- [Performance Guidelines](#performance-guidelines)
- [Security Guidelines](#security-guidelines)

## Project Architecture

### Monorepo Structure

Our project follows a monorepo pattern using pnpm workspaces with SaaS multi-tenancy:

```
sparktest-cloud/
├── apps/saas/
│   ├── backend/          # Rust backend services
│   │   ├── core/        # SaaS entities and business logic
│   │   ├── api/         # REST API server (Axum)
│   │   └── bin/         # Application binary
│   └── frontend/        # Next.js application
│       ├── src/app/     # App Router pages
│       ├── src/components/ # React components
│       └── src/lib/     # Utility functions
├── packages/
│   ├── core/           # Shared TypeScript types and StorageService
│   └── ui/             # Reusable UI components
├── .mcp/               # Model Context Protocol configuration
└── .github/            # GitHub Copilot instructions
```

### Technology Stack

#### Frontend

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript 5+
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI primitives (@radix-ui/*)
- **Icons**: Lucide React
- **State Management**: React state with StorageService abstraction
- **Storage Modes**: Local storage and API backend support

#### Backend

- **Language**: Rust 1.70+
- **Framework**: Axum for HTTP server with CORS support
- **Async Runtime**: Tokio
- **Serialization**: Serde with JSON
- **Database**: In-memory storage (current), PostgreSQL (planned)
- **Error Handling**: anyhow with proper context
- **Multi-tenancy**: Organization-based tenant isolation

#### Shared

- **Package Manager**: pnpm with workspaces
- **Formatting**: Prettier (TS), rustfmt (Rust)
- **Linting**: ESLint (TS), Clippy (Rust)
- **Type Safety**: Consistent entity definitions across languages

## Multi-Tenancy Model

### Core Principles

- **Organization-based tenancy**: Each organization is an isolated tenant
- **User membership**: Users belong to organizations
- **Resource isolation**: All SaaS entities include `user_id` and `organization_id`
- **Public sharing**: Test definitions can be marked as public for cross-organization access

### SaaS Entities

All core entities have been enhanced with SaaS-specific fields:

```rust
// Example: SaasTestDefinition
pub struct SaasTestDefinition {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub code: String,
    pub language: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    // SaaS-specific fields
    pub user_id: Option<Uuid>,
    pub organization_id: Option<Uuid>,
    pub is_public: bool,
}
```

### Storage Architecture

The project implements a flexible storage abstraction supporting two modes:

- **API Mode** (default): Frontend communicates with Rust backend via REST API
- **Local Mode**: Frontend uses browser localStorage for offline development

```typescript
interface StorageService {
  saveTestDefinition(definition: SaasTestDefinition, context?: TenantContext): Promise<string>;
  listTestDefinitions(context?: TenantContext): Promise<SaasTestDefinition[]>;
  // ... other CRUD operations with tenant context
}
```

## Coding Standards

### TypeScript Guidelines

#### Naming Conventions

- **Variables & Functions**: `camelCase`
- **Types & Interfaces**: `PascalCase`
- **Constants**: `SCREAMING_SNAKE_CASE`
- **Files**: `kebab-case.ts` (except React components: `PascalCase.tsx`)

#### Code Style

```typescript
// ✅ Good - SaaS entity with multi-tenancy
interface SaasTestDefinition {
  id: string;
  name: string;
  description?: string;
  code: string;
  language: 'javascript' | 'python' | 'rust';
  created_at: string;
  updated_at: string;
  user_id?: string;
  organization_id?: string;
  is_public: boolean;
}

const createTestDefinition = async (
  data: Partial<SaasTestDefinition>,
  context?: TenantContext
): Promise<SaasTestDefinition> => {
  // Implementation with tenant context
};

// ❌ Bad
interface testDefinition {
  id: string;
  name: string;
  Description?: string;
  Code: string;
}

function CreateTestDefinition(data) {
  // No types, no tenant context
}
```

#### Best Practices

- Always define return types for exported functions
- Use `const` assertions for immutable data
- Prefer `interface` over `type` for object shapes
- Use utility types (`Partial`, `Pick`, `Omit`) appropriately
- Implement proper error boundaries in React components
- **Multi-tenancy**: Always include `TenantContext` in service calls
- **Type safety**: Ensure TypeScript types match Rust structs exactly

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
// Request body (POST/PUT) - SaaS version with tenant context
{
  "name": "Sample Test",
  "description": "A sample test definition",
  "code": "console.log('Hello, World!');",
  "language": "javascript",
  "is_public": false
  // user_id and organization_id handled by auth context
}

// Success response
{
  "data": {
    "id": "uuid-here",
    "name": "Sample Test",
    "description": "A sample test definition",
    "code": "console.log('Hello, World!');",
    "language": "javascript",
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-01-01T00:00:00Z",
    "user_id": "user-uuid",
    "organization_id": "org-uuid",
    "is_public": false
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

### Multi-Tenancy Implementation

#### Tenant Context

All SaaS entities must include tenant context:

```rust
// Rust: Filter by organization in all queries
pub async fn list_test_definitions(
    &self, 
    user_id: Option<Uuid>, 
    organization_id: Option<Uuid>
) -> Result<Vec<SaasTestDefinition>, anyhow::Error> {
    let defs = self.test_definitions.lock().unwrap();
    Ok(defs.iter()
        .filter(|d| d.organization_id == organization_id)
        .cloned()
        .collect())
}
```

```typescript
// TypeScript: Use StorageService with TenantContext
const definitions = await storageService.listTestDefinitions({
  user_id: currentUser.id,
  organization_id: currentUser.organization_id
});
```

#### Security Rules

1. **Data Isolation**: Never return data from other organizations
2. **Public Resources**: Handle `is_public` flag for cross-tenant sharing
3. **User Validation**: Ensure users can only access their organization's data
4. **API Filtering**: Apply organization filters at the database/storage level

### Error Handling

- Use appropriate HTTP status codes
- Return consistent error format
- Include helpful error messages
- Log errors on the server side

## Testing Guidelines

### Frontend Testing

```typescript
// Component tests with SaaS entities
import { render, screen } from '@testing-library/react';
import { TestDefinitionCard } from './TestDefinitionCard';

describe('TestDefinitionCard', () => {
  it('renders test definition name and handles multi-tenancy', () => {
    const definition: SaasTestDefinition = {
      id: '1',
      name: 'Test Name',
      description: 'Test description',
      code: 'console.log("test");',
      language: 'javascript',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
      user_id: 'user-1',
      organization_id: 'org-1',
      is_public: false
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
    async fn test_create_test_definition_with_tenant_isolation() {
        let db = Database::new("test_url").await.unwrap();
        let org_id = Uuid::new_v4();
        let user_id = Uuid::new_v4();
        
        let definition = SaasTestDefinition {
            id: Uuid::new_v4(),
            name: "Test".to_string(),
            description: Some("Test description".to_string()),
            code: "console.log('test');".to_string(),
            language: "javascript".to_string(),
            created_at: Utc::now(),
            updated_at: Utc::now(),
            user_id: Some(user_id),
            organization_id: Some(org_id),
            is_public: false,
        };

        let result = db.create_test_definition(&definition).await;
        assert!(result.is_ok());
        
        // Test tenant isolation
        let retrieved = db.list_test_definitions(Some(user_id), Some(org_id)).await.unwrap();
        assert_eq!(retrieved.len(), 1);
        assert_eq!(retrieved[0].organization_id, Some(org_id));
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

### Multi-Tenant Security

**Critical**: All operations must respect tenant boundaries to prevent data leakage.

#### Tenant Isolation Rules
1. **Database Queries**: Always filter by `organization_id`
2. **API Endpoints**: Validate user belongs to requested organization  
3. **Public Resources**: Handle `is_public` flag carefully
4. **Cross-Tenant Access**: Explicitly denied except for public resources

```rust
// ✅ Correct: Always filter by organization
pub async fn list_test_definitions(
    &self,
    user_id: Option<Uuid>,
    organization_id: Option<Uuid>
) -> Result<Vec<SaasTestDefinition>, anyhow::Error> {
    let defs = self.test_definitions.lock().unwrap();
    Ok(defs.iter()
        .filter(|d| {
            // User can see their org's resources or public resources
            d.organization_id == organization_id || 
            (d.is_public && organization_id.is_some())
        })
        .cloned()
        .collect())
}

// ❌ Wrong: No tenant filtering
pub async fn list_all_test_definitions(&self) -> Result<Vec<SaasTestDefinition>, anyhow::Error> {
    let defs = self.test_definitions.lock().unwrap();
    Ok(defs.clone()) // Exposes all tenants' data!
}
```

### Authentication & Authorization

- Implement proper user authentication with organization context
- Use JWT tokens with appropriate expiration and organization claims
- Validate user permissions for all operations within their organization
- Sanitize all user inputs to prevent injection attacks
- Implement rate limiting per organization

### Data Validation

```rust
// Backend validation with SaaS context
#[derive(Deserialize)]
pub struct CreateTestDefinitionRequest {
    #[serde(deserialize_with = "validate_name")]
    pub name: String,
    pub description: Option<String>,
    pub code: String,
    pub language: TestLanguage,
    pub is_public: Option<bool>, // SaaS-specific field
}

fn validate_name<'de, D>(deserializer: D) -> Result<String, D::Error>
where
    D: serde::Deserializer<'de>,
{
    let name = String::deserialize(deserializer)?;
    if name.trim().is_empty() {
        return Err(serde::de::Error::custom("Name cannot be empty"));
    }
    if name.len() > 255 {
        return Err(serde::de::Error::custom("Name too long"));
    }
    Ok(name.trim().to_string())
}
```

### Environment Variables

- Never commit secrets to version control
- Use `.env` files for local development
- Validate required environment variables on startup
- Include organization-specific configuration for multi-tenancy

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
