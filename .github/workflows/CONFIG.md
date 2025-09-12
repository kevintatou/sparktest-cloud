# Auto-advance Copilot Configuration

# Configuration options for the auto-advance-copilot workflow

## Environment Variables / Repository Variables

### COPILOT_AGENT_LOGIN
- **Default**: `copilot-swe-agent`
- **Description**: GitHub username of the Copilot agent to assign issues to
- **Type**: Repository Variable (recommended) or Environment Variable

### EPIC_LABEL  
- **Default**: `epic`
- **Description**: Label used to identify epic issues
- **Type**: Repository Variable (optional)

### CI_WORKFLOW_NAME
- **Default**: `CI` 
- **Description**: Name of the CI workflow that must complete successfully
- **Type**: Repository Variable (optional)

## Example Repository Variable Setup

Go to your repository Settings > Secrets and variables > Actions > Variables tab:

```
COPILOT_AGENT_LOGIN = copilot-swe-agent
EPIC_LABEL = epic  
CI_WORKFLOW_NAME = CI
```

## Epic Format Requirements

Epic issues must:
1. Have the configured label (`epic` by default)
2. Be in `open` state
3. Contain a markdown checklist with issue references

### Supported Checklist Formats:
```markdown
- [ ] #123 Task description
- [x] #124 Completed task
- [ ] 125 Task without hash (also supported)
```

## PR Format Requirements

Pull requests must include issue closing keywords in the description:
- `Closes #123`
- `Fixes #456` 
- `Resolves #789`
- `Close #123` / `Fix #456` / `Resolve #789`

Multiple issues can be closed:
```
This PR fixes #123 and closes #456, resolves #789
```

## Workflow Behavior

1. **Trigger**: Only runs when the CI workflow completes successfully
2. **Scope**: Only processes merged PRs
3. **Assignment**: Only assigns open, unchecked issues
4. **Comments**: Adds traceability comment to assigned issues
5. **Error Handling**: Continues processing even if individual issues fail

## Troubleshooting

### Workflow not triggering
- Check that CI workflow name matches `CI_WORKFLOW_NAME` variable
- Ensure CI workflow completed successfully
- Verify PR was actually merged (not just closed)

### Issue not assigned
- Check that epic has the correct label (`epic` by default)
- Verify epic contains the closed issue number in its checklist
- Ensure next issue in checklist is open and unchecked
- Check repository permissions for the GitHub token

### Multiple epics
- If multiple epics contain the same issue, all will be processed
- Each epic will advance independently to its next issue