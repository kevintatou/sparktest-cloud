// TEMPORARY / PLACEHOLDER percentile estimate.
//
// There is no real leaderboard backend yet. This maps survival time to a
// rough percentile using a hand-picked, piecewise-linear curve so the
// game-over screen has *something* motivating to show. It is intentionally
// isolated in this one file so it can be swapped for a real backend-driven
// calculation later without touching any other game code.
//
// Anchor points come from the product spec:
//   5s -> 20th, 10s -> 45th, 20s -> 75th, 30s -> 90th, 45s -> 97th, 60s -> 99th.
const ANCHORS: Array<[seconds: number, percentile: number]> = [
  [0, 0],
  [5, 20],
  [10, 45],
  [20, 75],
  [30, 90],
  [45, 97],
  [60, 99],
];

const MAX_PERCENTILE = 99.5;

export function estimatePercentile(seconds: number): number {
  const t = Math.max(0, seconds);

  const [lastT, lastP] = ANCHORS[ANCHORS.length - 1];
  if (t === lastT) {
    return lastP;
  }
  if (t > lastT) {
    return MAX_PERCENTILE;
  }

  for (let i = 0; i < ANCHORS.length - 1; i++) {
    const [t0, p0] = ANCHORS[i];
    const [t1, p1] = ANCHORS[i + 1];
    if (t >= t0 && t <= t1) {
      const ratio = (t - t0) / (t1 - t0);
      return Math.round((p0 + ratio * (p1 - p0)) * 10) / 10;
    }
  }

  return 0;
}
