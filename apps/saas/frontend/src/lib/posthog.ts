import posthog from 'posthog-js';

let initialized = false;

export function initPostHog() {
  if (initialized || typeof window === 'undefined') return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;

  posthog.init(key, {
    api_host:
      process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    capture_pageview: false,
    capture_pageleave: true,
  });
  initialized = true;
}

export function identifyPostHog(userId: string) {
  initPostHog();
  if (initialized) posthog.identify(userId);
}

export function capturePostHog(
  event: string,
  properties?: Record<string, string | number | boolean | null>
) {
  initPostHog();
  if (initialized) posthog.capture(event, properties);
}
