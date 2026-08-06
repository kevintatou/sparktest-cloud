# SparkTest Cloud Product Demo Walkthrough

This is the script and runbook for a short product walkthrough aimed at someone
who wants to understand what SparkTest Cloud does and how they would use it.

## Goal

Show that SparkTest Cloud is a hosted control plane for defining tests,
organizing execution, connecting agents, and managing operational concerns like
billing, CI, routing, and access control.

Keep the demo practical. The viewer should leave with this mental model:

> I create definitions in SparkTest Cloud, connect agents where my code runs,
> organize runs into suites and schedules, then monitor everything from one
> dashboard.

## Audience

- Engineering founders validating test infrastructure.
- DevOps/platform engineers who need a lightweight test orchestration layer.
- Developers who want cloud coordination without giving up private execution.

## Recording Setup

Run the production demo recording from the repository root:

```bash
pnpm e2e:record:prod
```

The script records a 1280x720 authenticated walkthrough and saves:

```text
test-results/demo-recording-recordable-product-walkthrough-chromium-demo/video.webm
test-results/demo-recording-recordable-product-walkthrough-chromium-demo/video.mp4
```

Use the MP4 for LinkedIn or product posts.

## Walkthrough Structure

Target length: 45-75 seconds for the final edited version.

The current automated clip is intentionally shorter. Use this document as the
voiceover/script for a richer take, or extend `e2e/demo-recording.spec.ts` with
the same sequence.

## Manuscript

### 1. Open With The Problem

On screen:

- Login to SparkTest Cloud.
- Land on the dashboard.
- Show summary cards for definitions, recent runs, executors, and suites.

Narration:

> SparkTest Cloud is a control plane for test execution. Instead of scattering
> test definitions, runners, schedules, and logs across different systems, you
> manage the workflow from one dashboard.

Talking points:

- The dashboard is the operational overview.
- Definitions are the things you want to run.
- Executors and agents are where the work happens.
- Suites and schedules turn single checks into repeatable workflows.

### 2. Create A Test Definition

On screen:

- Open `Definitions`.
- Click `Create Definition`.
- Fill a realistic definition:
  - Name: `Checkout smoke test`
  - Description: `Validates the critical checkout path`
  - Language: `JavaScript`
  - Code:

```js
await page.goto('/checkout');
await expect(page.getByRole('button', { name: 'Pay' })).toBeVisible();
```

Narration:

> A definition describes what should run. This can be a smoke test, an API
> check, a browser flow, or any command your execution environment supports.

Talking points:

- Definitions are reusable.
- They can be grouped into suites.
- They become the unit of execution for manual runs, scheduled runs, or agent
  queues.

### 3. Show Execution Environments

On screen:

- Open `Executors`.
- Show or create an executor such as `Production browser runner`.
- Mention local Docker, Kubernetes, cloud Docker, GitHub Actions, etc.

Narration:

> Execution stays flexible. You can model the environment that should run the
> test, whether that is local Docker, Kubernetes, CI, or your own connected
> infrastructure.

Talking points:

- SparkTest Cloud is not just a form builder.
- It separates control-plane coordination from where tests actually execute.
- This matters when teams want private runners but cloud visibility.

### 4. Organize With Suites

On screen:

- Open `Suites`.
- Create or show a suite like `Release readiness`.
- Select one or more definitions.

Narration:

> Suites let you bundle related definitions into a repeatable workflow. A
> release suite might include checkout, auth, billing, and deployment checks.

Talking points:

- Suites are how repeated groups of tests become product workflows.
- Sequential and parallel execution modes communicate intent.
- This is the bridge from one-off checks to operational test plans.

### 5. Review Runs

On screen:

- Open `Runs`.
- Show the empty state or existing run history.

Narration:

> Runs give the team an execution history. As agents pick up work, this becomes
> the place to inspect status, retry failures, and understand what changed.

Talking points:

- The runs page is the history/audit surface for test execution.
- Future demo clips should show a completed run with logs once agents are live.

### 6. Connect Agents

On screen:

- Open `Agents`.
- Show onboarding or token management.

Narration:

> Agents connect your infrastructure to SparkTest Cloud. The cloud app queues
> and tracks work, while agents execute in the environment you control.

Talking points:

- This is the important product distinction.
- Cloud coordination, private execution.
- Useful for teams that do not want test workloads running in a black box.

### 7. Show Cloud Operations

On screen:

- Open `Billing & Plans`.
- Open `CI / Schedules`.
- Open `Routing`.
- Open `Security`.

Narration:

> Around the execution workflow, SparkTest Cloud includes the operational pieces
> teams expect: plan limits, CI schedules, environment routing, roles, audit
> logs, and API keys.

Talking points:

- Billing shows the SaaS control-plane model.
- CI schedules turn checks into automation.
- Routing targets the right environment or agent.
- Security is where access control and auditability live.

### 8. Close With The Product Promise

On screen:

- Return to the dashboard.

Narration:

> The end goal is simple: define tests once, run them where they belong, and
> keep the whole team aligned from one cloud dashboard.

Closing text for post:

> Building SparkTest Cloud: hosted test orchestration with private agents,
> suites, schedules, routing, and auditability.

## LinkedIn Post Draft

```text
I have been working on SparkTest Cloud: a hosted control plane for test
execution.

The idea is simple:
- define tests in one place
- run them through agents in your own infrastructure
- group checks into suites
- schedule and route execution
- keep billing, security, and audit trails in the same workflow

This is still early, but the core product loop is now testable end-to-end:
auth, profiles, definitions, executors, suites, agents, billing, CI schedules,
routing, and security.

Next step: richer agent execution demos with real run logs.
```

## Manual Recording Checklist

Before recording:

- Production frontend deploy is Ready.
- Render API health returns 200.
- Supabase test user can log in.
- `pnpm e2e:prod` passes.
- Browser viewport is 1280x720 or 1920x1080.
- No sensitive account email or keys are visible in the final crop.

During recording:

- Move slowly enough that each screen is readable.
- Avoid showing browser UI if possible.
- Pause on dashboard, definitions, agents, and security.
- Do not create too many throwaway objects on the production project.

After recording:

- Use `video.mp4` for upload.
- Trim dead time at the beginning/end.
- Add captions from the manuscript above.
- If posting publicly, avoid showing real customer data or internal secrets.

## Future Demo Improvements

- Seed a dedicated demo project with realistic definitions and run history.
- Add a completed run with logs and status transitions.
- Add a connected demo agent so the agent page shows live state.
- Add text overlays in post-production:
  - `Define tests`
  - `Run on private agents`
  - `Group into suites`
  - `Schedule and route execution`
  - `Audit and control access`
