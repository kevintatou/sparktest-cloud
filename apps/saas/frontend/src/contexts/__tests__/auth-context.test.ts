import { isExistingSignupResponse } from '@/contexts/auth-context';
import type { AuthResponse } from '@supabase/supabase-js';

describe('Supabase signup response handling', () => {
  it('recognizes the obfuscated response for an existing confirmed user', () => {
    const response: AuthResponse = {
      data: {
        user: {
          id: 'obfuscated-user-id',
          app_metadata: {},
          user_metadata: {},
          aud: 'authenticated',
          email: 'dorkylorky94@gmail.com',
          created_at: '2026-09-04T00:00:00Z',
          identities: [],
        },
        session: null,
      },
      error: null,
    };

    expect(isExistingSignupResponse(response)).toBe(true);
  });

  it('does not classify a newly created confirmed-email user as existing', () => {
    const response: AuthResponse = {
      data: {
        user: {
          id: 'new-user-id',
          app_metadata: {},
          user_metadata: {},
          aud: 'authenticated',
          email: 'new@example.com',
          created_at: '2026-09-04T00:00:00Z',
          identities: [
            {
              identity_id: 'email-identity',
              id: 'email-identity',
              user_id: 'new-user-id',
              provider: 'email',
            },
          ],
        },
        session: null,
      },
      error: null,
    };

    expect(isExistingSignupResponse(response)).toBe(false);
  });
});
