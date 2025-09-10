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

export interface Executor {
  id: string;
  name: string;
  type: 'local' | 'kubernetes' | 'docker';
  config: Record<string, any>;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface TestSuite {
  id: string;
  name: string;
  description?: string;
  test_definitions: string[];
  created_at: string;
  updated_at: string;
}

export * from './storage/index.js';
export * from './config.js';
export * from './types.js';
