import { ApiService, Plan } from '@/lib/api';

// Mock fetch
global.fetch = jest.fn();

describe('ApiService', () => {
  let apiService: ApiService;

  beforeEach(() => {
    apiService = new ApiService();
    jest.clearAllMocks();
  });

  describe('getPlans', () => {
    it('should fetch plans successfully', async () => {
      const mockPlans: Plan[] = [
        {
          id: '1',
          slug: 'free',
          price_cents: 0,
          features: { max_tests: 5 },
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
        {
          id: '2',
          slug: 'pro',
          price_cents: 2900,
          features: { max_tests: 'unlimited' },
          stripe_price_id: 'price_123',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPlans,
      });

      const result = await apiService.getPlans();

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/billing/plans',
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
      expect(result).toEqual(mockPlans);
    });

    it('should handle fetch error', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(apiService.getPlans()).rejects.toThrow(
        'API error: 500 Internal Server Error'
      );
    });
  });

  describe('createCheckoutSession', () => {
    it('should create checkout session successfully', async () => {
      const mockResponse = {
        checkout_url: 'https://checkout.stripe.com/pay/test123',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const request = {
        plan_slug: 'pro',
        success_url: 'http://localhost:3000/success',
        cancel_url: 'http://localhost:3000/cancel',
      };

      const result = await apiService.createCheckoutSession(request);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/billing/checkout',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle checkout creation error', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const request = {
        plan_slug: 'invalid',
      };

      await expect(apiService.createCheckoutSession(request)).rejects.toThrow(
        'API error: 404 Not Found'
      );
    });
  });
});