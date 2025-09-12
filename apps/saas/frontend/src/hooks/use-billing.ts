'use client';

import { useState, useEffect } from 'react';
import { Plan, apiService, CheckoutRequest } from '@/lib/api';

export function useBilling() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        setLoading(true);
        const fetchedPlans = await apiService.getPlans();
        setPlans(fetchedPlans);
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
    loading,
    error,
    createCheckoutSession,
  };
}