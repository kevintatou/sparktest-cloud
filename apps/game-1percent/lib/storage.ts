// Thin, SSR-safe wrapper around localStorage for the two bits of state we
// persist client-side: personal best survival time and run count.

const PERSONAL_BEST_KEY = "onepercent:personal-best";
const RUN_COUNT_KEY = "onepercent:run-count";
const MUTED_KEY = "onepercent:muted";

function hasStorage(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

export function getPersonalBest(): number {
  if (!hasStorage()) return 0;
  const raw = window.localStorage.getItem(PERSONAL_BEST_KEY);
  const value = raw ? parseFloat(raw) : 0;
  return Number.isFinite(value) ? value : 0;
}

/** Stores the score if it beats the current best. Returns the resulting best. */
export function setPersonalBestIfHigher(score: number): number {
  const current = getPersonalBest();
  if (score <= current) return current;
  if (hasStorage()) {
    window.localStorage.setItem(PERSONAL_BEST_KEY, String(score));
  }
  return score;
}

export function getRunCount(): number {
  if (!hasStorage()) return 0;
  const raw = window.localStorage.getItem(RUN_COUNT_KEY);
  const value = raw ? parseInt(raw, 10) : 0;
  return Number.isFinite(value) ? value : 0;
}

export function incrementRunCount(): number {
  const next = getRunCount() + 1;
  if (hasStorage()) {
    window.localStorage.setItem(RUN_COUNT_KEY, String(next));
  }
  return next;
}

export function getMuted(): boolean {
  if (!hasStorage()) return false;
  return window.localStorage.getItem(MUTED_KEY) === "1";
}

export function setMuted(muted: boolean): void {
  if (!hasStorage()) return;
  window.localStorage.setItem(MUTED_KEY, muted ? "1" : "0");
}
