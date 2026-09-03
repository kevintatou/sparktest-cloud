'use client';

import { FormEvent, useMemo, useState } from 'react';
import { CheckCircle2, KeyRound, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function AccountSettings() {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const valid = useMemo(
    () =>
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /\d/.test(password) &&
      password === confirmation,
    [confirmation, password]
  );

  const updatePassword = async (event: FormEvent) => {
    event.preventDefault();
    setMessage(null);
    setError(null);
    if (!valid) {
      setError(
        'Use at least 8 characters, one uppercase letter, and one number.'
      );
      return;
    }

    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setPassword('');
    setConfirmation('');
    setMessage('Password updated successfully.');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Manage your SparkTest account.</p>
      </div>
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Change password
          </CardTitle>
          <CardDescription>
            Set a new password for your signed-in account.
          </CardDescription>
        </CardHeader>
        <form onSubmit={updatePassword}>
          <CardContent className="space-y-4">
            {message && (
              <div className="flex items-center gap-2 rounded-md bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
                {message}
              </div>
            )}
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="settings-password">New password</Label>
              <Input
                id="settings-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="settings-password-confirmation">
                Confirm new password
              </Label>
              <Input
                id="settings-password-confirmation"
                type="password"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Update password
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
