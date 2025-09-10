// Additional type definitions for SparkTest SaaS Cloud
export type TestStatus = 'pending' | 'running' | 'completed' | 'failed';
export type ExecutorType = 'local' | 'kubernetes' | 'docker';
export type ExecutorStatus = 'active' | 'inactive';
export type Language = 'javascript' | 'python' | 'rust';

// Storage mode configuration
export type StorageMode = 'local' | 'api';

// Multi-tenancy related types
export interface TenantContext {
  user_id?: string;
  organization_id?: string;
}

// Public resource sharing
export interface PublicResourceAccess {
  is_public: boolean;
  shared_organizations?: string[];
}
