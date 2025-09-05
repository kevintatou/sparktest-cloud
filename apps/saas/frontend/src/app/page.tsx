'use client';

import { useState, useEffect } from 'react';
import { TestDefinition, TestRun, Executor, TestSuite, defaultConfig } from '../../../../../packages/core/dist/index.js';
import { TestDefinitionCard, TestRunCard, ExecutorCard, TestSuiteCard } from '../../../../../packages/ui/dist/index.js';
import { CreateTestDialog } from '@/components/create-test-dialog';
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
  const [showCreateDialog, setShowCreateDialog] = useState(false);
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

  const handleCreateTest = (testData: Omit<TestDefinition, 'id' | 'created_at' | 'updated_at'>) => {
    const newTest: TestDefinition = {
      ...testData,
      id: `test-${Date.now()}`,
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
    <div className="space-y-12">
      {/* Premium Hero Section */}
      <div className="space-y-6">
        <div className="text-center lg:text-left">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Welcome back
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Here's what's happening with your tests today.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 items-center lg:items-start">
          <Button 
            size="lg" 
            onClick={() => setShowCreateDialog(true)} 
            className="btn-gradient-primary gap-3 px-8 py-4 text-base h-auto"
          >
            <Plus className="h-5 w-5" />
            Create New Test
          </Button>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>All systems operational</span>
          </div>
        </div>
      </div>

      {/* Premium Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="premium-card group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Tests</CardTitle>
            <div className="p-2 bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-lg group-hover:from-blue-500/20 group-hover:to-blue-600/20 transition-all duration-300">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
              {testDefinitions.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-600">+2</span> this week
            </p>
          </CardContent>
        </Card>
        
        <Card className="premium-card group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Recent Runs</CardTitle>
            <div className="p-2 bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-lg group-hover:from-green-500/20 group-hover:to-green-600/20 transition-all duration-300">
              <Play className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
              {testRuns.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-600">+5</span> today
            </p>
          </CardContent>
        </Card>
        
        <Card className="premium-card group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Executors</CardTitle>
            <div className="p-2 bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-lg group-hover:from-purple-500/20 group-hover:to-purple-600/20 transition-all duration-300">
              <Server className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
              {executors.filter(e => e.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-600">100%</span> uptime
            </p>
          </CardContent>
        </Card>
        
        <Card className="premium-card group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Test Suites</CardTitle>
            <div className="p-2 bg-gradient-to-br from-orange-500/10 to-orange-600/10 rounded-lg group-hover:from-orange-500/20 group-hover:to-orange-600/20 transition-all duration-300">
              <Layers className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">
              {testSuites.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-600">Active</span> monitoring
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Premium Activity Sections */}
      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="premium-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-lg">
                <Play className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              Recent Test Runs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {testRuns.slice(0, 3).map(run => (
              <TestRunCard key={run.id} run={run} />
            ))}
            {testRuns.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Play className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No test runs yet</p>
                <p className="text-sm">Create and run your first test to get started</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="premium-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {testDefinitions.slice(0, 3).map(definition => (
              <TestDefinitionCard
                key={definition.id}
                definition={definition}
                onRun={handleRunTest}
              />
            ))}
            {testDefinitions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No test definitions yet</p>
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  variant="outline"
                  size="sm"
                  className="mt-3"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Test
                </Button>
              </div>
            )}
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
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Test Definitions</h2>
                <p className="text-muted-foreground mt-1">
                  Create and manage your test definitions.
                </p>
              </div>
              <Button onClick={() => setShowCreateDialog(true)} className="btn-gradient-primary gap-2 px-6">
                <Plus className="h-4 w-4" />
                Create Test
              </Button>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {testDefinitions.map(definition => (
                <TestDefinitionCard
                  key={definition.id}
                  definition={definition}
                  onRun={handleRunTest}
                  onDelete={handleDeleteTest}
                />
              ))}
              {testDefinitions.length === 0 && (
                <div className="col-span-full">
                  <Card className="premium-card">
                    <CardContent className="text-center py-16">
                      <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <h3 className="text-xl font-semibold mb-2">No test definitions yet</h3>
                      <p className="text-muted-foreground mb-6">Get started by creating your first test definition</p>
                      <Button onClick={() => setShowCreateDialog(true)} className="btn-gradient-primary gap-2">
                        <Plus className="h-4 w-4" />
                        Create Your First Test
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        );

      case 'runs':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Test Runs</h2>
              <p className="text-muted-foreground mt-1">
                Monitor your test execution history and results.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {testRuns.map(run => (
                <TestRunCard key={run.id} run={run} />
              ))}
              {testRuns.length === 0 && (
                <div className="col-span-full">
                  <Card className="premium-card">
                    <CardContent className="text-center py-16">
                      <Play className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <h3 className="text-xl font-semibold mb-2">No test runs yet</h3>
                      <p className="text-muted-foreground mb-6">Run a test to see execution history here</p>
                      <Button onClick={() => setActiveTab('definitions')} variant="outline">
                        View Test Definitions
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        );

      case 'executors':
        return (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Executors</h2>
                <p className="text-muted-foreground mt-1">
                  Manage your test execution environments.
                </p>
              </div>
              <Button className="btn-gradient-primary gap-2 px-6">
                <Plus className="h-4 w-4" />
                Add Executor
              </Button>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {executors.map(executor => (
                <ExecutorCard key={executor.id} executor={executor} />
              ))}
            </div>
          </div>
        );

      case 'suites':
        return (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Test Suites</h2>
                <p className="text-muted-foreground mt-1">
                  Group and manage collections of related tests.
                </p>
              </div>
              <Button className="btn-gradient-primary gap-2 px-6">
                <Plus className="h-4 w-4" />
                Create Suite
              </Button>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {testSuites.map(suite => (
                <TestSuiteCard key={suite.id} suite={suite} />
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Premium Header */}
      <header className="premium-header sticky top-0 z-50 w-full">
        <div className="container flex h-16 items-center">
          <div className="mr-6 flex">
            <a className="mr-8 flex items-center space-x-3" href="/">
              <div className="relative">
                <Database className="h-8 w-8 text-primary" />
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-gradient-to-r from-green-400 to-blue-500 rounded-full animate-pulse"></div>
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">SparkTest</span>
            </a>
          </div>
          
          <nav className="flex items-center space-x-2 text-sm font-medium">
            {navigation.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={cn(
                  "nav-item flex items-center space-x-2",
                  activeTab === key ? "active" : ""
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <div className="w-full flex-1 md:w-auto md:flex-none">
              <div className="hidden md:flex items-center space-x-3 text-sm text-muted-foreground bg-muted/30 px-4 py-2 rounded-lg backdrop-blur-sm">
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                  <Database className="h-4 w-4" />
                  <span>{defaultConfig?.backend_url || 'http://localhost:3001'}</span>
                </div>
                <span>•</span>
                <span className="capitalize">{defaultConfig?.storage_mode || 'api'}</span>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        {renderTabContent()}
      </main>

      {/* Create Test Dialog */}
      <CreateTestDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreateTest={handleCreateTest}
      />
    </div>
  );
}