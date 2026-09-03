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
  executorId?: string;
  createdAt: string;
}

export interface Run {
  id: string;
  name: string;
  image: string;
  command: string[];
  status: 'queued' | 'pending' | 'running' | 'completed' | 'passed' | 'failed' | 'cancelled' | 'error';
  createdAt: string;
  definitionId: string;
  duration?: number;
  logs?: string[];
}

export interface Executor {
  id: string;
  name: string;
  image: string;
  command: string[];
  supportedFileTypes: string[];
  environmentVariables: string[];
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

export * from './storage/index.js';
export * from './config.js';
export * from './types.js';
