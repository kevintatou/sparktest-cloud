# Testing the Auto-advance Copilot Workflow

This document explains how to test the auto-advance workflow to ensure it works correctly before relying on it in production.

## Testing Approaches

### 1. Unit Tests

Run the unit tests to validate the core parsing logic:

```bash
node .github/workflows/test-workflow-logic.js
```

This tests:
- Extracting closed issues from PR descriptions
- Parsing checklist items from epic bodies
- Finding next issues and updating checklists

### 2. Manual Workflow Testing

The workflow can be manually triggered for testing purposes:

#### 2.1 Dry Run Mode (Recommended)

Navigate to **Actions** → **Auto-advance Copilot on Epic** → **Run workflow**

Set parameters:
- **Dry run mode**: `true` ✅
- **PR number**: (optional) specific PR to test with
- **Commit SHA**: (optional) specific commit to test with

This will:
- ✅ Show exactly what changes would be made
- ✅ Log all actions without actually modifying issues
- ✅ Display the comment that would be added
- ✅ Show epic checklist updates that would occur

#### 2.2 Live Testing (Use with Caution)

Only after dry run testing succeeds:
- **Dry run mode**: `false` ❌
- Provide test PR/commit data

### 3. End-to-End Test Setup

Create a test scenario to validate the complete workflow:

#### Step 1: Create Test Epic
Create an issue with label `epic` and body:
```markdown
# Test Epic: Feature Development

- [x] #101 Initial setup (completed)
- [ ] #102 Implement feature A
- [ ] #103 Add tests for feature A  
- [ ] #104 Implement feature B
```

#### Step 2: Create Test Issues
Create issues #102, #103, #104 with proper titles and keep them open.

#### Step 3: Create Test PR
Create a PR with description:
```markdown
Implement feature A functionality

This PR adds the core implementation for feature A.

Closes #102
```

#### Step 4: Test the Workflow
1. **Dry run first**: Use manual trigger with dry run mode
2. **Verify output**: Check that it would:
   - Mark #102 as completed in epic checklist  
   - Assign #103 to copilot agent
   - Add traceability comment to #103

3. **Live test**: Run without dry run mode if dry run looks correct

#### Step 5: Verify Results
Check that:
- ✅ Epic checklist shows `- [x] #102 Implement feature A`
- ✅ Issue #103 is assigned to the copilot agent
- ✅ Issue #103 has the auto-assignment comment

## Test Scenarios

### Scenario A: Normal Flow
- Epic has sequential unchecked items
- PR closes middle item
- Expect: Item marked as done, next item assigned

### Scenario B: Last Item
- PR closes the last item in epic
- Expect: Item marked as done, no assignment (end of epic)

### Scenario C: Already Completed
- PR closes item already marked as completed
- Expect: No changes to epic, next unchecked item assigned

### Scenario D: Multiple Epics
- Same issue referenced in multiple epics
- Expect: All relevant epics updated

### Scenario E: No Epic Found
- PR closes issue not in any epic
- Expect: No actions taken, clean log output

## Troubleshooting

### Common Issues

**Issue**: "No recent merged PRs found"
- **Solution**: Provide specific PR number or commit SHA in manual trigger

**Issue**: "Epic not found" 
- **Solution**: Ensure epic has correct label (default: `epic`)

**Issue**: "Issue not found in checklist"
- **Solution**: Verify epic body contains `#123` format for issue references

**Issue**: "Permission denied"
- **Solution**: Ensure workflow has proper GitHub token permissions

### Debug Output

The workflow provides detailed logging:
- 🚀 Workflow start and configuration
- 📝 Commit and PR processing
- 📊 Issues found and processed  
- 📋 Checklist items parsed
- ✅ Actions taken or skipped
- ❌ Errors with full context

## Safety Features

1. **Dry run mode**: Test without making changes
2. **Detailed logging**: Full visibility into workflow decisions
3. **Error handling**: Graceful failure with detailed error messages
4. **Validation**: Checks for issue existence and state before assignment
5. **Idempotent**: Safe to run multiple times on same data

## Configuration

The workflow can be configured via repository variables:

- `COPILOT_AGENT_LOGIN`: GitHub username to assign issues to (default: `copilot-swe-agent`)
- `EPIC_LABEL`: Label used to identify epic issues (default: `epic`)

## Best Practices

1. **Always dry run first** when testing with real data
2. **Use test repository** for initial validation if possible
3. **Start with simple scenarios** before testing complex cases
4. **Monitor workflow logs** to understand behavior
5. **Keep test epics simple** with clear issue references

## Automated Testing

The workflow includes comprehensive error handling and validation:
- Validates PR is merged before processing
- Checks issue existence and state
- Handles malformed epic bodies gracefully
- Provides clear error messages for debugging

This ensures the workflow fails safely rather than making incorrect changes.