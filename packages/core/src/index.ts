// Core types and interfaces for SparkTest SaaS Cloud
// These types correspond to the Rust SaaS entities in the backend

export interface SaasTestDefinition {
  id: string;
  name: string;
  description?: string;
  code: string;
  language: 'javascript' | 'python' | 'rust';
  created_at: string;
  updated_at: string;
  // SaaS-specific fields
  user_id?: string;
  organization_id?: string;
  is_public: boolean;
}

export interface SaasTestRun {
  id: string;
  definition_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
  created_at: string;
  updated_at: string;
  // SaaS-specific fields
  user_id?: string;
  organization_id?: string;
}

export interface SaasExecutor {
  id: string;
  name: string;
  executor_type: 'local' | 'kubernetes' | 'docker';
  config: Record<string, any>;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  // SaaS-specific fields
  user_id?: string;
  organization_id?: string;
}

export interface SaasTestSuite {
  id: string;
  name: string;
  description?: string;
  test_definitions: string[];
  created_at: string;
  updated_at: string;
  // SaaS-specific fields
  user_id?: string;
  organization_id?: string;
}

export interface Organization {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  organization_id?: string;
  created_at: string;
  updated_at: string;
}

// Legacy types for backward compatibility
export interface TestDefinition extends Omit<SaasTestDefinition, 'user_id' | 'organization_id' | 'is_public'> {}
export interface TestRun extends Omit<SaasTestRun, 'user_id' | 'organization_id'> {}
export interface Executor extends Omit<SaasExecutor, 'user_id' | 'organization_id'> {
  type: 'local' | 'kubernetes' | 'docker'; // Alias for backward compatibility
}
export interface TestSuite extends Omit<SaasTestSuite, 'user_id' | 'organization_id'> {}

export * from './storage/index.js';
export * from './config.js';
export * from './types.js';
