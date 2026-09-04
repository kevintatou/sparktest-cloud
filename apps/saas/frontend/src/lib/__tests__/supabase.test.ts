const mockCreateClient = jest.fn(() => ({}));

jest.mock('@supabase/supabase-js', () => ({
  createClient: mockCreateClient,
}));

describe('Supabase client', () => {
  beforeEach(() => {
    jest.resetModules();
    mockCreateClient.mockClear();
  });

  it('uses PKCE for email confirmation and password recovery links', async () => {
    await import('@/lib/supabase');

    expect(mockCreateClient).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      {
        auth: {
          detectSessionInUrl: true,
          flowType: 'pkce',
        },
      }
    );
  });
});
