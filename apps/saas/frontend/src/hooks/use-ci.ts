'use client';

import { useState, useEffect, useCallback } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface CiIntegration {
  id: string;
  project_id: string;
  provider: 'github' | 'gitlab' | 'bitbucket';
  repo_owner: string;
  repo_name: string;
  status: 'active' | 'inactive' | 'error';
  last_sync_at: string | null;
  created_at: string;
}

export interface Schedule {
  id: string;
  project_id: string;
  name: string;
  definition_id: string | null;
  suite_id: string | null;
  cron_expression: string;
  timezone: string;
  enabled: boolean;
  last_run_at: string | null;
  next_run_at: string | null;
  run_count: number;
  created_at: string;
}

export interface Webhook {
  id: string;
  project_id: string;
  name: string;
  url: string;
  events: string[];
  enabled: boolean;
  created_at: string;
}

export interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event: string;
  response_status: number | null;
  success: boolean;
  duration_ms: number | null;
  delivered_at: string;
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  if (response.status === 204) return undefined as T;
  return response.json();
}

export function useCi() {
  const [integrations, setIntegrations] = useState<CiIntegration[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ci, sched, wh] = await Promise.all([
        fetchApi<CiIntegration[]>('/api/ci/integrations').catch(() => []),
        fetchApi<Schedule[]>('/api/ci/schedules').catch(() => []),
        fetchApi<Webhook[]>('/api/ci/webhooks').catch(() => []),
      ]);
      setIntegrations(ci);
      setSchedules(sched);
      setWebhooks(wh);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const createSchedule = async (data: {
    name: string;
    definition_id?: string;
    suite_id?: string;
    cron_expression: string;
    timezone?: string;
  }) => {
    const created = await fetchApi<Schedule>('/api/ci/schedules', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    setSchedules(prev => [created, ...prev]);
    return created;
  };

  const toggleSchedule = async (id: string, enabled: boolean) => {
    await fetchApi(`/api/ci/schedules/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ enabled }),
    });
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, enabled } : s));
  };

  const deleteSchedule = async (id: string) => {
    await fetchApi(`/api/ci/schedules/${id}`, { method: 'DELETE' });
    setSchedules(prev => prev.filter(s => s.id !== id));
  };

  const createWebhook = async (data: { name: string; url: string; events: string[] }) => {
    const created = await fetchApi<Webhook>('/api/ci/webhooks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    setWebhooks(prev => [created, ...prev]);
    return created;
  };

  const toggleWebhook = async (id: string, enabled: boolean) => {
    await fetchApi(`/api/ci/webhooks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ enabled }),
    });
    setWebhooks(prev => prev.map(w => w.id === id ? { ...w, enabled } : w));
  };

  const deleteWebhook = async (id: string) => {
    await fetchApi(`/api/ci/webhooks/${id}`, { method: 'DELETE' });
    setWebhooks(prev => prev.filter(w => w.id !== id));
  };

  const loadDeliveries = async (webhookId: string) => {
    const data = await fetchApi<WebhookDelivery[]>(`/api/ci/webhooks/${webhookId}/deliveries`);
    setDeliveries(data);
  };

  return {
    integrations,
    schedules,
    webhooks,
    deliveries,
    loading,
    createSchedule,
    toggleSchedule,
    deleteSchedule,
    createWebhook,
    toggleWebhook,
    deleteWebhook,
    loadDeliveries,
    reload: load,
  };
}
