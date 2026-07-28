# 1% — a tiny survival prototype

A minimalist browser game: control a dot in a full-screen arena and survive
longer than 99% of players while dodging obstacles that get harder over time.

## What this prototype is testing

This is a scrappy, single-mechanic experiment, not a finished game. It exists
to answer one question: **is the core "survive and beat your percentile"
loop compelling enough that people play more than once and tell a friend?**
Everything else (accounts, shops, cosmetics, a real leaderboard) is
deliberately left out until that's proven.

## Success metric

**Primary:** at least 60% of players who finish one run start another run
(`play_again_clicked` or a repeat `game_started` following a `game_finished`,
divided by total finishers).

**Secondary:**
- Average runs per visitor.
- Median survival time.
- Share rate (`score_shared` / `game_finished`).
- Percentage of visitors who start a game (`game_started` / `page_viewed`).

## How to run it

```bash
# from the monorepo root
pnpm install
pnpm --filter @tatou/game-1percent dev
```

Then open http://localhost:3000. Move the mouse (or drag a finger on touch
devices) to steer the dot; avoid rectangles, lasers, and the shrinking safe
zone for as long as you can.

Other scripts (run from `apps/game-1percent`, or via `pnpm --filter
@tatou/game-1percent <script>` from the root):

```bash
pnpm build        # production build
pnpm start        # run the production build
pnpm lint         # next lint
pnpm type-check   # tsc --noEmit
pnpm test         # vitest run
```

## Configuring PostHog (optional)

Analytics uses PostHog when a public project key is present, and otherwise
logs events to the browser console — the game works identically either way.

Set these in `.env.local` (see `.env.local.example`):

```
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxx
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

No names, emails, precise location, or other personal data are ever sent —
only the anonymous events below.

## Analytics events recorded

| Event | When | Extra properties |
|---|---|---|
| `page_viewed` | On page load | — |
| `game_started` | A run begins (first play or play again) | — |
| `game_finished` | A run ends (collision) | `score_seconds`, `personal_best`, `estimated_percentile`, `run_number` |
| `play_again_clicked` | Player taps "Play again" on the game-over screen | — |
| `score_shared` | Player taps "Share score" | `score_seconds` |

Percentile is a **placeholder** — see `game/percentile.ts`. It's a
hand-picked curve, not a real global statistic, and the UI says so
("Estimated percentile during beta"). It's isolated in one file so it can be
swapped for a real backend-driven calculation later without touching any
other game code.

## Deploying to Vercel

This app lives in a pnpm workspace, so point Vercel at the monorepo root and
set:

- **Root Directory:** `apps/game-1percent`
- **Build Command:** `pnpm build` (or leave default; Vercel auto-detects Next.js)
- **Install Command:** `pnpm install`

Add the environment variables above (`NEXT_PUBLIC_POSTHOG_KEY`,
`NEXT_PUBLIC_POSTHOG_HOST`) in the Vercel project settings if you want
PostHog analytics — never commit real keys to the repo.

## Known limitations

- No real backend or leaderboard; percentile is an estimate (by design, for
  this prototype).
- Personal best and run count are per-browser (`localStorage`), not
  account-bound.
- Sound effects are short WebAudio beeps generated in code, not audio
  assets, and stay silent if the browser blocks audio — the game still
  works either way.
- Obstacle placement is randomized per run; there's no seeded/deterministic
  replay yet.
