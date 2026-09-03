'use client';

import { useState, useEffect } from 'react';
import { Plan, apiService, CheckoutRequest } from '@/lib/api';
import { API_BASE_URL } from '@/lib/api-config';
import { supabase } from '@/lib/supabase';

type BillingStatus = {
  plan_slug: string;
  plan_name: string;
};

async function getAuthHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};
}

export function useBilling() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        setLoading(true);
        const [fetchedPlans, fetchedStatus] = await Promise.all([
          apiService.getPlans(),
          getAuthHeaders()
            .then((headers) =>
              fetch(`${API_BASE_URL}/api/billing/status`, {
                headers: { 'Content-Type': 'application/json', ...headers },
              }).then((response) => {
                if (!response.ok)
                  throw new Error(`API error: ${response.status}`);
                return response.json() as Promise<BillingStatus>;
              })
            )
            .catch(() => null),
        ]);
        setPlans(fetchedPlans);
        setStatus(fetchedStatus);
        setError(null);
      } catch (err) {
        console.error('Failed to load plans:', err);
        setError('Failed to load plans');
      } finally {
        setLoading(false);
      }
    };

    loadPlans();
  }, []);

  const createCheckoutSession = async (planSlug: string) => {
    try {
      const currentUrl = window.location.origin;
      const request: CheckoutRequest = {
        plan_slug: planSlug,
        success_url: `${currentUrl}?success=true`,
        cancel_url: `${currentUrl}?canceled=true`,
      };

      const response = await apiService.createCheckoutSession(request);

      // Redirect to Stripe Checkout
      window.location.href = response.checkout_url;
    } catch (err) {
      console.error('Failed to create checkout session:', err);
      throw err;
    }
  };

  return {
    plans,
    status,
    loading,
    error,
    createCheckoutSession,
  };
}
