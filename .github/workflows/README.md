# GitHub Workflows

This directory contains the GitHub Actions workflows for the SparkTest Cloud project.

## CI Workflow (`ci.yml`)

Runs on every push and pull request to main/develop branches:
- Builds TypeScript packages and Next.js frontend
- Runs type checking
- Builds and tests Rust backend

## Publish Agent Image (`publish-agent-image.yml`)

Publishes the SparkTest agent container to GitHub Container Registry:

- Image: `ghcr.io/kevintatou/sparktest-agent`
- Tags: `latest` on `main`, plus `sha-<commit>`
- Triggered when agent/backend Rust files or the image workflow change

After the package is public in GHCR, set the frontend environment variable:

```bash
NEXT_PUBLIC_AGENT_IMAGE=ghcr.io/kevintatou/sparktest-agent:latest
```

The frontend only shows Docker/Kubernetes install instructions when this image
variable is configured.

## Auto-advance Copilot Workflow (`auto-advance-copilot.yml`)

Automatically advances Copilot through epic checklists when PRs are merged:

### How it works:
1. Triggers when the CI workflow completes successfully
2. Finds PRs associated with the successful workflow run
3. Extracts closed issues from PR descriptions (supports `Closes #123`, `Fixes #123`, etc.)
4. Finds epic issues (labeled `epic`) that contain the closed child issue
5. **Updates the epic's checklist** to mark the completed issue as checked (`- [ ]` → `- [x]`)
6. Parses the epic's markdown checklist to find the next unchecked, open issue
7. Assigns that issue to the Copilot agent
8. Adds a comment for traceability

### Configuration:
- **Copilot Agent**: Set `COPILOT_AGENT_LOGIN` repository variable (defaults to `copilot-swe-agent`)
- **Epic Label**: Issues must have the `epic` label to be processed
- **Checklist Format**: Use standard markdown checkboxes with issue numbers:
  ```markdown
  - [ ] #123 First task
  - [x] #124 Completed task  
  - [ ] #125 Next task
  ```

### Epic Example:
```markdown
# Epic: Implement User Authentication

- [ ] #101 Set up authentication service
- [ ] #102 Create login UI
- [ ] #103 Add password reset functionality
- [ ] #104 Implement 2FA
```

When a PR is merged that closes issue #101, the workflow will:
1. **Automatically update the epic** to mark issue #101 as completed:
   ```markdown
   - [x] #101 Set up authentication service  ← Updated automatically
   - [ ] #102 Create login UI               ← Next to be assigned
   - [ ] #103 Add password reset functionality
   - [ ] #104 Implement 2FA
   ```
2. **Assign issue #102** to the Copilot agent for the next task

### Requirements:
- Merged PRs must include `Closes #<issue_number>` in their description
- Epic issues must be labeled with `epic`
- Child issues must be referenced in the epic's checklist with `#<issue_number>`
- Child issues must be open to be assigned

## Testing

See [TESTING.md](./TESTING.md) for comprehensive testing instructions, including:
- Unit tests for core logic
- Manual testing with dry-run mode
- End-to-end test scenarios
- Troubleshooting guide

**Quick test**: Run `node .github/workflows/test-workflow-logic.js` to validate core functions.

**Safe testing**: Use the manual workflow trigger with dry-run mode enabled to test without making actual changes.
