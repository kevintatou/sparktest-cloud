# SparkTest Cloud E2E

Playwright tests live in this folder and run from the repo root.

## Smoke Checks

```bash
pnpm e2e
pnpm e2e:prod
```

`pnpm e2e` starts the local frontend on port 3300 and loads root `.env` first.
`pnpm e2e:prod` runs against `https://sparktest-cloud-frontend.vercel.app`.

## Authenticated Checks

The dashboard login flow is skipped unless a test account is supplied:

```bash
E2E_EMAIL=test@example.com E2E_PASSWORD='password' pnpm e2e:prod
```

## Demo Recording

```bash
pnpm e2e:record:prod
```

Videos are saved under `test-results/`. Open `playwright-report/index.html`
after a run to inspect the test and download the recorded video.

The recording project uses a fixed 1280x720 viewport and deliberately paced
steps so the video is usable as a product walkthrough instead of a fast smoke
test capture.
