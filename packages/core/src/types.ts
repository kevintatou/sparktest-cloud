// Additional type definitions
export type TestStatus = 'queued' | 'pending' | 'running' | 'completed' | 'passed' | 'failed' | 'cancelled' | 'error';
export type ExecutorType = 'local' | 'kubernetes' | 'docker';
export type ExecutorStatus = 'active' | 'inactive';
export type Language = 'javascript' | 'python' | 'rust';
