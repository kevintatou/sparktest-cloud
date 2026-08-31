'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Definition, Run } from '@tatou/core';
import { API_BASE_URL } from '@/lib/api-config';
import { supabase } from '@/lib/supabase';
import { capturePostHog } from '@/lib/posthog';

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

async function getAuthHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.access_token) {
    return { Authorization: `Bearer ${session.access_token}` };
  }
  return {};
}

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
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

function fromDefinition(
  definition: Omit<Definition, 'id' | 'createdAt'>
): ApiDefinition {
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
  const definition = definitions.find((item) => item.id === run.definition_id);
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

export function useStorage() {
  const [definitions, setDefinitions] = useState<Definition[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const trackedTerminalRuns = useRef(new Set<string>());

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [apiDefinitions, apiRuns] = await Promise.all([
        fetchApi<ApiDefinition[]>('/api/test-definitions'),
        fetchApi<ApiRun[]>('/api/test-runs'),
      ]);
      const nextDefinitions = apiDefinitions.map(toDefinition);

      setDefinitions(nextDefinitions);
      setRuns(apiRuns.map((run) => toRun(run, nextDefinitions)));
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshRuns = useCallback(async () => {
    try {
      const apiRuns = await fetchApi<ApiRun[]>('/api/test-runs');
      apiRuns.forEach((run) => {
        if (
          !trackedTerminalRuns.current.has(run.id) &&
          ['passed', 'failed', 'error'].includes(run.status)
        ) {
          trackedTerminalRuns.current.add(run.id);
          capturePostHog(`run_${run.status}`, { run_id: run.id });
        }
      });
      setRuns(apiRuns.map((run) => toRun(run, definitions)));
    } catch (error) {
      console.error('Failed to refresh runs:', error);
    }
  }, [definitions]);

  useEffect(() => {
    loadData();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && event !== 'SIGNED_OUT') {
        // Supabase may restore the session after the first storage request.
        // Defer the reload so the auth callback can finish updating storage.
        window.setTimeout(loadData, 0);
      }
    });

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) loadData();
    });

    return () => subscription.unsubscribe();
  }, [loadData]);

  useEffect(() => {
    const interval = window.setInterval(refreshRuns, 5000);
    return () => window.clearInterval(interval);
  }, [refreshRuns]);

  const createDefinition = async (
    testData: Omit<Definition, 'id' | 'createdAt'>
  ) => {
    const created = await fetchApi<ApiDefinition>('/api/test-definitions', {
      method: 'POST',
      body: JSON.stringify(fromDefinition(testData)),
    });
    const definition = toDefinition(created);
    setDefinitions((prev) => [definition, ...prev]);
    return definition;
  };

  const updateDefinition = async (
    id: string,
    updates: Partial<Omit<Definition, 'id' | 'createdAt'>>
  ) => {
    const current = definitions.find((definition) => definition.id === id);
    if (!current) throw new Error('Definition not found');
    const updated = await fetchApi<ApiDefinition>(
      `/api/test-definitions/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(fromDefinition({ ...current, ...updates })),
      }
    );
    setDefinitions((prev) =>
      prev.map((definition) =>
        definition.id === id ? toDefinition(updated) : definition
      )
    );
  };

  const runTest = async (definitionId: string) => {
    const created = await fetchApi<ApiRun>('/api/test-runs', {
      method: 'POST',
      body: JSON.stringify(fromRun(definitionId)),
    });
    const run = toRun(created, definitions);
    setRuns((prev) => [run, ...prev]);
    capturePostHog('run_queued', { definition_id: definitionId });
    return run;
  };

  const deleteDefinition = async (id: string) => {
    await fetchApi<void>(`/api/test-definitions/${id}`, { method: 'DELETE' });
    setDefinitions((prev) => prev.filter((definition) => definition.id !== id));
  };

  const deleteRun = async (id: string) => {
    setRuns((prev) => prev.filter((run) => run.id !== id));
  };

  return {
    definitions,
    runs,
    loading,
    createDefinition,
    updateDefinition,
    runTest,
    deleteDefinition,
    deleteRun,
  };
}
