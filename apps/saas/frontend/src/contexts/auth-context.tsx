'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import type { AuthResponse } from '@supabase/supabase-js';
import { API_BASE_URL } from '@/lib/api-config';
import { supabase } from '@/lib/supabase';
import { capturePostHog, identifyPostHog } from '@/lib/posthog';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: AuthError | null }>;
  signUp: (
    email: string,
    password: string,
    name?: string
  ) => Promise<{ error: AuthError | null; existingAccount: boolean }>;
  resendConfirmation: (email: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getAppOrigin() {
  if (typeof window === 'undefined') {
    return undefined;
  }

  return window.location.origin;
}

export function isExistingSignupResponse(
  response: AuthResponse
) {
  if (response.error || response.data.session) {
    return false;
  }

  return (
    response.data.user === null ||
    response.data.user.identities?.length === 0
  );
}

async function syncProfile(session: Session | null) {
  if (!session?.access_token || !session.user.email) {
    return;
  }

  const response = await fetch(`${API_BASE_URL}/api/profile`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: session.user.email,
      name:
        typeof session.user.user_metadata?.name === 'string'
          ? session.user.user_metadata.name
          : undefined,
    }),
  });
  if (response.ok) capturePostHog('project_ready');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  });

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    if (
      hashParams.get('type') === 'recovery' &&
      window.location.pathname !== '/reset-password'
    ) {
      window.location.replace(`/reset-password${window.location.hash}`);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState({ user: session?.user ?? null, session, loading: false });
      if (session?.user) identifyPostHog(session.user.id);
      void syncProfile(session);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ user: session?.user ?? null, session, loading: false });
      if (session?.user) identifyPostHog(session.user.id);
      void syncProfile(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, name?: string) => {
      const appOrigin = getAppOrigin();
      const response = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name: name || email.split('@')[0] },
          ...(appOrigin ? { emailRedirectTo: appOrigin } : {}),
        },
      });
      // Supabase returns an obfuscated user with no identities for an existing
      // confirmed account when email confirmation is enabled.
      const existingAccount = isExistingSignupResponse(response);
      if (!response.error && !existingAccount) {
        capturePostHog('signup_completed');
        if (response.data.user) capturePostHog('project_created');
      }
      return { error: response.error, existingAccount };
    },
    []
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const resendConfirmation = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: getAppOrigin(),
      },
    });
    return { error };
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  }, []);

  return (
    <AuthContext.Provider
      value={{ ...state, signIn, signUp, signOut, resetPassword, resendConfirmation }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
