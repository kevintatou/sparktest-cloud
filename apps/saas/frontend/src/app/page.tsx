'use client';

import { useState, useEffect } from 'react';
import { Definition, Run, Executor, Suite } from '@tatou/core';
import { TestDefinitionCard, TestRunCard, ExecutorCard, TestSuiteCard } from '../../../../../packages/ui/src/index';
import { CreateTestDialog } from '@/components/create-test-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/theme-toggle';
import { useToast } from '@/hooks/use-toast';
import { Plus, Play, Settings, Database, LayoutDashboard, FileText, Server, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'definitions' | 'runs' | 'executors' | 'suites'>('dashboard');
  const [testDefinitions, setTestDefinitions] = useState<Definition[]>([]);
  const [testRuns, setTestRuns] = useState<Run[]>([]);
  const [executors, setExecutors] = useState<Executor[]>([]);
  const [testSuites, setTestSuites] = useState<Suite[]>([]);
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
        image: 'javascript',
        commands: ['console.log("Hello, world!");'],
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'Database Connection Test',
        description: 'Tests database connectivity and basic CRUD operations',
        image: 'python',
        commands: ['import sqlite3', 'print("Database test")'],
        createdAt: new Date().toISOString(),
      },
      {
        id: '3',
        name: 'Performance Benchmark',
        description: 'Load testing for API endpoints under high traffic conditions',
        image: 'rust',
        commands: ['fn main() { println!("Rust test"); }'],
        createdAt: new Date().toISOString(),
      },
    ]);

    // Sample test runs
    setTestRuns([
      {
        id: 'run-1',
        name: 'Basic API Test Run',
        image: 'javascript',
        command: ['console.log("Hello, world!");'],
        status: 'completed',
        createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        definitionId: '1',
        duration: 1250,
      },
      {
        id: 'run-2',
        name: 'Database Connection Test Run',
        image: 'python',
        command: ['import sqlite3', 'print("Database test")'],
        status: 'failed',
        createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        definitionId: '2',
        logs: ['Database connection failed: Connection timeout'],
      },
      {
        id: 'run-3',
        name: 'Performance Benchmark Run',
        image: 'rust',
        command: ['fn main() { println!("Rust test"); }'],
        status: 'running',
        createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
        definitionId: '3',
      },
    ]);

    // Sample executors
    setExecutors([
      {
        id: 'exec-1',
        name: 'Local Development',
        image: 'local-runner',
        description: 'Local development environment executor',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'exec-2',
        name: 'Kubernetes Cluster',
        image: 'k8s-runner',
        description: 'Kubernetes cluster executor for production workloads',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'exec-3',
        name: 'Docker Swarm',
        image: 'docker-runner',
        description: 'Docker Swarm executor for distributed testing',
        createdAt: new Date().toISOString(),
      },
    ]);

    // Sample test suites
    setTestSuites([
      {
        id: 'suite-1',
        name: 'API Test Suite',
        description: 'Complete API testing suite including auth, CRUD, and performance tests',
        testDefinitionIds: ['1', '2'],
        createdAt: new Date().toISOString(),
        executionMode: 'sequential',
      },
      {
        id: 'suite-2',
        name: 'End-to-End Tests',
        description: 'Full application workflow testing',
        testDefinitionIds: ['1', '2', '3'],
        createdAt: new Date().toISOString(),
        executionMode: 'parallel',
      },
    ]);
  }, []);

  const handleCreateTest = (testData: Omit<Definition, 'id' | 'createdAt'>) => {
    const newTest: Definition = {
      ...testData,
      id: `test-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setTestDefinitions([...testDefinitions, newTest]);
    toast({
      title: "Test Created",
      description: `"${newTest.name}" has been created successfully.`,
    });
  };

  const handleRunTest = (definitionId: string) => {
    const definition = testDefinitions.find(d => d.id === definitionId);
    const newRun: Run = {
      id: `run-${Date.now()}`,
      name: `${definition?.name} Run`,
      image: definition?.image || 'default',
      command: definition?.commands || ['echo "test"'],
      status: 'running',
      createdAt: new Date().toISOString(),
      definitionId: definitionId,
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
          ? { ...run, status: 'completed' as const, duration: Math.floor(Math.random() * 3000) + 500 }
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
      {/* Clean Hero Section */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your tests today.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <Button 
            size="lg" 
            onClick={() => setShowCreateDialog(true)} 
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Create New Test
          </Button>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
            <span>All systems operational</span>
          </div>
        </div>
      </div>

      {/* Clean Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{testDefinitions.length}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+2</span> this week
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Runs</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{testRuns.length}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+5</span> today
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Executors</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{executors.length}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">100%</span> uptime
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Test Suites</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{testSuites.length}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">Active</span> monitoring
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Clean Activity Sections */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
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
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
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
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Test Definitions</h2>
                <p className="text-muted-foreground">
                  Create and manage your test definitions.
                </p>
              </div>
              <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Test
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                  <Card>
                    <CardContent className="text-center py-12">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">No test definitions yet</h3>
                      <p className="text-muted-foreground mb-4">Get started by creating your first test definition</p>
                      <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
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
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Test Runs</h2>
              <p className="text-muted-foreground">
                Monitor your test execution history and results.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {testRuns.map(run => (
                <TestRunCard key={run.id} run={run} />
              ))}
              {testRuns.length === 0 && (
                <div className="col-span-full">
                  <Card>
                    <CardContent className="text-center py-12">
                      <Play className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">No test runs yet</h3>
                      <p className="text-muted-foreground mb-4">Run a test to see execution history here</p>
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
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
                <Card key={executor.id}>
                  <CardContent className="p-4">
                    <h3 className="font-semibold">{executor.name}</h3>
                    <p className="text-sm text-muted-foreground">{executor.description}</p>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Image: {executor.image}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'suites':
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
                <TestSuiteCard key={suite.id} suite={suite} />
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Refined Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 hidden md:flex">
            <a className="mr-6 flex items-center space-x-2" href="/">
              <Database className="h-6 w-6 text-primary" />
              <span className="hidden font-bold sm:inline-block">SparkTest</span>
            </a>
            <nav className="flex items-center space-x-6 text-sm font-medium">
              {navigation.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as any)}
                  className={cn(
                    "flex items-center space-x-2 px-3 py-2 rounded-md transition-colors",
                    activeTab === key 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
          </div>
          
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <div className="w-full flex-1 md:w-auto md:flex-none">
              <div className="hidden md:flex items-center space-x-2 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <Database className="h-4 w-4" />
                  <span>http://localhost:3001</span>
                </div>
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

      {/* Create Test Dialog */}
      <CreateTestDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreateTest={handleCreateTest}
      />
    </div>
  );
}