'use client';

import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '@/lib/api-config';

export interface Plan {
  id: string;
  slug: string;
  name: string;
  price_cents: number;
  billing_interval: string;
  features: Record<string, any>;
  is_active: boolean;
  sort_order: number;
}

export interface Subscription {
  id: string;
  project_id: string;
  plan_id: string;
  plan_slug: string;
  plan_name: string;
  status:
    | 'active'
    | 'past_due'
    | 'canceled'
    | 'trialing'
    | 'incomplete'
    | 'paused';
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

export interface Entitlements {
  max_projects: number;
  max_agents: number;
  max_tokens: number;
  max_seats: number;
  max_runs_per_day: number;
  retention_days: number;
  storage_bytes: number;
  webhooks_enabled: boolean;
  schedules_enabled: boolean;
  audit_log_enabled: boolean;
}

export interface UsageSnapshot {
  snapshot_date: string;
  run_count: number;
  passed_count: number;
  failed_count: number;
  storage_bytes: number;
  agent_count: number;
  seat_count: number;
}

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return response.json();
}

export function useSubscriptions() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [entitlements, setEntitlements] = useState<Entitlements | null>(null);
  const [usage, setUsage] = useState<UsageSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBilling = useCallback(async () => {
    try {
      setLoading(true);
      const [fetchedPlans, fetchedSub, fetchedEntitlements, fetchedUsage] =
        await Promise.all([
          fetchApi<Plan[]>('/api/billing/plans'),
          fetchApi<Subscription | null>('/api/billing/subscription').catch(
            () => null
          ),
          fetchApi<Entitlements | null>('/api/billing/entitlements').catch(
            () => null
          ),
          fetchApi<UsageSnapshot[]>('/api/billing/usage?days=30').catch(
            () => []
          ),
        ]);
      setPlans(fetchedPlans);
      setSubscription(fetchedSub);
      setEntitlements(fetchedEntitlements);
      setUsage(fetchedUsage);
      setError(null);
    } catch (err) {
      console.error('Failed to load billing:', err);
      setError('Failed to load billing data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBilling();
  }, [loadBilling]);

  const createCheckoutSession = async (planSlug: string) => {
    const currentUrl = window.location.origin;
    const response = await fetchApi<{ checkout_url: string }>(
      '/api/billing/checkout',
      {
        method: 'POST',
        body: JSON.stringify({
          plan_slug: planSlug,
          success_url: `${currentUrl}?success=true`,
          cancel_url: `${currentUrl}?canceled=true`,
        }),
      }
    );
    window.location.href = response.checkout_url;
  };

  const openPortal = async () => {
    const response = await fetchApi<{ portal_url: string }>(
      '/api/billing/portal',
      {
        method: 'POST',
      }
    );
    window.location.href = response.portal_url;
  };

  return {
    plans,
    subscription,
    entitlements,
    usage,
    loading,
    error,
    createCheckoutSession,
    openPortal,
    reload: loadBilling,
  };
}
