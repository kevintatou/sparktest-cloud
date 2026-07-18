'use client';

import { useCallback, useEffect, useState } from 'react';
import { Definition, Executor, Run, Suite } from '@tatou/core';
import { supabase } from '@/lib/supabase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const NIL_UUID = '00000000-0000-0000-0000-000000000000';

type ApiDefinition = {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  image: string;
  commands: string[];
  executor_id?: string | null;
  labels: string[];
  created_at: string;
  updated_at: string;
};

type ApiRun = {
  id: string;
  project_id: string;
  definition_id?: string | null;
  suite_id?: string | null;
  executor_id?: string | null;
  agent_id?: string | null;
  status: Run['status'];
  result?: Record<string, unknown> | null;
  error?: string | null;
  queued_at: string;
  started_at?: string | null;
  finished_at?: string | null;
  created_at: string;
  updated_at: string;
};

type ApiExecutor = {
  id: string;
  project_id: string;
  name: string;
  executor_type: string;
  image?: string | null;
  config: Record<string, unknown>;
  status: string;
  created_at: string;
  updated_at: string;
};

type ApiSuite = {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  test_definition_ids: string[];
  execution_mode: 'sequential' | 'parallel';
  created_at: string;
  updated_at: string;
};

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    return { Authorization: `Bearer ${session.access_token}` };
  }
  return {};
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const authHeaders = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

function now() {
  return new Date().toISOString();
}

function toDefinition(definition: ApiDefinition): Definition {
  return {
    id: definition.id,
    name: definition.name,
    description: definition.description,
    image: definition.image,
    commands: definition.commands,
    createdAt: definition.created_at,
  };
}

function fromDefinition(definition: Omit<Definition, 'id' | 'createdAt'>): ApiDefinition {
  return {
    id: NIL_UUID,
    project_id: NIL_UUID,
    name: definition.name,
    description: definition.description,
    image: definition.image,
    commands: definition.commands,
    executor_id: null,
    labels: [],
    created_at: now(),
    updated_at: now(),
  };
}

function toRun(run: ApiRun, definitions: Definition[]): Run {
  const definition = definitions.find(item => item.id === run.definition_id);
  return {
    id: run.id,
    name: definition ? `Run ${definition.name}` : `Run ${run.id.slice(-8)}`,
    image: definition?.image || 'container',
    command: definition?.commands || [],
    status: run.status,
    createdAt: run.created_at,
    definitionId: run.definition_id || '',
    logs: run.error ? [run.error] : undefined,
  };
}

function fromRun(definitionId: string): ApiRun {
  return {
    id: NIL_UUID,
    project_id: NIL_UUID,
    definition_id: definitionId,
    suite_id: null,
    executor_id: null,
    agent_id: null,
    status: 'queued',
    result: null,
    error: null,
    queued_at: now(),
    started_at: null,
    finished_at: null,
    created_at: now(),
    updated_at: now(),
  };
}

function toExecutor(executor: ApiExecutor): Executor {
  return {
    id: executor.id,
    name: executor.name,
    image: executor.image || executor.executor_type,
    description: String(executor.config.description || `${executor.executor_type} executor`),
    createdAt: executor.created_at,
  };
}

function fromExecutor(executor: Omit<Executor, 'id' | 'createdAt'>): ApiExecutor {
  return {
    id: NIL_UUID,
    project_id: NIL_UUID,
    name: executor.name,
    executor_type: executor.image,
    image: executor.image,
    config: { description: executor.description },
    status: 'active',
    created_at: now(),
    updated_at: now(),
  };
}

function toSuite(suite: ApiSuite): Suite {
  return {
    id: suite.id,
    name: suite.name,
    description: suite.description,
    testDefinitionIds: suite.test_definition_ids,
    createdAt: suite.created_at,
    executionMode: suite.execution_mode,
  };
}

function fromSuite(suite: Omit<Suite, 'id' | 'createdAt'>): ApiSuite {
  return {
    id: NIL_UUID,
    project_id: NIL_UUID,
    name: suite.name,
    description: suite.description,
    test_definition_ids: suite.testDefinitionIds,
    execution_mode: suite.executionMode,
    created_at: now(),
    updated_at: now(),
  };
}

export function useStorage() {
  const [definitions, setDefinitions] = useState<Definition[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [executors, setExecutors] = useState<Executor[]>([]);
  const [suites, setSuites] = useState<Suite[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [apiDefinitions, apiExecutors, apiSuites] = await Promise.all([
        fetchApi<ApiDefinition[]>('/api/test-definitions'),
        fetchApi<ApiExecutor[]>('/api/executors'),
        fetchApi<ApiSuite[]>('/api/test-suites'),
      ]);
      const nextDefinitions = apiDefinitions.map(toDefinition);
      const apiRuns = await fetchApi<ApiRun[]>('/api/test-runs');

      setDefinitions(nextDefinitions);
      setExecutors(apiExecutors.map(toExecutor));
      setSuites(apiSuites.map(toSuite));
      setRuns(apiRuns.map(run => toRun(run, nextDefinitions)));
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const createDefinition = async (testData: Omit<Definition, 'id' | 'createdAt'>) => {
    const created = await fetchApi<ApiDefinition>('/api/test-definitions', {
      method: 'POST',
      body: JSON.stringify(fromDefinition(testData)),
    });
    const definition = toDefinition(created);
    setDefinitions(prev => [definition, ...prev]);
    return definition;
  };

  const updateDefinition = async (id: string, updates: Partial<Omit<Definition, 'id' | 'createdAt'>>) => {
    const current = definitions.find(definition => definition.id === id);
    if (!current) throw new Error('Definition not found');
    const updated = await fetchApi<ApiDefinition>(`/api/test-definitions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(fromDefinition({ ...current, ...updates })),
    });
    setDefinitions(prev => prev.map(definition => definition.id === id ? toDefinition(updated) : definition));
  };

  const createExecutor = async (executorData: Omit<Executor, 'id' | 'createdAt'>) => {
    const created = await fetchApi<ApiExecutor>('/api/executors', {
      method: 'POST',
      body: JSON.stringify(fromExecutor(executorData)),
    });
    const executor = toExecutor(created);
    setExecutors(prev => [executor, ...prev]);
    return executor;
  };

  const updateExecutor = async (id: string, updates: Partial<Omit<Executor, 'id' | 'createdAt'>>) => {
    const current = executors.find(executor => executor.id === id);
    if (!current) throw new Error('Executor not found');
    const updated = await fetchApi<ApiExecutor>(`/api/executors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(fromExecutor({ ...current, ...updates })),
    });
    setExecutors(prev => prev.map(executor => executor.id === id ? toExecutor(updated) : executor));
  };

  const createSuite = async (suiteData: Omit<Suite, 'id' | 'createdAt'>) => {
    const created = await fetchApi<ApiSuite>('/api/test-suites', {
      method: 'POST',
      body: JSON.stringify(fromSuite(suiteData)),
    });
    const suite = toSuite(created);
    setSuites(prev => [suite, ...prev]);
    return suite;
  };

  const updateSuite = async (id: string, updates: Partial<Omit<Suite, 'id' | 'createdAt'>>) => {
    const current = suites.find(suite => suite.id === id);
    if (!current) throw new Error('Suite not found');
    const updated = await fetchApi<ApiSuite>(`/api/test-suites/${id}`, {
      method: 'PUT',
      body: JSON.stringify(fromSuite({ ...current, ...updates })),
    });
    setSuites(prev => prev.map(suite => suite.id === id ? toSuite(updated) : suite));
  };

  const runTest = async (definitionId: string) => {
    const created = await fetchApi<ApiRun>('/api/test-runs', {
      method: 'POST',
      body: JSON.stringify(fromRun(definitionId)),
    });
    const run = toRun(created, definitions);
    setRuns(prev => [run, ...prev]);
    return run;
  };

  const runSuite = async (suiteId: string) => {
    const suite = suites.find(item => item.id === suiteId);
    if (!suite) throw new Error('Suite not found');
    for (const definitionId of suite.testDefinitionIds) {
      await runTest(definitionId);
    }
  };

  const deleteDefinition = async (id: string) => {
    await fetchApi<void>(`/api/test-definitions/${id}`, { method: 'DELETE' });
    setDefinitions(prev => prev.filter(definition => definition.id !== id));
  };

  const deleteRun = async (id: string) => {
    setRuns(prev => prev.filter(run => run.id !== id));
  };

  const deleteExecutor = async (id: string) => {
    await fetchApi<void>(`/api/executors/${id}`, { method: 'DELETE' });
    setExecutors(prev => prev.filter(executor => executor.id !== id));
  };

  const deleteSuite = async (id: string) => {
    await fetchApi<void>(`/api/test-suites/${id}`, { method: 'DELETE' });
    setSuites(prev => prev.filter(suite => suite.id !== id));
  };

  return {
    definitions,
    runs,
    executors,
    suites,
    loading,
    createDefinition,
    updateDefinition,
    createExecutor,
    updateExecutor,
    createSuite,
    updateSuite,
    runTest,
    runSuite,
    deleteDefinition,
    deleteRun,
    deleteExecutor,
    deleteSuite,
  };
}
