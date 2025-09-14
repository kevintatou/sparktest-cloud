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

// Auth types
export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface Organization {
  id: string;
  name: string;
  role: 'Owner' | 'Member';
}

export interface SignupRequest {
  email: string;
  password: string;
  name?: string;
  organization_name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  organization_id?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  organization?: Organization;
}

export interface InviteMemberRequest {
  email: string;
  role: 'Owner' | 'Member';
}

export class ApiService {
  private token: string | null = null;

  constructor() {
    // Initialize token from localStorage if available
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token);
      } else {
        localStorage.removeItem('auth_token');
      }
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        ...headers,
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token is invalid, clear it
        this.setToken(null);
        throw new Error('Unauthorized - please log in again');
      }
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Auth methods
  async signup(request: SignupRequest): Promise<AuthResponse> {
    const response = await this.fetchApi<AuthResponse>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    this.setToken(response.token);
    return response;
  }

  async login(request: LoginRequest): Promise<AuthResponse> {
    const response = await this.fetchApi<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    this.setToken(response.token);
    return response;
  }

  async logout(): Promise<void> {
    try {
      await this.fetchApi('/api/auth/logout', { method: 'POST' });
    } finally {
      this.setToken(null);
    }
  }

  async getMe(): Promise<any> {
    return this.fetchApi('/api/auth/me');
  }

  async switchOrganization(orgId: string): Promise<AuthResponse> {
    const response = await this.fetchApi<AuthResponse>(`/api/auth/switch-org/${orgId}`, {
      method: 'POST',
    });
    this.setToken(response.token);
    return response;
  }

  // Organization methods
  async getUserOrganizations(): Promise<Organization[]> {
    return this.fetchApi<Organization[]>('/api/organizations');
  }

  async createOrganization(name: string): Promise<Organization> {
    return this.fetchApi<Organization>('/api/organizations', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  async getOrganizationMembers(orgId: string): Promise<any[]> {
    return this.fetchApi<any[]>(`/api/organizations/${orgId}/members`);
  }

  async inviteMember(orgId: string, request: InviteMemberRequest): Promise<any> {
    return this.fetchApi(`/api/organizations/${orgId}/members`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async removeMember(orgId: string, userId: string): Promise<void> {
    await this.fetchApi(`/api/organizations/${orgId}/members/${userId}`, {
      method: 'DELETE',
    });
  }

  // Billing methods
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