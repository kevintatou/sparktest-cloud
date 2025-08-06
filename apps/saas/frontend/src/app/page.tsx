'use client';

import { useState, useEffect } from 'react';
import { TestDefinitionCard, TestRunCard, ExecutorCard, TestSuiteCard } from '@sparktest/ui';
import { TestDefinition, TestRun, Executor, TestSuite, defaultConfig } from '@sparktest/core';
import { Plus, Play, Settings, Database } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'definitions' | 'runs' | 'executors' | 'suites'>('definitions');
  const [testDefinitions, setTestDefinitions] = useState<TestDefinition[]>([]);
  const [testRuns, setTestRuns] = useState<TestRun[]>([]);
  const [executors, setExecutors] = useState<Executor[]>([]);
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);

  // Load sample data
  useEffect(() => {
    // Sample test definitions
    setTestDefinitions([
      {
        id: '1',
        name: 'Basic API Test',
        description: 'Tests the basic API endpoints',
        code: 'console.log("Hello, world!");',
        language: 'javascript',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'Database Connection Test',
        description: 'Tests database connectivity',
        code: 'import sqlite3\nprint("Database test")',
        language: 'python',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);

    // Sample test runs
    setTestRuns([
      {
        id: 'run-1',
        definition_id: '1',
        status: 'completed',
        result: { success: true, output: 'Hello, world!' },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'run-2',
        definition_id: '2',
        status: 'failed',
        error: 'Database connection failed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);

    // Sample executors
    setExecutors([
      {
        id: 'exec-1',
        name: 'Local Executor',
        type: 'local',
        config: { max_workers: 4 },
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'exec-2',
        name: 'Kubernetes Executor',
        type: 'kubernetes',
        config: { namespace: 'sparktest', replicas: 3 },
        status: 'inactive',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);

    // Sample test suites
    setTestSuites([
      {
        id: 'suite-1',
        name: 'API Test Suite',
        description: 'Complete API testing suite',
        test_definitions: ['1', '2'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);
  }, []);

  const handleCreateTest = () => {
    const newTest: TestDefinition = {
      id: `test-${Date.now()}`,
      name: `New Test ${testDefinitions.length + 1}`,
      description: 'New test description',
      code: '// Write your test code here',
      language: 'javascript',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setTestDefinitions([...testDefinitions, newTest]);
  };

  const handleRunTest = (definitionId: string) => {
    const newRun: TestRun = {
      id: `run-${Date.now()}`,
      definition_id: definitionId,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setTestRuns([newRun, ...testRuns]);

    // Simulate running
    setTimeout(() => {
      setTestRuns(prev => prev.map(run => 
        run.id === newRun.id 
          ? { ...run, status: 'running' as const }
          : run
      ));
    }, 1000);

    setTimeout(() => {
      setTestRuns(prev => prev.map(run => 
        run.id === newRun.id 
          ? { ...run, status: 'completed' as const, result: { success: true } }
          : run
      ));
    }, 3000);
  };

  const handleDeleteTest = (id: string) => {
    setTestDefinitions(testDefinitions.filter(t => t.id !== id));
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'definitions':
        return (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Test Definitions</h2>
              <button
                onClick={handleCreateTest}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center gap-2"
              >
                <Plus size={16} />
                Create Test
              </button>
            </div>
            <div className="space-y-4">
              {testDefinitions.map(definition => (
                <TestDefinitionCard
                  key={definition.id}
                  definition={definition}
                  onRun={handleRunTest}
                  onDelete={handleDeleteTest}
                />
              ))}
            </div>
          </div>
        );

      case 'runs':
        return (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Test Runs</h2>
            </div>
            <div className="space-y-4">
              {testRuns.map(run => (
                <TestRunCard key={run.id} run={run} />
              ))}
            </div>
          </div>
        );

      case 'executors':
        return (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Executors</h2>
              <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center gap-2">
                <Plus size={16} />
                Add Executor
              </button>
            </div>
            <div className="space-y-4">
              {executors.map(executor => (
                <ExecutorCard key={executor.id} executor={executor} />
              ))}
            </div>
          </div>
        );

      case 'suites':
        return (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Test Suites</h2>
              <button className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 flex items-center gap-2">
                <Plus size={16} />
                Create Suite
              </button>
            </div>
            <div className="space-y-4">
              {testSuites.map(suite => (
                <TestSuiteCard key={suite.id} suite={suite} />
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">SparkTest SaaS</h1>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Database size={16} />
              <span>Backend: {defaultConfig.backend_url}</span>
              <span>•</span>
              <span>Mode: {defaultConfig.storage_mode}</span>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex space-x-8">
            {[
              { key: 'definitions', label: 'Test Definitions' },
              { key: 'runs', label: 'Test Runs' },
              { key: 'executors', label: 'Executors' },
              { key: 'suites', label: 'Test Suites' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {renderTabContent()}
      </main>
    </div>
  );
}