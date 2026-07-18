# Vercel Preview Deployments

SparkTest Cloud deploys Vercel previews from pull requests through
`.github/workflows/deploy-vercel.yml`. Vercel's automatic GitHub integration is
disabled in `vercel.json`, so previews are created only by this workflow.

## Required GitHub Secrets

Add these repository secrets:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

The Vercel project should point at this repository and use the checked-in
`vercel.json` settings.

## Private Preview Access

Enable Vercel Deployment Protection for the SparkTest Cloud project and allow
only your Vercel user or team. That is what makes PR preview URLs require Vercel
login before anyone can view the app.

Keep the GitHub Actions secrets unavailable to forks. The workflow already skips
forked pull requests because they cannot safely receive deployment credentials.
