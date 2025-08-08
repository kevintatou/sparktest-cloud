'use client';

import { useState, useEffect } from 'react';
import { TestDefinition, TestRun, Executor, TestSuite, defaultConfig } from '@sparktest/core';
import { ModernTestDefinitionCard, ModernTestRunCard, ModernExecutorCard, ModernTestSuiteCard } from '@/components/modern-cards';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/theme-toggle';
import { useToast } from '@/hooks/use-toast';
import { Plus, Play, Settings, Database, LayoutDashboard, FileText, Server, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'definitions' | 'runs' | 'executors' | 'suites'>('dashboard');
  const [testDefinitions, setTestDefinitions] = useState<TestDefinition[]>([]);
  const [testRuns, setTestRuns] = useState<TestRun[]>([]);
  const [executors, setExecutors] = useState<Executor[]>([]);
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const { toast } = useToast();

  // Load sample data
  useEffect(() => {
    // Sample test definitions
    setTestDefinitions([
      {
        id: '1',
        name: 'Basic API Test',
        description: 'Tests the basic API endpoints for user authentication and data retrieval',
        code: 'console.log("Hello, world!");',
        language: 'javascript',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'Database Connection Test',
        description: 'Tests database connectivity and basic CRUD operations',
        code: 'import sqlite3\nprint("Database test")',
        language: 'python',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '3',
        name: 'Performance Benchmark',
        description: 'Load testing for API endpoints under high traffic conditions',
        code: 'fn main() { println!("Rust test"); }',
        language: 'rust',
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
        result: { success: true, output: 'Hello, world!', duration: 1250 },
        created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        updated_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      },
      {
        id: 'run-2',
        definition_id: '2',
        status: 'failed',
        error: 'Database connection failed: Connection timeout',
        created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        updated_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      },
      {
        id: 'run-3',
        definition_id: '3',
        status: 'running',
        created_at: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
        updated_at: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
      },
    ]);

    // Sample executors
    setExecutors([
      {
        id: 'exec-1',
        name: 'Local Development',
        type: 'local',
        config: { max_workers: 4 },
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'exec-2',
        name: 'Kubernetes Cluster',
        type: 'kubernetes',
        config: { namespace: 'sparktest', replicas: 3 },
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'exec-3',
        name: 'Docker Swarm',
        type: 'docker',
        config: { network: 'sparktest-net' },
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
        description: 'Complete API testing suite including auth, CRUD, and performance tests',
        test_definitions: ['1', '2'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'suite-2',
        name: 'End-to-End Tests',
        description: 'Full application workflow testing',
        test_definitions: ['1', '2', '3'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);
  }, []);

  const handleCreateTest = () => {
    const newTest: TestDefinition = {
      id: `test-${Date.now()}`,
      name: `New Test ${testDefinitions.length + 1}`,
      description: 'New test description - click edit to customize',
      code: '// Write your test code here',
      language: 'javascript',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setTestDefinitions([...testDefinitions, newTest]);
    toast({
      title: "Test Created",
      description: `"${newTest.name}" has been created successfully.`,
    });
  };

  const handleRunTest = (definitionId: string) => {
    const definition = testDefinitions.find(d => d.id === definitionId);
    const newRun: TestRun = {
      id: `run-${Date.now()}`,
      definition_id: definitionId,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setTestRuns([newRun, ...testRuns]);

    toast({
      title: "Test Started",
      description: `Running "${definition?.name}"...`,
    });

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
          ? { ...run, status: 'completed' as const, result: { success: true, duration: Math.floor(Math.random() * 3000) + 500 } }
          : run
      ));
      toast({
        title: "Test Completed",
        description: `"${definition?.name}" completed successfully.`,
      });
    }, 4000);
  };

  const handleDeleteTest = (id: string) => {
    const definition = testDefinitions.find(d => d.id === id);
    setTestDefinitions(testDefinitions.filter(t => t.id !== id));
    toast({
      title: "Test Deleted",
      description: `"${definition?.name}" has been deleted.`,
      variant: "destructive",
    });
  };

  const navigation = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'definitions', label: 'Test Definitions', icon: FileText },
    { key: 'runs', label: 'Test Runs', icon: Play },
    { key: 'executors', label: 'Executors', icon: Server },
    { key: 'suites', label: 'Test Suites', icon: Layers },
  ];

  const renderDashboard = () => (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-muted-foreground">
            Here's what's happening with your tests today.
          </p>
        </div>
        
        <Button size="lg" onClick={handleCreateTest} className="gap-2">
          <Plus className="h-4 w-4" />
          Create New Test
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{testDefinitions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Runs</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{testRuns.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Executors</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {executors.filter(e => e.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Test Suites</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{testSuites.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Test Runs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {testRuns.slice(0, 3).map(run => (
              <ModernTestRunCard key={run.id} run={run} />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {testDefinitions.slice(0, 3).map(definition => (
              <ModernTestDefinitionCard
                key={definition.id}
                definition={definition}
                onRun={handleRunTest}
              />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
        
      case 'definitions':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Test Definitions</h2>
                <p className="text-muted-foreground">
                  Create and manage your test definitions.
                </p>
              </div>
              <Button onClick={handleCreateTest} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Test
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {testDefinitions.map(definition => (
                <ModernTestDefinitionCard
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
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Test Runs</h2>
              <p className="text-muted-foreground">
                Monitor your test execution history and results.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {testRuns.map(run => (
                <ModernTestRunCard key={run.id} run={run} />
              ))}
            </div>
          </div>
        );

      case 'executors':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Executors</h2>
                <p className="text-muted-foreground">
                  Manage your test execution environments.
                </p>
              </div>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Executor
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {executors.map(executor => (
                <ModernExecutorCard key={executor.id} executor={executor} />
              ))}
            </div>
          </div>
        );

      case 'suites':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Test Suites</h2>
                <p className="text-muted-foreground">
                  Group and manage collections of related tests.
                </p>
              </div>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Suite
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {testSuites.map(suite => (
                <ModernTestSuiteCard key={suite.id} suite={suite} />
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <a className="mr-6 flex items-center space-x-2" href="/">
              <Database className="h-6 w-6" />
              <span className="font-bold">SparkTest</span>
            </a>
          </div>
          
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {navigation.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={cn(
                  "transition-colors hover:text-foreground/80",
                  activeTab === key ? "text-foreground" : "text-foreground/60"
                )}
              >
                {label}
              </button>
            ))}
          </nav>

          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <div className="w-full flex-1 md:w-auto md:flex-none">
              <div className="hidden md:flex items-center space-x-2 text-sm text-muted-foreground">
                <Database className="h-4 w-4" />
                <span>{defaultConfig.backend_url}</span>
                <span>•</span>
                <span>{defaultConfig.storage_mode}</span>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-6">
        {renderTabContent()}
      </main>
    </div>
  );
}