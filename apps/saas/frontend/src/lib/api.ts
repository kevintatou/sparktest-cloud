import { supabase } from './supabase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Plan {
  id: string;
  slug: string;
  price_cents: number;
  features: Record<string, any>;
  stripe_price_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CheckoutRequest {
  plan_slug: string;
  success_url?: string;
  cancel_url?: string;
}

export interface CheckoutResponse {
  checkout_url: string;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    return { Authorization: `Bearer ${session.access_token}` };
  }
  return {};
}

export class ApiService {
  private async fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
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

    return response.json();
  }

  async getPlans(): Promise<Plan[]> {
    return this.fetchApi<Plan[]>('/api/billing/plans');
  }

  async createCheckoutSession(request: CheckoutRequest): Promise<CheckoutResponse> {
    return this.fetchApi<CheckoutResponse>('/api/billing/checkout', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }
}

export const apiService = new ApiService();
