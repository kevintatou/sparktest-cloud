'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useBilling } from '@/hooks/use-billing';
import { useToast } from '@/hooks/use-toast';
import { Plan } from '@/lib/api';
import { Check, Loader2 } from 'lucide-react';

export function BillingSection() {
  const { plans, status, loading, error, createCheckoutSession } = useBilling();
  const { toast } = useToast();
  const [upgrading, setUpgrading] = useState<string | null>(null);

  useEffect(() => {
    // Check for success/cancel parameters in URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      toast({
        title: 'Subscription activated!',
        description: 'Welcome to your new plan. Your upgrade is now active.',
      });
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
    if (urlParams.get('canceled') === 'true') {
      toast({
        title: 'Checkout canceled',
        description: 'Your upgrade was canceled. You can try again anytime.',
        variant: 'destructive',
      });
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [toast]);

  const handleUpgrade = async (planSlug: string) => {
    try {
      setUpgrading(planSlug);
      await createCheckoutSession(planSlug);
    } catch (error) {
      console.error('Upgrade failed:', error);
      toast({
        title: 'Upgrade failed',
        description: 'Failed to start checkout process. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUpgrading(null);
    }
  };

  const formatPrice = (priceCents: number) => {
    if (priceCents === 0) return 'Free';
    return `$${(priceCents / 100).toFixed(2)}/mo`;
  };

  const formatFeatures = (features: Record<string, any>) => {
    const featureList: string[] = [];

    if (features.max_projects) {
      featureList.push(
        `${features.max_projects} project${features.max_projects === 1 ? '' : 's'}`
      );
    }
    if (features.cloud_agent_tokens) {
      featureList.push(
        `${features.cloud_agent_tokens} active agent token${features.cloud_agent_tokens === 1 ? '' : 's'}`
      );
    }

    return featureList;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading plans...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            Failed to load billing plans
          </p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-primary/40 bg-primary/5">
        <CardContent className="flex flex-col gap-1 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Current project plan
            </p>
            <p className="text-2xl font-bold">
              {status?.plan_name ?? 'Free'} Plan
            </p>
          </div>
          <Badge variant="outline">
            {status?.plan_slug === 'pro' ? 'Active' : 'Included'}
          </Badge>
        </CardContent>
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        {plans
          .filter((plan) => plan.slug === 'free')
          .map((plan) => (
            <Card
              key={plan.id}
              className={plan.slug === 'pro' ? 'border-primary' : ''}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="capitalize">{plan.slug} Plan</CardTitle>
                  {plan.slug === 'pro' && (
                    <Badge variant="default">Popular</Badge>
                  )}
                </div>
                <div className="text-3xl font-bold">
                  {formatPrice(plan.price_cents)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <ul className="space-y-2">
                    {formatFeatures(plan.features).map((feature, index) => (
                      <li key={index} className="flex items-center text-sm">
                        <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {status?.plan_slug === plan.slug ? (
                    <Button variant="outline" className="w-full" disabled>
                      Included
                    </Button>
                  ) : plan.price_cents > 0 ? (
                    <Button
                      className="w-full"
                      onClick={() => handleUpgrade(plan.slug)}
                      disabled={upgrading === plan.slug}
                    >
                      {upgrading === plan.slug ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Upgrading...
                        </>
                      ) : (
                        'Upgrade'
                      )}
                    </Button>
                  ) : (
                    <Button variant="outline" className="w-full" disabled>
                      Current Plan
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
}
