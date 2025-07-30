import { Definition, Executor, Run, Suite } from "./types"

// Sample Suites
export const sampleSuites: Suite[] = [
  {
    id: "frontend-test-suite",
    name: "Frontend Test Suite",
    description:
      "Comprehensive frontend testing including React components, E2E user journeys, and visual regression tests",
    testDefinitionIds: ["react-component-tests", "e2e-user-journey", "cypress-e2e-tests"],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    executionMode: "sequential",
    labels: ["frontend", "react", "e2e", "ui"],
  },
  {
    id: "backend-api-suite",
    name: "Backend API Test Suite",
    description:
      "Complete backend API testing including REST endpoints, authentication, and database operations",
    testDefinitionIds: ["api-integration-tests", "python-backend-tests", "postman-api-tests"],
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    executionMode: "parallel",
    labels: ["backend", "api", "integration", "authentication"],
  },
  {
    id: "performance-suite",
    name: "Performance Test Suite",
    description: "Load testing and performance benchmarks to ensure application scalability",
    testDefinitionIds: ["k6-load-tests"],
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    executionMode: "sequential",
    labels: ["performance", "load", "scalability", "k6"],
  },
  {
    id: "working-examples-suite",
    name: "Working Examples Suite",
    description:
      "Collection of simple, self-contained tests that demonstrate the platform capabilities and will actually run successfully",
    testDefinitionIds: [
      "simple-health-check",
      "basic-python-test",
      "node-version-test",
      "shell-script-test",
      "network-connectivity-test",
    ],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    executionMode: "parallel",
    labels: ["working", "examples", "demo", "basic"],
  },
]

// Backward compatibility
export const sampleTestSuites = sampleSuites

// Sample Definitions
export const sampleDefinitions: Definition[] = [
  {
    id: "react-component-tests",
    name: "React Component Unit Tests",
    description:
      "Test React components with Jest and React Testing Library including hooks, state management, and user interactions",
    image: "node:18-alpine",
    commands: ["npm ci", "npm run test:unit -- --coverage --watchAll=false"],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    executorId: "jest-executor",
    variables: {
      NODE_ENV: "test",
      CI: "true",
      COVERAGE_THRESHOLD: "80",
    },
    labels: ["react", "unit", "jest", "frontend"],
  },
  {
    id: "api-integration-tests",
    name: "REST API Integration Tests",
    description:
      "Test REST API endpoints with authentication, CRUD operations, validation, and error handling",
    image: "node:18-alpine",
    commands: ["npm ci", "npm run test:api -- --reporter=json --output=api-test-results.json"],
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    executorId: "jest-executor",
    variables: {
      API_BASE_URL: "https://api.staging.example.com",
      TEST_USER_EMAIL: "test@example.com",
      TEST_USER_PASSWORD: "test123!",
      JWT_SECRET: "test-jwt-secret",
    },
    labels: ["api", "integration", "backend", "rest"],
  },
  {
    id: "e2e-user-journey",
    name: "E2E User Journey Tests",
    description:
      "Complete user journey testing: signup, login, product browsing, checkout, and order management",
    image: "mcr.microsoft.com/playwright:v1.40.0-focal",
    commands: ["npm ci", "npx playwright install", "npx playwright test --reporter=html"],
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    executorId: "playwright-executor",
    variables: {
      BASE_URL: "https://staging.example.com",
      HEADLESS: "true",
      BROWSER: "chromium",
      VIEWPORT_WIDTH: "1920",
      VIEWPORT_HEIGHT: "1080",
    },
    labels: ["e2e", "playwright", "user-journey", "frontend"],
  },
  {
    id: "k6-load-tests",
    name: "K6 Performance Load Tests",
    description:
      "Load testing with K6 to simulate real user traffic and measure performance metrics",
    image: "grafana/k6:latest",
    commands: ["k6 run --vus 100 --duration 10m --out json=load-test-results.json load-test.js"],
    createdAt: new Date(Date.now() - 518400000).toISOString(),
    executorId: "k6-executor",
    variables: {
      TARGET_URL: "https://api.staging.example.com",
      VUS: "100",
      DURATION: "10m",
      THRESHOLD_P95: "500",
      THRESHOLD_ERROR_RATE: "0.1",
    },
    labels: ["performance", "load", "k6", "scalability"],
  },
  // Working test examples that can actually run through the K8s backend
  {
    id: "simple-health-check",
    name: "Simple Health Check",
    description: "Basic system health check using curl to test network connectivity",
    image: "curlimages/curl:latest",
    commands: [
      'curl -f -s -o /dev/null -w "%{http_code}" https://httpbin.org/status/200 && echo "Health check passed"',
    ],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    labels: ["working", "examples", "demo", "health"],
  },
  {
    id: "basic-python-test",
    name: "Basic Python Test",
    description: "Simple Python test that runs without external dependencies",
    image: "python:3.9-slim",
    commands: [
      "python -c \"import sys; print(f'Python version: {sys.version}'); assert 2 + 2 == 4; print('Basic math test passed')\"",
    ],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    labels: ["working", "examples", "demo", "python"],
  },
  {
    id: "node-version-test",
    name: "Node.js Version Test",
    description: "Test Node.js installation and basic functionality",
    image: "node:18-alpine",
    commands: [
      "node -e \"console.log('Node.js version:', process.version); console.log('Test passed: 2 + 2 =', 2 + 2); process.exit(0)\"",
    ],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    labels: ["working", "examples", "demo", "nodejs"],
  },
  {
    id: "shell-script-test",
    name: "Shell Script Test",
    description: "Basic shell script test with system commands",
    image: "alpine:latest",
    commands: [
      "sh -c \"echo 'Starting shell test'; whoami; pwd; ls -la /; echo 'Shell test completed successfully'\"",
    ],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    labels: ["working", "examples", "demo", "shell"],
  },
  {
    id: "network-connectivity-test",
    name: "Network Connectivity Test",
    description: "Test network connectivity to external services",
    image: "alpine:latest",
    commands: [
      "sh -c \"apk add --no-cache curl && curl -f -s https://httpbin.org/json && echo 'Network test passed'\"",
    ],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    labels: ["working", "examples", "demo", "network"],
  },
]

// Sample Runs
export const sampleRuns: Run[] = [
  {
    id: "run-react-components",
    name: "React Component Unit Tests - PR #247",
    image: "node:18-alpine",
    command: ["npm ci", "npm run test:unit -- --coverage --watchAll=false"],
    status: "completed",
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    definitionId: "react-component-tests",
    executorId: "jest-executor",
    variables: {
      NODE_ENV: "test",
      CI: "true",
      COVERAGE_THRESHOLD: "80",
    },
    artifacts: ["coverage-report.html", "test-results.json", "junit.xml"],
    duration: 145000,
    logs: [
      "> Starting React component unit tests...",
      "> npm ci",
      "added 1247 packages in 32s",
      "> npm run test:unit -- --coverage --watchAll=false",
      "",
      "PASS src/components/Button/Button.test.tsx",
      "  Button Component",
      "    ✓ renders with default props (23ms)",
      "    ✓ renders with custom text (8ms)",
      "    ✓ handles click events (12ms)",
      "    ✓ applies custom className (5ms)",
      "",
      "Test Suites: 24 passed, 24 total",
      "Tests:       147 passed, 147 total",
      "✅ All tests passed! Coverage above 80% threshold.",
    ],
  },
  {
    id: "working-health-check-run",
    name: "Health Check - Working Example",
    image: "curlimages/curl:latest",
    command: [
      'curl -f -s -o /dev/null -w "%{http_code}" https://httpbin.org/status/200 && echo "Health check passed"',
    ],
    status: "completed",
    createdAt: new Date(Date.now() - 300000).toISOString(),
    definitionId: "simple-health-check",
    duration: 5000,
    logs: [
      '> curl -f -s -o /dev/null -w "%{http_code}" https://httpbin.org/status/200 && echo "Health check passed"',
      "200Health check passed",
      "",
      "✅ Test completed successfully",
    ],
  },
  {
    id: "working-python-test-run",
    name: "Python Test - Working Example",
    image: "python:3.9-slim",
    command: [
      "python -c \"import sys; print(f'Python version: {sys.version}'); assert 2 + 2 == 4; print('Basic math test passed')\"",
    ],
    status: "completed",
    createdAt: new Date(Date.now() - 600000).toISOString(),
    definitionId: "basic-python-test",
    duration: 3000,
    logs: [
      "> python -c \"import sys; print(f'Python version: {sys.version}'); assert 2 + 2 == 4; print('Basic math test passed')\"",
      "Python version: 3.9.18 (main, Jan 24 2024, 22:56:09) [GCC 12.2.0]",
      "Basic math test passed",
      "",
      "✅ Test completed successfully",
    ],
  },
]

// Sample Executors
export const sampleExecutors: Executor[] = [
  {
    id: "jest-executor",
    name: "Jest Test Runner",
    image: "node:18-alpine",
    description: "Run JavaScript/TypeScript unit tests using Jest testing framework.",
    command: ["npm", "run", "test"],
    supportedFileTypes: ["js", "ts", "json"],
    env: {
      NODE_ENV: "test",
      CI: "true",
    },
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "playwright-executor",
    name: "Playwright Test Runner",
    image: "mcr.microsoft.com/playwright:v1.40.0-focal",
    description: "Run cross-browser end-to-end tests using Playwright.",
    command: ["npx", "playwright", "test"],
    supportedFileTypes: ["js", "ts", "json"],
    env: {
      PLAYWRIGHT_BROWSERS_PATH: "/ms-playwright",
      PLAYWRIGHT_HTML_REPORT: "playwright-report",
    },
    createdAt: new Date(Date.now() - 432000000).toISOString(),
  },
  {
    id: "k6-executor",
    name: "K6 Load Test Runner",
    image: "grafana/k6:latest",
    description: "Run performance and load tests using K6 framework.",
    command: ["k6", "run", "--out", "json=results.json"],
    supportedFileTypes: ["js", "json"],
    env: {
      K6_WEB_DASHBOARD: "true",
      K6_WEB_DASHBOARD_EXPORT: "test-report.html",
    },
    createdAt: new Date(Date.now() - 345600000).toISOString(),
  },
]