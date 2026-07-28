// Minimal analytics abstraction. Uses PostHog when a public key is configured
// via env vars; otherwise events are logged to the console so nothing breaks
// in local dev or when analytics is intentionally left unconfigured.
//
// No names, emails, precise location, or other personal data are ever sent —
// only anonymous gameplay events and numeric metrics.

export type AnalyticsEvent =
  | "page_viewed"
  | "game_started"
  | "game_finished"
  | "play_again_clicked"
  | "score_shared";

export interface GameFinishedProps {
  score_seconds: number;
  personal_best: number;
  estimated_percentile: number;
  run_number: number;
}

type PostHogClient = typeof import("posthog-js").default;

let posthogPromise: Promise<PostHogClient | null> | null = null;

function getPosthog(): Promise<PostHogClient | null> {
  if (posthogPromise) return posthogPromise;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key || typeof window === "undefined") {
    posthogPromise = Promise.resolve(null);
    return posthogPromise;
  }

  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";
  posthogPromise = import("posthog-js")
    .then(({ default: posthog }) => {
      posthog.init(key, { api_host: host, capture_pageview: false, autocapture: false });
      return posthog;
    })
    .catch(() => null);

  return posthogPromise;
}

export function trackEvent(name: AnalyticsEvent, props?: Record<string, unknown>): void {
  getPosthog()
    .then((posthog) => {
      if (posthog) {
        posthog.capture(name, props);
      } else {
        // eslint-disable-next-line no-console
        console.log("[analytics]", name, props ?? {});
      }
    })
    .catch(() => {
      // eslint-disable-next-line no-console
      console.log("[analytics]", name, props ?? {});
    });
}
