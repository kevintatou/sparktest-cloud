'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { LoginForm } from './login-form';
import { SignUpForm } from './signup-form';
import { ResetPasswordForm } from './reset-password-form';
import { Loader2, Zap } from 'lucide-react';

type AuthView = 'login' | 'signup' | 'reset';

interface AuthGateProps {
  children: React.ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const { user, loading } = useAuth();
  const [view, setView] = useState<AuthView>('login');

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <div className="p-3 bg-primary/10 rounded-xl border">
          <Zap className="h-8 w-8 text-primary" />
        </div>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    switch (view) {
      case 'signup':
        return <SignUpForm onSwitchToLogin={() => setView('login')} />;
      case 'reset':
        return <ResetPasswordForm onSwitchToLogin={() => setView('login')} />;
      default:
        return (
          <LoginForm
            onSwitchToSignUp={() => setView('signup')}
            onSwitchToReset={() => setView('reset')}
          />
        );
    }
  }

  return <>{children}</>;
}
