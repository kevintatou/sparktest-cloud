#!/bin/bash
# Clean up non-MVP issues automatically

set -e

REPO="kevintatou/sparktest-cloud"

echo "🧹 Cleaning up old non-MVP issues..."

# Define non-MVP issues to close (these are scope creep or not critical for launch)
NON_MVP_ISSUES=(
  22  # RBAC - not needed for MVP
  20  # Improve MCP and default instructions - not MVP critical
  17  # Add workflow files and unit tests - can do later
  13  # Deployment Pipeline: Droplet → DOKS - not MVP critical
  11  # Webhook Integrations (Slack, Teams) - nice to have
  10  # Add Observability (OpenTelemetry) - can add post-MVP
  9   # [#11] Implement Organization Management - complex, not MVP
  8   # Add Feature Flags for SaaS Features - over-engineering for MVP
  7   # Implement Live Logs Streaming - nice to have
  6   # UI and backend for multi tenancy and control plane - too complex for MVP
  5   # Implement Supabase Auth (Frontend) and Add Auth Middleware (Backend) - can use simple auth for MVP
  4   # Sequential / Parallel running in a test suite - already working
  3   # Add Webhook Support for GitHub Sync - nice to have
  1   # Verify backend logic for run creation via CRD/standalone config - backend already works
)

echo "Closing non-MVP issues..."
for issue in "${NON_MVP_ISSUES[@]}"; do
  echo "Closing issue #$issue as non-MVP..."
  gh issue close $issue --repo $REPO --comment "🎯 Closing as part of MVP focus. This feature is not critical for initial launch and adds unnecessary complexity. Will revisit post-MVP launch.

Tagged for future consideration after MVP is stable and generating revenue." || echo "Issue #$issue might already be closed or not exist"
done

echo "✅ Cleanup complete!"
echo "📊 Remaining open issues:"
gh issue list --repo $REPO --state open --json number,title,labels
