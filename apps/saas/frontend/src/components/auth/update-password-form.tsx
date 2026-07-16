'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Zap,
} from 'lucide-react';

export function UpdatePasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const passwordChecks = useMemo(
    () => ({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      match: password.length > 0 && password === confirmPassword,
    }),
    [confirmPassword, password],
  );

  const passwordValid =
    passwordChecks.length &&
    passwordChecks.uppercase &&
    passwordChecks.number &&
    passwordChecks.match;

  useEffect(() => {
    let cancelled = false;

    async function initializeRecoverySession() {
      setError(null);

      const code = new URLSearchParams(window.location.search).get('code');
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error && !cancelled) {
          setError(error.message);
        }
      }

      const hashParams = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error && !cancelled) {
          setError(error.message);
        } else {
          window.history.replaceState(null, '', window.location.pathname);
        }
      }

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (cancelled) {
        return;
      }

      if (error) {
        setError(error.message);
      } else if (!session) {
        setError('This reset link is invalid or has expired.');
      } else {
        setSessionReady(true);
      }

      setInitializing(false);
    }

    initializeRecoverySession();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!passwordValid) {
      setError('Please meet all password requirements.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center space-y-2">
          <div className="p-3 bg-primary/10 rounded-xl border">
            <Zap className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">SparkTest Cloud</h1>
        </div>

        <Card>
          {success ? (
            <CardContent className="py-8 text-center space-y-4">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
              <h2 className="text-xl font-semibold">Password updated</h2>
              <p className="text-muted-foreground">
                Your password has been changed. You can now sign in with the new
                password.
              </p>
              <Button onClick={() => router.push('/')} className="mt-4">
                Continue to sign in
              </Button>
            </CardContent>
          ) : (
            <>
              <CardHeader className="space-y-1">
                <CardTitle className="text-xl">Create new password</CardTitle>
                <CardDescription>
                  Choose a new password for your SparkTest Cloud account
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                  {(initializing || error) && (
                    <div
                      className={
                        error
                          ? 'p-3 rounded-lg bg-destructive/10 text-destructive text-sm'
                          : 'p-3 rounded-lg bg-muted text-muted-foreground text-sm'
                      }
                    >
                      {initializing ? 'Verifying reset link...' : error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="password">New password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-9 pr-9"
                        required
                        disabled={!sessionReady || loading}
                        autoComplete="new-password"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        disabled={!sessionReady || loading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirm-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-9"
                        required
                        disabled={!sessionReady || loading}
                        autoComplete="new-password"
                      />
                    </div>
                  </div>

                  {password.length > 0 && (
                    <div className="space-y-1 text-xs">
                      <PasswordCheck
                        met={passwordChecks.length}
                        label="At least 8 characters"
                      />
                      <PasswordCheck
                        met={passwordChecks.uppercase}
                        label="One uppercase letter"
                      />
                      <PasswordCheck
                        met={passwordChecks.number}
                        label="One number"
                      />
                      <PasswordCheck
                        met={passwordChecks.match}
                        label="Passwords match"
                      />
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={!sessionReady || loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update password'
                    )}
                  </Button>
                  <button
                    type="button"
                    onClick={() => router.push('/')}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Back to sign in
                  </button>
                </CardFooter>
              </form>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

function PasswordCheck({ met, label }: { met: boolean; label: string }) {
  return (
    <div
      className={`flex items-center gap-1.5 ${
        met ? 'text-green-600' : 'text-muted-foreground'
      }`}
    >
      <div
        className={`h-1.5 w-1.5 rounded-full ${
          met ? 'bg-green-500' : 'bg-muted-foreground/40'
        }`}
      />
      {label}
    </div>
  );
}
