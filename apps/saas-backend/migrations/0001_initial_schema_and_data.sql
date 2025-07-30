-- Initial schema and data migration
-- This creates all tables and inserts all initial/mock data matching OSS SparkTest exactly

-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create table for test executors
CREATE TABLE test_executors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    image TEXT NOT NULL,
    default_command TEXT NOT NULL,
    supported_file_types TEXT[] NOT NULL,
    environment_variables TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    icon TEXT
);

-- Create table for test definitions
CREATE TABLE test_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    image TEXT NOT NULL,
    commands TEXT[] NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    executor_id UUID REFERENCES test_executors(id) ON DELETE SET NULL,
    labels TEXT[] DEFAULT '{}'
);

-- Create table for test runs
CREATE TABLE test_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    image TEXT NOT NULL,
    command TEXT[] NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Running', 'Completed', 'Failed', 'running', 'succeeded', 'failed')),
    created_at TIMESTAMPTZ DEFAULT now(),
    duration INTEGER,
    logs TEXT[],
    test_definition_id UUID REFERENCES test_definitions(id) ON DELETE SET NULL,
    executor_id UUID REFERENCES test_executors(id) ON DELETE SET NULL
);

-- Create table for test suites
CREATE TABLE test_suites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    execution_mode TEXT NOT NULL DEFAULT 'sequential',
    labels TEXT[] DEFAULT '{}',
    test_definition_ids UUID[] NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_test_definitions_executor_id ON test_definitions(executor_id);
CREATE INDEX idx_test_runs_executor_id ON test_runs(executor_id);
CREATE INDEX idx_test_runs_test_definition_id ON test_runs(test_definition_id);

-- Insert test executors with real UUIDs matching OSS
INSERT INTO test_executors (id, name, description, image, default_command, supported_file_types, environment_variables, icon)
VALUES 
    ('b7e6c1e2-1a2b-4c3d-8e9f-000000000001', 'Jest Test Runner', 'Run JavaScript/TypeScript unit tests using Jest testing framework.', 'node:18-alpine', 'npm run test', ARRAY['js', 'ts', 'json'], ARRAY['NODE_ENV', 'CI'], '🧪'),
    ('b7e6c1e2-1a2b-4c3d-8e9f-000000000002', 'Cypress E2E Runner', 'Run end-to-end tests using Cypress testing framework.', 'cypress/included:12.17.4', 'npx cypress run', ARRAY['js', 'ts', 'json'], ARRAY['CYPRESS_baseUrl', 'CYPRESS_RECORD_KEY'], '🌊'),
    ('b7e6c1e2-1a2b-4c3d-8e9f-000000000003', 'Pytest Runner', 'Run Python unit and integration tests using pytest framework.', 'python:3.11-slim', 'pytest --verbose --junit-xml=test-results.xml', ARRAY['py', 'yaml', 'json'], ARRAY['PYTHONPATH', 'PYTEST_CURRENT_TEST'], '🐍'),
    ('b7e6c1e2-1a2b-4c3d-8e9f-000000000004', 'K6 Load Test Runner', 'Run performance and load tests using K6 framework.', 'grafana/k6:latest', 'k6 run --out json=results.json', ARRAY['js', 'json'], ARRAY['K6_WEB_DASHBOARD', 'K6_WEB_DASHBOARD_EXPORT'], '📈'),
    ('b7e6c1e2-1a2b-4c3d-8e9f-000000000005', 'Playwright Test Runner', 'Run cross-browser end-to-end tests using Playwright.', 'mcr.microsoft.com/playwright:v1.40.0-focal', 'npx playwright test', ARRAY['js', 'ts', 'json'], ARRAY['PLAYWRIGHT_BROWSERS_PATH', 'PLAYWRIGHT_HTML_REPORT'], '🎭'),
    ('b7e6c1e2-1a2b-4c3d-8e9f-000000000006', 'Postman Collection Runner', 'Run API tests using Postman collections with Newman.', 'postman/newman:alpine', 'newman run --reporters cli,json', ARRAY['json'], ARRAY['NEWMAN_REPORTER_JSON_EXPORT'], '📮'),
    ('b7e6c1e2-1a2b-4c3d-8e9f-000000000007', 'GitHub Actions Runner', 'Run tests in GitHub Actions compatible environment.', 'ghcr.io/actions/actions-runner:latest', './run.sh', ARRAY['yaml', 'yml', 'json'], ARRAY['GITHUB_ACTIONS', 'RUNNER_OS'], '🐙'),
    ('b7e6c1e2-1a2b-4c3d-8e9f-000000000008', 'Docker Container Runner', 'Run tests in isolated Docker containers with custom configurations.', 'docker:latest', 'docker run --rm', ARRAY['dockerfile', 'yaml', 'sh'], ARRAY['DOCKER_BUILDKIT'], '🐳');

-- Insert test definitions matching OSS exact structure
INSERT INTO test_definitions (id, name, description, image, commands, created_at, executor_id)
VALUES 
    ('b7e6c1e2-1a2b-4c3d-8e9f-100000000001', 'React Component Unit Tests', 'Test React components with Jest and React Testing Library including hooks, state management, and user interactions', 'node:18-alpine', ARRAY['npm ci', 'npm run test:unit -- --coverage --watchAll=false'], '2025-07-17 12:00:00+00', 'b7e6c1e2-1a2b-4c3d-8e9f-000000000001'),
    ('b7e6c1e2-1a2b-4c3d-8e9f-100000000002', 'REST API Integration Tests', 'Test REST API endpoints with authentication, CRUD operations, validation, and error handling', 'node:18-alpine', ARRAY['npm ci', 'npm run test:api -- --reporter=json --output=api-test-results.json'], '2025-07-16 12:00:00+00', 'b7e6c1e2-1a2b-4c3d-8e9f-000000000001'),
    ('b7e6c1e2-1a2b-4c3d-8e9f-100000000003', 'E2E User Journey Tests', 'Complete user journey testing: signup, login, product browsing, checkout, and order management', 'mcr.microsoft.com/playwright:v1.40.0-focal', ARRAY['npm ci', 'npx playwright install', 'npx playwright test --reporter=html'], '2025-07-15 12:00:00+00', 'b7e6c1e2-1a2b-4c3d-8e9f-000000000005'),
    ('b7e6c1e2-1a2b-4c3d-8e9f-100000000006', 'K6 Performance Load Tests', 'Load testing with K6 to simulate real user traffic and measure performance metrics', 'grafana/k6:latest', ARRAY['k6 run --vus 100 --duration 10m --out json=load-test-results.json load-test.js'], '2025-07-12 12:00:00+00', 'b7e6c1e2-1a2b-4c3d-8e9f-000000000004'),
    ('b7e6c1e2-1a2b-4c3d-8e9f-100000000007', 'Simple Health Check', 'Basic system health check using curl to test network connectivity', 'curlimages/curl:latest', ARRAY['curl -f -s -o /dev/null -w "%{http_code}" https://httpbin.org/status/200 && echo "Health check passed"'], '2025-07-11 12:00:00+00', 'b7e6c1e2-1a2b-4c3d-8e9f-000000000008'),
    ('b7e6c1e2-1a2b-4c3d-8e9f-100000000008', 'Basic Python Test', 'Simple Python test that runs without external dependencies', 'python:3.9-slim', ARRAY['python -c "import sys; print(f''Python version: {sys.version}''); assert 2 + 2 == 4; print(''Basic math test passed'')"'], '2025-07-10 12:00:00+00', 'b7e6c1e2-1a2b-4c3d-8e9f-000000000003'),
    ('b7e6c1e2-1a2b-4c3d-8e9f-100000000009', 'Node.js Version Test', 'Test Node.js installation and basic functionality', 'node:18-alpine', ARRAY['node -e "console.log(''Node.js version:'', process.version); console.log(''Test passed: 2 + 2 ='', 2 + 2); process.exit(0)"'], '2025-07-09 12:00:00+00', 'b7e6c1e2-1a2b-4c3d-8e9f-000000000001');

-- Insert sample test runs
INSERT INTO test_runs (id, name, image, command, status, created_at, duration, logs, test_definition_id, executor_id)
VALUES 
    ('b7e6c1e2-1a2b-4c3d-8e9f-200000000001', 'React Component Unit Tests - PR #247', 'node:18-alpine', ARRAY['npm ci', 'npm run test:unit -- --coverage --watchAll=false'], 'succeeded', '2025-07-18 11:46:19+00', 145000, ARRAY['> Starting React component unit tests...', '> npm ci', 'added 1247 packages in 32s', '> npm run test:unit -- --coverage --watchAll=false', '', 'PASS src/components/Button/Button.test.tsx', '  Button Component', '    ✓ renders with default props (23ms)', '    ✓ renders with custom text (8ms)', '', 'Test Suites: 24 passed, 24 total', 'Tests:       147 passed, 147 total', '', '✅ All tests passed! Coverage above 80% threshold.'], 'b7e6c1e2-1a2b-4c3d-8e9f-100000000001', 'b7e6c1e2-1a2b-4c3d-8e9f-000000000001'),
    ('b7e6c1e2-1a2b-4c3d-8e9f-200000000002', 'K6 Performance Load Tests - API Stress Test', 'grafana/k6:latest', ARRAY['k6 run --vus 100 --duration 10m --out json=load-test-results.json load-test.js'], 'failed', '2025-07-18 10:16:19+00', 285000, ARRAY['> Starting K6 load tests...', '> k6 run --vus 100 --duration 10m --out json=load-test-results.json load-test.js', '', '     data_received..................: 145 MB  507 kB/s', '     http_req_failed................: 8.00%   ✓ 1162      ✗ 13361', '', '❌ Performance test failed - 8% error rate exceeds 0.1% threshold'], 'b7e6c1e2-1a2b-4c3d-8e9f-100000000006', 'b7e6c1e2-1a2b-4c3d-8e9f-000000000004'),
    ('b7e6c1e2-1a2b-4c3d-8e9f-200000000003', 'Health Check - Basic Test', 'curlimages/curl:latest', ARRAY['curl -f -s -o /dev/null -w "%{http_code}" https://httpbin.org/status/200 && echo "Health check passed"'], 'succeeded', '2025-07-18 09:16:19+00', 3000, ARRAY['> Starting health check...', '> curl -f -s -o /dev/null -w "%{http_code}" https://httpbin.org/status/200', '200', '> echo "Health check passed"', 'Health check passed', '✅ Test completed successfully'], 'b7e6c1e2-1a2b-4c3d-8e9f-100000000007', 'b7e6c1e2-1a2b-4c3d-8e9f-000000000008');

-- Insert test suites matching OSS structure
INSERT INTO test_suites (id, name, description, execution_mode, labels, test_definition_ids, created_at)
VALUES 
    ('b7e6c1e2-1a2b-4c3d-8e9f-500000000001', 'Frontend Test Suite', 'Comprehensive frontend testing including React components and E2E user journeys', 'sequential', ARRAY['frontend', 'react', 'e2e', 'ui'], ARRAY['b7e6c1e2-1a2b-4c3d-8e9f-100000000001', 'b7e6c1e2-1a2b-4c3d-8e9f-100000000003']::UUID[], '2025-07-17 12:00:00+00'),
    ('b7e6c1e2-1a2b-4c3d-8e9f-500000000002', 'Backend API Test Suite', 'Complete backend API testing including REST endpoints and authentication', 'parallel', ARRAY['backend', 'api', 'integration'], ARRAY['b7e6c1e2-1a2b-4c3d-8e9f-100000000002']::UUID[], '2025-07-16 12:00:00+00'),
    ('b7e6c1e2-1a2b-4c3d-8e9f-500000000003', 'Working Examples Suite', 'Simple working tests that can actually execute successfully', 'sequential', ARRAY['working', 'examples', 'demo'], ARRAY['b7e6c1e2-1a2b-4c3d-8e9f-100000000007', 'b7e6c1e2-1a2b-4c3d-8e9f-100000000008', 'b7e6c1e2-1a2b-4c3d-8e9f-100000000009']::UUID[], '2025-07-15 12:00:00+00');