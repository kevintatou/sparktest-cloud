'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSubscriptions, Plan } from '@/hooks/use-subscriptions';
import { useToast } from '@/hooks/use-toast';
import { Check, Loader2, AlertTriangle, ExternalLink } from 'lucide-react';

function formatPrice(cents: number, interval: string) {
  if (cents === 0) return 'Free';
  return `$${(cents / 100).toFixed(0)}/${interval === 'year' ? 'yr' : 'mo'}`;
}

function featureList(plan: Plan): string[] {
  const f = plan.features;
  const items: string[] = [];
  if (f.max_projects) items.push(f.max_projects === -1 ? 'Unlimited projects' : `${f.max_projects} project${f.max_projects === 1 ? '' : 's'}`);
  if (f.max_agents) items.push(f.max_agents === -1 ? 'Unlimited agents' : `${f.max_agents} cloud agent${f.max_agents === 1 ? '' : 's'}`);
  if (f.seats) items.push(`${f.seats} seat${f.seats === 1 ? '' : 's'}`);
  if (f.runs_per_day) items.push(f.runs_per_day === -1 ? 'Unlimited runs' : `${f.runs_per_day} runs/day`);
  if (f.log_retention_days) items.push(`${f.log_retention_days}-day log retention`);
  if (f.result_storage_gb) items.push(`${f.result_storage_gb}GB storage`);
  if (f.webhooks) items.push('Webhooks');
  if (f.schedules) items.push('Scheduled runs');
  if (f.audit_log) items.push('Audit log');
  if (f.sso) items.push('SSO / SAML');
  if (f.rbac) items.push('Role-based access');
  if (f.support) items.push(`${f.support.charAt(0).toUpperCase() + f.support.slice(1)} support`);
  return items;
}

export function BillingPlans() {
  const { plans, subscription, entitlements, usage, loading, error, createCheckoutSession, openPortal } = useSubscriptions();
  const { toast } = useToast();
  const [upgrading, setUpgrading] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      toast({ title: 'Subscription activated!', description: 'Welcome to your new plan.' });
      window.history.replaceState({}, '', window.location.pathname);
    }
    if (params.get('canceled') === 'true') {
      toast({ title: 'Checkout canceled', description: 'You can try again anytime.', variant: 'destructive' });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [toast]);

  const handleUpgrade = async (slug: string) => {
    try {
      setUpgrading(slug);
      await createCheckoutSession(slug);
    } catch {
      toast({ title: 'Upgrade failed', description: 'Could not start checkout.', variant: 'destructive' });
    } finally {
      setUpgrading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">Loading billing…</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <AlertTriangle className="h-8 w-8 mx-auto mb-3 text-destructive" />
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  const currentSlug = subscription?.plan_slug || 'free';

  return (
    <div className="space-y-8">
      {/* Current plan banner */}
      {subscription && subscription.status !== 'canceled' && (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-5 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Current plan</p>
              <p className="text-xl font-bold capitalize">{subscription.plan_name}</p>
              {subscription.current_period_end && (
                <p className="text-xs text-muted-foreground mt-1">
                  {subscription.cancel_at_period_end ? 'Cancels' : 'Renews'}{' '}
                  {new Date(subscription.current_period_end).toLocaleDateString()}
                </p>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={openPortal} className="gap-2">
              <ExternalLink className="h-3.5 w-3.5" />
              Manage in Stripe
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Plan cards */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {plans.filter(p => p.is_active).sort((a, b) => a.sort_order - b.sort_order).map(plan => {
          const isCurrent = plan.slug === currentSlug;
          const isPopular = plan.slug === 'pro';
          return (
            <Card key={plan.id} className={isPopular ? 'border-primary ring-1 ring-primary/20' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  {isPopular && <Badge>Popular</Badge>}
                  {isCurrent && <Badge variant="outline">Current</Badge>}
                </div>
                <p className="text-3xl font-bold mt-2">
                  {formatPrice(plan.price_cents, plan.billing_interval)}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {featureList(plan).map((feat, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                  <Button variant="outline" className="w-full" disabled>Current Plan</Button>
                ) : plan.price_cents === 0 ? (
                  <Button variant="ghost" className="w-full" disabled>Free Tier</Button>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => handleUpgrade(plan.slug)}
                    disabled={upgrading === plan.slug}
                  >
                    {upgrading === plan.slug ? (
                      <><Loader2 className="h-4 w-4 animate-spin mr-2" />Upgrading…</>
                    ) : (
                      isCurrent ? 'Current' : 'Upgrade'
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Usage summary */}
      <Card>
        <CardHeader>
          <CardTitle>Current Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <UsageStat
              label="Agents"
              value={entitlements ? `${usage[0]?.agent_count ?? 0}` : '—'}
              limit={entitlements?.max_agents === -1 ? '∞' : `${entitlements?.max_agents ?? '?'}`}
            />
            <UsageStat
              label="Seats"
              value={entitlements ? `${usage[0]?.seat_count ?? 0}` : '—'}
              limit={entitlements?.max_seats === -1 ? '∞' : `${entitlements?.max_seats ?? '?'}`}
            />
            <UsageStat
              label="Runs today"
              value={entitlements ? `${usage[0]?.run_count ?? 0}` : '—'}
              limit={entitlements?.max_runs_per_day === -1 ? '∞' : `${entitlements?.max_runs_per_day ?? '?'}`}
            />
            <UsageStat
              label="Storage"
              value={entitlements ? formatBytes(usage[0]?.storage_bytes ?? 0) : '—'}
              limit={entitlements ? formatBytes(entitlements.storage_bytes) : '?'}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function UsageStat({ label, value, limit }: { label: string; value: string; limit: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">of {limit}</p>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
