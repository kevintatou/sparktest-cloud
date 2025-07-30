import { Definition, Run, Suite, Executor } from "@tatou/core"

export interface StorageService {
  // Definitions
  getDefinitions(): Promise<Definition[]>
  getDefinition(id: string): Promise<Definition | null>
  createDefinition(definition: Omit<Definition, "id" | "createdAt">): Promise<Definition>
  updateDefinition(id: string, definition: Partial<Definition>): Promise<Definition>
  deleteDefinition(id: string): Promise<void>

  // Runs
  getRuns(): Promise<Run[]>
  getRun(id: string): Promise<Run | null>
  createRun(run: Omit<Run, "id" | "createdAt">): Promise<Run>
  updateRun(id: string, run: Partial<Run>): Promise<Run>
  deleteRun(id: string): Promise<void>

  // Suites
  getSuites(): Promise<Suite[]>
  getSuite(id: string): Promise<Suite | null>
  createSuite(suite: Omit<Suite, "id" | "createdAt">): Promise<Suite>
  updateSuite(id: string, suite: Partial<Suite>): Promise<Suite>
  deleteSuite(id: string): Promise<void>

  // Executors
  getExecutors(): Promise<Executor[]>
  getExecutor(id: string): Promise<Executor | null>
  createExecutor(executor: Omit<Executor, "id" | "createdAt">): Promise<Executor>
  updateExecutor(id: string, executor: Partial<Executor>): Promise<Executor>
  deleteExecutor(id: string): Promise<void>
}

export class LocalStorageService implements StorageService {
  private getFromStorage<T>(key: string, defaultValue: T[]): T[] {
    if (typeof window === "undefined") return defaultValue
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch {
      return defaultValue
    }
  }

  private setToStorage<T>(key: string, value: T[]): void {
    if (typeof window === "undefined") return
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error(`Failed to save ${key} to localStorage:`, error)
    }
  }

  // Definitions
  async getDefinitions(): Promise<Definition[]> {
    return this.getFromStorage("sparktest-definitions", [])
  }

  async getDefinition(id: string): Promise<Definition | null> {
    const definitions = await this.getDefinitions()
    return definitions.find(d => d.id === id) || null
  }

  async createDefinition(definition: Omit<Definition, "id" | "createdAt">): Promise<Definition> {
    const definitions = await this.getDefinitions()
    const newDefinition: Definition = {
      ...definition,
      id: `def-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    }
    definitions.push(newDefinition)
    this.setToStorage("sparktest-definitions", definitions)
    return newDefinition
  }

  async updateDefinition(id: string, definition: Partial<Definition>): Promise<Definition> {
    const definitions = await this.getDefinitions()
    const index = definitions.findIndex(d => d.id === id)
    if (index === -1) throw new Error(`Definition ${id} not found`)
    
    definitions[index] = { ...definitions[index], ...definition }
    this.setToStorage("sparktest-definitions", definitions)
    return definitions[index]
  }

  async deleteDefinition(id: string): Promise<void> {
    const definitions = await this.getDefinitions()
    const filtered = definitions.filter(d => d.id !== id)
    this.setToStorage("sparktest-definitions", filtered)
  }

  // Runs
  async getRuns(): Promise<Run[]> {
    return this.getFromStorage("sparktest-runs", [])
  }

  async getRun(id: string): Promise<Run | null> {
    const runs = await this.getRuns()
    return runs.find(r => r.id === id) || null
  }

  async createRun(run: Omit<Run, "id" | "createdAt">): Promise<Run> {
    const runs = await this.getRuns()
    const newRun: Run = {
      ...run,
      id: `run-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    }
    runs.push(newRun)
    this.setToStorage("sparktest-runs", runs)
    return newRun
  }

  async updateRun(id: string, run: Partial<Run>): Promise<Run> {
    const runs = await this.getRuns()
    const index = runs.findIndex(r => r.id === id)
    if (index === -1) throw new Error(`Run ${id} not found`)
    
    runs[index] = { ...runs[index], ...run }
    this.setToStorage("sparktest-runs", runs)
    return runs[index]
  }

  async deleteRun(id: string): Promise<void> {
    const runs = await this.getRuns()
    const filtered = runs.filter(r => r.id !== id)
    this.setToStorage("sparktest-runs", filtered)
  }

  // Suites
  async getSuites(): Promise<Suite[]> {
    return this.getFromStorage("sparktest-suites", [])
  }

  async getSuite(id: string): Promise<Suite | null> {
    const suites = await this.getSuites()
    return suites.find(s => s.id === id) || null
  }

  async createSuite(suite: Omit<Suite, "id" | "createdAt">): Promise<Suite> {
    const suites = await this.getSuites()
    const newSuite: Suite = {
      ...suite,
      id: `suite-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    }
    suites.push(newSuite)
    this.setToStorage("sparktest-suites", suites)
    return newSuite
  }

  async updateSuite(id: string, suite: Partial<Suite>): Promise<Suite> {
    const suites = await this.getSuites()
    const index = suites.findIndex(s => s.id === id)
    if (index === -1) throw new Error(`Suite ${id} not found`)
    
    suites[index] = { ...suites[index], ...suite }
    this.setToStorage("sparktest-suites", suites)
    return suites[index]
  }

  async deleteSuite(id: string): Promise<void> {
    const suites = await this.getSuites()
    const filtered = suites.filter(s => s.id !== id)
    this.setToStorage("sparktest-suites", filtered)
  }

  // Executors
  async getExecutors(): Promise<Executor[]> {
    return this.getFromStorage("sparktest-executors", [])
  }

  async getExecutor(id: string): Promise<Executor | null> {
    const executors = await this.getExecutors()
    return executors.find(e => e.id === id) || null
  }

  async createExecutor(executor: Omit<Executor, "id" | "createdAt">): Promise<Executor> {
    const executors = await this.getExecutors()
    const newExecutor: Executor = {
      ...executor,
      id: `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    }
    executors.push(newExecutor)
    this.setToStorage("sparktest-executors", executors)
    return newExecutor
  }

  async updateExecutor(id: string, executor: Partial<Executor>): Promise<Executor> {
    const executors = await this.getExecutors()
    const index = executors.findIndex(e => e.id === id)
    if (index === -1) throw new Error(`Executor ${id} not found`)
    
    executors[index] = { ...executors[index], ...executor }
    this.setToStorage("sparktest-executors", executors)
    return executors[index]
  }

  async deleteExecutor(id: string): Promise<void> {
    const executors = await this.getExecutors()
    const filtered = executors.filter(e => e.id !== id)
    this.setToStorage("sparktest-executors", filtered)
  }
}