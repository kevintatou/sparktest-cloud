// Core types and interfaces for SparkTest
export interface TestDefinition {
  id: string;
  name: string;
  description?: string;
  code: string;
  language: 'javascript' | 'python' | 'rust';
  created_at: string;
  updated_at: string;
}

export interface TestRun {
  id: string;
  definition_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
  created_at: string;
  updated_at: string;
}



// Frontend-compatible interfaces
export interface Definition {
  id: string;
  name: string;
  description?: string;
  image: string;
  commands: string[];
  createdAt: string;
}

export interface Run {
  id: string;
  name: string;
  image: string;
  command: string[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: string;
  definitionId: string;
  duration?: number;
  logs?: string[];
}

export interface Executor {
  id: string;
  name: string;
  image: string;
  description: string;
  createdAt: string;
}

export interface Suite {
  id: string;
  name: string;
  description?: string;
  testDefinitionIds: string[];
  createdAt: string;
  executionMode: 'sequential' | 'parallel';
}

// Multi-tenancy types
export interface Organization {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: 'admin' | 'developer' | 'viewer';
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationPolicy {
  id: string;
  organizationId: string;
  maxConcurrentRuns: number;
  dailyCap: number;
  createdAt: string;
  updatedAt: string;
}

export * from './storage/index.js';
export * from './config.js';
export * from './types.js';