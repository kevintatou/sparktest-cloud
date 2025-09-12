// Storage service interfaces
export interface StorageService {
  saveTestDefinition(definition: any): Promise<string>;
  getTestDefinition(id: string): Promise<any>;
  listTestDefinitions(): Promise<any[]>;
  deleteTestDefinition(id: string): Promise<void>;
  
  saveTestRun(run: any): Promise<string>;
  getTestRun(id: string): Promise<any>;
  listTestRuns(): Promise<any[]>;
  deleteTestRun(id: string): Promise<void>;
  
  saveExecutor(executor: any): Promise<string>;
  getExecutor(id: string): Promise<any>;
  listExecutors(): Promise<any[]>;
  deleteExecutor(id: string): Promise<void>;
  
  saveTestSuite(suite: any): Promise<string>;
  getTestSuite(id: string): Promise<any>;
  listTestSuites(): Promise<any[]>;
  deleteTestSuite(id: string): Promise<void>;
}

export class LocalStorageService implements StorageService {
  private readonly STORAGE_KEYS = {
    TEST_DEFINITIONS: 'sparktest-definitions',
    TEST_RUNS: 'sparktest-runs',
    EXECUTORS: 'sparktest-executors',
    TEST_SUITES: 'sparktest-suites',
  };

  // Test Definitions
  async saveTestDefinition(definition: any): Promise<string> {
    const definitions = await this.listTestDefinitions();
    const index = definitions.findIndex((d: any) => d.id === definition.id);
    
    if (index >= 0) {
      definitions[index] = definition;
    } else {
      definitions.push(definition);
    }
    
    this.saveToStorage(this.STORAGE_KEYS.TEST_DEFINITIONS, definitions);
    return definition.id;
  }
  
  async getTestDefinition(id: string): Promise<any> {
    const definitions = await this.listTestDefinitions();
    return definitions.find((d: any) => d.id === id) || null;
  }
  
  async listTestDefinitions(): Promise<any[]> {
    return this.loadFromStorage(this.STORAGE_KEYS.TEST_DEFINITIONS, []);
  }
  
  async deleteTestDefinition(id: string): Promise<void> {
    const definitions = await this.listTestDefinitions();
    const filtered = definitions.filter((d: any) => d.id !== id);
    this.saveToStorage(this.STORAGE_KEYS.TEST_DEFINITIONS, filtered);
  }
  
  // Test Runs
  async saveTestRun(run: any): Promise<string> {
    const runs = await this.listTestRuns();
    const index = runs.findIndex((r: any) => r.id === run.id);
    
    if (index >= 0) {
      runs[index] = run;
    } else {
      runs.push(run);
    }
    
    this.saveToStorage(this.STORAGE_KEYS.TEST_RUNS, runs);
    return run.id;
  }
  
  async getTestRun(id: string): Promise<any> {
    const runs = await this.listTestRuns();
    return runs.find((r: any) => r.id === id) || null;
  }
  
  async listTestRuns(): Promise<any[]> {
    return this.loadFromStorage(this.STORAGE_KEYS.TEST_RUNS, []);
  }
  
  async deleteTestRun(id: string): Promise<void> {
    const runs = await this.listTestRuns();
    const filtered = runs.filter((r: any) => r.id !== id);
    this.saveToStorage(this.STORAGE_KEYS.TEST_RUNS, filtered);
  }
  
  // Executors
  async saveExecutor(executor: any): Promise<string> {
    const executors = await this.listExecutors();
    const index = executors.findIndex((e: any) => e.id === executor.id);
    
    if (index >= 0) {
      executors[index] = executor;
    } else {
      executors.push(executor);
    }
    
    this.saveToStorage(this.STORAGE_KEYS.EXECUTORS, executors);
    return executor.id;
  }
  
  async getExecutor(id: string): Promise<any> {
    const executors = await this.listExecutors();
    return executors.find((e: any) => e.id === id) || null;
  }
  
  async listExecutors(): Promise<any[]> {
    return this.loadFromStorage(this.STORAGE_KEYS.EXECUTORS, []);
  }
  
  async deleteExecutor(id: string): Promise<void> {
    const executors = await this.listExecutors();
    const filtered = executors.filter((e: any) => e.id !== id);
    this.saveToStorage(this.STORAGE_KEYS.EXECUTORS, filtered);
  }
  
  // Test Suites
  async saveTestSuite(suite: any): Promise<string> {
    const suites = await this.listTestSuites();
    const index = suites.findIndex((s: any) => s.id === suite.id);
    
    if (index >= 0) {
      suites[index] = suite;
    } else {
      suites.push(suite);
    }
    
    this.saveToStorage(this.STORAGE_KEYS.TEST_SUITES, suites);
    return suite.id;
  }
  
  async getTestSuite(id: string): Promise<any> {
    const suites = await this.listTestSuites();
    return suites.find((s: any) => s.id === id) || null;
  }
  
  async listTestSuites(): Promise<any[]> {
    return this.loadFromStorage(this.STORAGE_KEYS.TEST_SUITES, []);
  }
  
  async deleteTestSuite(id: string): Promise<void> {
    const suites = await this.listTestSuites();
    const filtered = suites.filter((s: any) => s.id !== id);
    this.saveToStorage(this.STORAGE_KEYS.TEST_SUITES, filtered);
  }

  // Private helper methods
  private saveToStorage(key: string, data: any[]): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Failed to save to localStorage (${key}):`, error);
    }
  }

  private loadFromStorage(key: string, defaultValue: any[]): any[] {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch (error) {
      console.error(`Failed to load from localStorage (${key}):`, error);
      return defaultValue;
    }
  }
}

export class ApiStorageService implements StorageService {
  constructor(private baseUrl: string = 'http://localhost:3001') {}

  // Test Definitions
  async saveTestDefinition(definition: any): Promise<string> {
    const url = definition.id && definition.id !== `def-${Date.now()}` 
      ? `${this.baseUrl}/api/test-definitions/${definition.id}`
      : `${this.baseUrl}/api/test-definitions`;
    
    const method = definition.id && definition.id !== `def-${Date.now()}` ? 'PUT' : 'POST';
    
    // Convert frontend types to backend types
    const backendDefinition = {
      id: definition.id,
      name: definition.name,
      description: definition.description,
      code: definition.commands?.join('\n') || '',
      language: definition.image || 'javascript',
      is_public: false,
      user_id: null,
      organization_id: null,
    };
    
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(backendDefinition),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to save definition: ${response.statusText}`);
    }
    
    const result = await response.json() as any;
    return result.id;
  }
  
  async getTestDefinition(id: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/test-definitions/${id}`);
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Failed to get definition: ${response.statusText}`);
    }
    
    const backendDef = await response.json();
    return this.convertBackendToFrontendDefinition(backendDef);
  }
  
  async listTestDefinitions(): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/api/test-definitions`);
    if (!response.ok) {
      throw new Error(`Failed to list definitions: ${response.statusText}`);
    }
    
    const backendDefs = await response.json() as any[];
    return backendDefs.map((def: any) => this.convertBackendToFrontendDefinition(def));
  }
  
  async deleteTestDefinition(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/test-definitions/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete definition: ${response.statusText}`);
    }
  }
  
  // Test Runs
  async saveTestRun(run: any): Promise<string> {
    // Convert frontend run to backend run
    const backendRun = {
      id: run.id,
      definition_id: run.definitionId,
      status: run.status,
      result: run.duration ? { duration: run.duration } : null,
      error: run.logs?.join('\n') || null,
      user_id: null,
      organization_id: null,
    };
    
    const response = await fetch(`${this.baseUrl}/api/test-runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(backendRun),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to save run: ${response.statusText}`);
    }
    
    const result = await response.json() as any;
    return result.id;
  }
  
  async getTestRun(id: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/test-runs/${id}`);
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Failed to get run: ${response.statusText}`);
    }
    
    const backendRun = await response.json();
    return this.convertBackendToFrontendRun(backendRun);
  }
  
  async listTestRuns(): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/api/test-runs`);
    if (!response.ok) {
      throw new Error(`Failed to list runs: ${response.statusText}`);
    }
    
    const backendRuns = await response.json() as any[];
    return backendRuns.map((run: any) => this.convertBackendToFrontendRun(run));
  }
  
  async deleteTestRun(id: string): Promise<void> {
    // Backend doesn't have delete endpoint for runs yet, so this is a no-op
    console.warn('Delete test run not implemented in backend yet');
  }
  
  // Executors (placeholder - backend not implemented)
  async saveExecutor(executor: any): Promise<string> {
    console.warn('Executor endpoints not fully implemented in backend yet');
    return executor.id;
  }
  
  async getExecutor(id: string): Promise<any> {
    console.warn('Executor endpoints not fully implemented in backend yet');
    return null;
  }
  
  async listExecutors(): Promise<any[]> {
    console.warn('Executor endpoints not fully implemented in backend yet');
    return [];
  }
  
  async deleteExecutor(id: string): Promise<void> {
    console.warn('Executor endpoints not fully implemented in backend yet');
  }
  
  // Test Suites (placeholder - backend not implemented)
  async saveTestSuite(suite: any): Promise<string> {
    console.warn('Test suite endpoints not fully implemented in backend yet');
    return suite.id;
  }
  
  async getTestSuite(id: string): Promise<any> {
    console.warn('Test suite endpoints not fully implemented in backend yet');
    return null;
  }
  
  async listTestSuites(): Promise<any[]> {
    console.warn('Test suite endpoints not fully implemented in backend yet');
    return [];
  }
  
  async deleteTestSuite(id: string): Promise<void> {
    console.warn('Test suite endpoints not fully implemented in backend yet');
  }

  // Helper methods to convert between frontend and backend data formats
  private convertBackendToFrontendDefinition(backendDef: any): any {
    return {
      id: backendDef.id,
      name: backendDef.name,
      description: backendDef.description,
      image: backendDef.language || 'javascript',
      commands: backendDef.code ? backendDef.code.split('\n') : ['npm test'],
      createdAt: backendDef.created_at,
    };
  }
  
  private convertBackendToFrontendRun(backendRun: any): any {
    return {
      id: backendRun.id,
      name: `Run ${backendRun.id}`,
      image: 'javascript', // Default for now
      command: ['npm', 'test'], // Default for now
      status: backendRun.status,
      createdAt: backendRun.created_at,
      definitionId: backendRun.definition_id,
      duration: backendRun.result?.duration,
      logs: backendRun.error ? [backendRun.error] : undefined,
    };
  }
}