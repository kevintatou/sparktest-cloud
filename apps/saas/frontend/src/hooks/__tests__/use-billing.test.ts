import { renderHook, act, waitFor } from '@testing-library/react';
import { useBilling } from '../use-billing';

// Mock the API service
jest.mock('@/lib/api', () => ({
  apiService: {
    getPlans: jest.fn(),
    createCheckoutSession: jest.fn(),
  },
}));

// Import the mocked module to get access to the mock functions
import { apiService } from '@/lib/api';
const mockApiService = apiService as jest.Mocked<typeof apiService>;

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    origin: 'http://localhost:3000',
    href: 'http://localhost:3000',
  },
  writable: true,
});

describe('useBilling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should load plans on mount', async () => {
    const mockPlans = [
      {
        id: '1',
        slug: 'free',
        price_cents: 0,
        features: { cloud_agent_tokens: 1, seats: 1 },
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      },
      {
        id: '2',
        slug: 'pro',
        price_cents: 2900,
        features: { cloud_agent_tokens: 10, seats: 5 },
        stripe_price_id: 'price_123',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      },
    ];

    mockApiService.getPlans.mockResolvedValueOnce(mockPlans);

    const { result } = renderHook(() => useBilling());

    // Initially loading should be true
    expect(result.current.loading).toBe(true);
    expect(result.current.plans).toEqual([]);
    expect(result.current.error).toBeNull();

    // Wait for the plans to load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.plans).toEqual(mockPlans);
    expect(result.current.error).toBeNull();
    expect(mockApiService.getPlans).toHaveBeenCalledTimes(1);
  });

  it('should handle error when loading plans fails', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockApiService.getPlans.mockRejectedValueOnce(new Error('API Error'));

    const { result } = renderHook(() => useBilling());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.plans).toEqual([]);
    expect(result.current.error).toBe('Failed to load plans');
    expect(consoleError).toHaveBeenCalledWith('Failed to load plans:', expect.any(Error));

    consoleError.mockRestore();
  });

  it('should create checkout session successfully', async () => {
    const mockPlans = [
      {
        id: '1',
        slug: 'free',
        price_cents: 0,
        features: { cloud_agent_tokens: 1, seats: 1 },
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      },
    ];

    mockApiService.getPlans.mockResolvedValueOnce(mockPlans);
    mockApiService.createCheckoutSession.mockResolvedValueOnce({
      checkout_url: 'https://checkout.stripe.com/pay/test123',
    });

    const { result } = renderHook(() => useBilling());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.createCheckoutSession('pro');
    });

    expect(mockApiService.createCheckoutSession).toHaveBeenCalledWith({
      plan_slug: 'pro',
      success_url: 'http://localhost:3000?success=true',
      cancel_url: 'http://localhost:3000?canceled=true',
    });
  });

  it('should handle checkout session creation error', async () => {
    const mockPlans = [
      {
        id: '1',
        slug: 'free',
        price_cents: 0,
        features: { cloud_agent_tokens: 1, seats: 1 },
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      },
    ];

    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockApiService.getPlans.mockResolvedValueOnce(mockPlans);
    mockApiService.createCheckoutSession.mockRejectedValueOnce(
      new Error('Checkout failed')
    );

    const { result } = renderHook(() => useBilling());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await expect(
      act(async () => {
        await result.current.createCheckoutSession('invalid');
      })
    ).rejects.toThrow('Checkout failed');

    expect(consoleError).toHaveBeenCalledWith(
      'Failed to create checkout session:',
      expect.any(Error)
    );

    consoleError.mockRestore();
  });
});