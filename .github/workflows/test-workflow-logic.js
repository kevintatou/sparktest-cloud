#!/usr/bin/env node

/**
 * Test script to validate the auto-advance workflow logic
 * This extracts and tests the core parsing functions from the workflow
 */

// Extract the parsing functions from the workflow for testing
function extractClosedIssues(prBody) {
  const patterns = [
    /(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s*:?\s*#(\d+)/gi,
    /(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+(?:https?:\/\/github\.com\/[^\/]+\/[^\/]+\/issues\/)?(\d+)/gi
  ];
  
  const issues = new Set();
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(prBody)) !== null) {
      issues.add(parseInt(match[1]));
    }
  }
  return Array.from(issues);
}

function parseChecklistItems(body) {
  const lines = body.split('\n');
  const items = [];
  
  for (const line of lines) {
    // Match checklist items like "- [ ] #123 Description" or "- [x] #123 Description"
    const match = line.match(/^\s*-\s*\[([x\s])\]\s*#?(\d+)(?:\s+(.*))?/i);
    if (match) {
      const [, checkStatus, issueNum, description] = match;
      items.push({
        checked: checkStatus.toLowerCase() === 'x',
        issueNumber: parseInt(issueNum),
        description: (description || '').trim(),
        line: line.trim()
      });
    }
  }
  
  return items;
}

// Test cases
console.log('🧪 Testing Auto-advance Workflow Logic\n');

// Test 1: Extract closed issues from PR body
console.log('Test 1: Extracting closed issues from PR descriptions');
const testPRBodies = [
  'This PR fixes #123 and closes #456',
  'Closes: #789',
  'This resolves #100, fixes #200, and closes https://github.com/user/repo/issues/300',
  'No issues mentioned here',
  'Fixed #111 and also fixes #222'
];

testPRBodies.forEach((body, i) => {
  const issues = extractClosedIssues(body);
  console.log(`  PR ${i + 1}: "${body}" -> [${issues.join(', ')}]`);
});

console.log('\n');

// Test 2: Parse checklist items from epic body
console.log('Test 2: Parsing checklist items from epic body');
const testEpicBody = `# Epic: User Authentication

This epic covers the implementation of user authentication features.

## Tasks:
- [x] #101 Set up authentication service
- [ ] #102 Create login UI
- [x] #103 Add password reset functionality
- [ ] #104 Implement 2FA
- [ ] #105 Add session management

Some other text that should be ignored.

Additional tasks:
- [ ] #106 Add OAuth support
`;

const checklistItems = parseChecklistItems(testEpicBody);
console.log('  Checklist items found:');
checklistItems.forEach(item => {
  console.log(`    ${item.checked ? '✅' : '⬜'} #${item.issueNumber}: ${item.description}`);
});

console.log('\n');

// Test 3: Simulate finding next issue after completion
console.log('Test 3: Finding next issue after completion');
function findNextIssue(checklistItems, completedIssueNumber) {
  let foundCompleted = false;
  
  for (const item of checklistItems) {
    if (item.issueNumber === completedIssueNumber) {
      foundCompleted = true;
      console.log(`  ✅ Found completed issue #${completedIssueNumber}`);
    } else if (!item.checked && item.issueNumber && foundCompleted) {
      console.log(`  ➡️  Next unchecked issue: #${item.issueNumber} - ${item.description}`);
      return item.issueNumber;
    }
  }
  
  console.log(`  ❌ No next unchecked issue found after #${completedIssueNumber}`);
  return null;
}

// Test scenarios
const testScenarios = [
  { completed: 101, expected: 102 },
  { completed: 103, expected: 104 },
  { completed: 106, expected: null }, // Last item
  { completed: 999, expected: null }  // Non-existent item
];

testScenarios.forEach(scenario => {
  console.log(`\n  Scenario: Issue #${scenario.completed} completed`);
  const nextIssue = findNextIssue(checklistItems, scenario.completed);
  const result = nextIssue === scenario.expected ? '✅ PASS' : '❌ FAIL';
  console.log(`  Expected: #${scenario.expected}, Got: #${nextIssue} ${result}`);
});

console.log('\n🎉 Test completed!');

// Summary
console.log('\n📋 Summary:');
console.log('- extractClosedIssues(): Parses PR bodies for "Closes #123" patterns');
console.log('- parseChecklistItems(): Extracts checklist items with issue numbers');
console.log('- findNextIssue(): Finds next unchecked issue after a completed one');
console.log('\nThe workflow will use these functions to automatically advance Copilot through epic checklists.');