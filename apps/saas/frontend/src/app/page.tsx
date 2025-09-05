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
      {/* Enhanced Hero Section */}
      <div className="space-y-4">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent rounded-lg opacity-50"></div>
          <div className="relative p-6 rounded-lg">
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome back
            </h1>
            <p className="text-muted-foreground">
              Here's what's happening with your tests today.
            </p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <Button 
            size="lg" 
            onClick={() => setShowCreateDialog(true)} 
            className="gap-2 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md"
          >
            <Plus className="h-4 w-4" />
            Create New Test
          </Button>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground bg-muted/30 px-3 py-2 rounded-md">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>All systems operational</span>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Cards with Subtle Spark */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
            <div className="p-2 bg-blue-500/10 rounded-md">
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{testDefinitions.length}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 font-medium">+2</span> this week
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Runs</CardTitle>
            <div className="p-2 bg-green-500/10 rounded-md">
              <Play className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{testRuns.length}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 font-medium">+5</span> today
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500 hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Executors</CardTitle>
            <div className="p-2 bg-purple-500/10 rounded-md">
              <Server className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{executors.length}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 font-medium">100%</span> uptime
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-orange-500 hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Test Suites</CardTitle>
            <div className="p-2 bg-orange-500/10 rounded-md">
              <Layers className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{testSuites.length}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 font-medium">Active</span> monitoring
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Activity Sections */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="bg-gradient-to-r from-green-50 to-transparent border-b">
            <CardTitle className="flex items-center gap-2">
              <div className="p-1.5 bg-green-100 rounded-md">
                <Play className="h-4 w-4 text-green-600" />
              </div>
              Recent Test Runs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {testRuns.slice(0, 3).map(run => (
              <TestRunCard key={run.id} run={run} />
            ))}
            {testRuns.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <div className="p-3 bg-muted/30 rounded-full w-fit mx-auto mb-3">
                  <Play className="h-8 w-8 opacity-50" />
                </div>
                <p>No test runs yet</p>
                <p className="text-sm">Create and run your first test to get started</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent border-b">
            <CardTitle className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 rounded-md">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {testDefinitions.slice(0, 3).map(definition => (
              <TestDefinitionCard
                key={definition.id}
                definition={definition}
                onRun={handleRunTest}
              />
            ))}
            {testDefinitions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <div className="p-3 bg-muted/30 rounded-full w-fit mx-auto mb-3">
                  <FileText className="h-8 w-8 opacity-50" />
                </div>
                <p>No test definitions yet</p>
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  variant="outline"
                  size="sm"
                  className="mt-3 hover:bg-primary hover:text-primary-foreground"
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
      {/* Enhanced Header with Subtle Gradient */}
      <header className="bg-gradient-to-r from-background via-background to-primary/5 border-b shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Database className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">SparkTest</h1>
                <p className="text-xs text-muted-foreground">Test Execution Platform</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2 bg-muted/50 px-3 py-1.5 rounded-md">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                <Database className="h-4 w-4" />
                <span>http://localhost:3001</span>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* OSS-Style Navigation with Subtle Enhancements */}
      <nav className="bg-background border-b">
        <div className="container mx-auto px-4">
          <div className="flex space-x-8">
            {navigation.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={cn(
                  "flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-all duration-200",
                  activeTab === key
                    ? "border-primary text-primary bg-primary/5"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-primary/30"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
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