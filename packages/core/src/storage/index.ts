// Storage service interfaces for SparkTest SaaS Cloud
import type { SaasTestDefinition, SaasTestRun, SaasExecutor, SaasTestSuite, Organization, User, TenantContext } from '../index.js';

export interface StorageService {
  // Test Definitions
  saveTestDefinition(definition: SaasTestDefinition, context?: TenantContext): Promise<string>;
  getTestDefinition(id: string, context?: TenantContext): Promise<SaasTestDefinition | null>;
  listTestDefinitions(context?: TenantContext): Promise<SaasTestDefinition[]>;
  updateTestDefinition(id: string, definition: Partial<SaasTestDefinition>, context?: TenantContext): Promise<void>;
  deleteTestDefinition(id: string, context?: TenantContext): Promise<void>;

  // Test Runs
  saveTestRun(run: SaasTestRun, context?: TenantContext): Promise<string>;
  getTestRun(id: string, context?: TenantContext): Promise<SaasTestRun | null>;
  listTestRuns(context?: TenantContext): Promise<SaasTestRun[]>;

  // Executors
  saveExecutor(executor: SaasExecutor, context?: TenantContext): Promise<string>;
  getExecutor(id: string, context?: TenantContext): Promise<SaasExecutor | null>;
  listExecutors(context?: TenantContext): Promise<SaasExecutor[]>;
  updateExecutor(id: string, executor: Partial<SaasExecutor>, context?: TenantContext): Promise<void>;
  deleteExecutor(id: string, context?: TenantContext): Promise<void>;

  // Test Suites
  saveTestSuite(suite: SaasTestSuite, context?: TenantContext): Promise<string>;
  getTestSuite(id: string, context?: TenantContext): Promise<SaasTestSuite | null>;
  listTestSuites(context?: TenantContext): Promise<SaasTestSuite[]>;
  updateTestSuite(id: string, suite: Partial<SaasTestSuite>, context?: TenantContext): Promise<void>;
  deleteTestSuite(id: string, context?: TenantContext): Promise<void>;

  // Organizations (admin operations)
  saveOrganization?(organization: Organization): Promise<string>;
  getOrganization?(id: string): Promise<Organization | null>;
  listOrganizations?(): Promise<Organization[]>;

  // Users (admin operations)
  saveUser?(user: User): Promise<string>;
  getUser?(id: string): Promise<User | null>;
  listUsers?(organizationId?: string): Promise<User[]>;
}

export class LocalStorageService implements StorageService {
  private getStorageKey(entity: string, organizationId?: string): string {
    return organizationId ? `${entity}_${organizationId}` : entity;
  }

  private filterByTenant<T extends { organization_id?: string; user_id?: string }>(
    items: T[], 
    context?: TenantContext
  ): T[] {
    if (!context?.organization_id) return items;
    
    return items.filter(item => 
      item.organization_id === context.organization_id || 
      (!item.organization_id && !context.organization_id)
    );
  }

  async saveTestDefinition(definition: SaasTestDefinition, context?: TenantContext): Promise<string> {
    const key = this.getStorageKey('test_definitions', context?.organization_id);
    const stored = JSON.parse(localStorage.getItem(key) || '[]');
    stored.push(definition);
    localStorage.setItem(key, JSON.stringify(stored));
    return definition.id;
  }

  async getTestDefinition(id: string, context?: TenantContext): Promise<SaasTestDefinition | null> {
    const key = this.getStorageKey('test_definitions', context?.organization_id);
    const stored = JSON.parse(localStorage.getItem(key) || '[]');
    return stored.find((def: SaasTestDefinition) => def.id === id) || null;
  }

  async listTestDefinitions(context?: TenantContext): Promise<SaasTestDefinition[]> {
    const key = this.getStorageKey('test_definitions', context?.organization_id);
    const stored = JSON.parse(localStorage.getItem(key) || '[]');
    return this.filterByTenant(stored, context);
  }

  async updateTestDefinition(id: string, definition: Partial<SaasTestDefinition>, context?: TenantContext): Promise<void> {
    const key = this.getStorageKey('test_definitions', context?.organization_id);
    const stored = JSON.parse(localStorage.getItem(key) || '[]');
    const index = stored.findIndex((def: SaasTestDefinition) => def.id === id);
    if (index !== -1) {
      stored[index] = { ...stored[index], ...definition };
      localStorage.setItem(key, JSON.stringify(stored));
    }
  }

  async deleteTestDefinition(id: string, context?: TenantContext): Promise<void> {
    const key = this.getStorageKey('test_definitions', context?.organization_id);
    const stored = JSON.parse(localStorage.getItem(key) || '[]');
    const filtered = stored.filter((def: SaasTestDefinition) => def.id !== id);
    localStorage.setItem(key, JSON.stringify(filtered));
  }

  // Placeholder implementations for other methods
  async saveTestRun(run: SaasTestRun, context?: TenantContext): Promise<string> {
    return run.id;
  }

  async getTestRun(id: string, context?: TenantContext): Promise<SaasTestRun | null> {
    return null;
  }

  async listTestRuns(context?: TenantContext): Promise<SaasTestRun[]> {
    return [];
  }

  async saveExecutor(executor: SaasExecutor, context?: TenantContext): Promise<string> {
    return executor.id;
  }

  async getExecutor(id: string, context?: TenantContext): Promise<SaasExecutor | null> {
    return null;
  }

  async listExecutors(context?: TenantContext): Promise<SaasExecutor[]> {
    return [];
  }

  async updateExecutor(id: string, executor: Partial<SaasExecutor>, context?: TenantContext): Promise<void> {
    // Placeholder implementation
  }

  async deleteExecutor(id: string, context?: TenantContext): Promise<void> {
    // Placeholder implementation
  }

  async saveTestSuite(suite: SaasTestSuite, context?: TenantContext): Promise<string> {
    return suite.id;
  }

  async getTestSuite(id: string, context?: TenantContext): Promise<SaasTestSuite | null> {
    return null;
  }

  async listTestSuites(context?: TenantContext): Promise<SaasTestSuite[]> {
    return [];
  }

  async updateTestSuite(id: string, suite: Partial<SaasTestSuite>, context?: TenantContext): Promise<void> {
    // Placeholder implementation
  }

  async deleteTestSuite(id: string, context?: TenantContext): Promise<void> {
    // Placeholder implementation
  }
}

export class APIStorageService implements StorageService {
  constructor(private baseUrl: string) {}

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  async saveTestDefinition(definition: SaasTestDefinition, context?: TenantContext): Promise<string> {
    await this.request('/api/test-definitions', {
      method: 'POST',
      body: JSON.stringify(definition),
    });
    return definition.id;
  }

  async getTestDefinition(id: string, context?: TenantContext): Promise<SaasTestDefinition | null> {
    try {
      return await this.request(`/api/test-definitions/${id}`);
    } catch {
      return null;
    }
  }

  async listTestDefinitions(context?: TenantContext): Promise<SaasTestDefinition[]> {
    return this.request('/api/test-definitions');
  }

  async updateTestDefinition(id: string, definition: Partial<SaasTestDefinition>, context?: TenantContext): Promise<void> {
    await this.request(`/api/test-definitions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(definition),
    });
  }

  async deleteTestDefinition(id: string, context?: TenantContext): Promise<void> {
    await this.request(`/api/test-definitions/${id}`, {
      method: 'DELETE',
    });
  }

  // Implement other methods similar to test definitions...
  async saveTestRun(run: SaasTestRun, context?: TenantContext): Promise<string> {
    await this.request('/api/test-runs', {
      method: 'POST',
      body: JSON.stringify(run),
    });
    return run.id;
  }

  async getTestRun(id: string, context?: TenantContext): Promise<SaasTestRun | null> {
    try {
      return await this.request(`/api/test-runs/${id}`);
    } catch {
      return null;
    }
  }

  async listTestRuns(context?: TenantContext): Promise<SaasTestRun[]> {
    return this.request('/api/test-runs');
  }

  async saveExecutor(executor: SaasExecutor, context?: TenantContext): Promise<string> {
    await this.request('/api/executors', {
      method: 'POST',
      body: JSON.stringify(executor),
    });
    return executor.id;
  }

  async getExecutor(id: string, context?: TenantContext): Promise<SaasExecutor | null> {
    try {
      return await this.request(`/api/executors/${id}`);
    } catch {
      return null;
    }
  }

  async listExecutors(context?: TenantContext): Promise<SaasExecutor[]> {
    return this.request('/api/executors');
  }

  async updateExecutor(id: string, executor: Partial<SaasExecutor>, context?: TenantContext): Promise<void> {
    await this.request(`/api/executors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(executor),
    });
  }

  async deleteExecutor(id: string, context?: TenantContext): Promise<void> {
    await this.request(`/api/executors/${id}`, {
      method: 'DELETE',
    });
  }

  async saveTestSuite(suite: SaasTestSuite, context?: TenantContext): Promise<string> {
    await this.request('/api/test-suites', {
      method: 'POST',
      body: JSON.stringify(suite),
    });
    return suite.id;
  }

  async getTestSuite(id: string, context?: TenantContext): Promise<SaasTestSuite | null> {
    try {
      return await this.request(`/api/test-suites/${id}`);
    } catch {
      return null;
    }
  }

  async listTestSuites(context?: TenantContext): Promise<SaasTestSuite[]> {
    return this.request('/api/test-suites');
  }

  async updateTestSuite(id: string, suite: Partial<SaasTestSuite>, context?: TenantContext): Promise<void> {
    await this.request(`/api/test-suites/${id}`, {
      method: 'PUT',
      body: JSON.stringify(suite),
    });
  }

  async deleteTestSuite(id: string, context?: TenantContext): Promise<void> {
    await this.request(`/api/test-suites/${id}`, {
      method: 'DELETE',
    });
  }
}
