'use client';

import { useState, useEffect } from 'react';
import { TestDefinition, TestRun, Executor, TestSuite, defaultConfig } from '@sparktest/core';
import { 
  Button, 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarNav,
  SidebarNavItem,
  ThemeToggle
} from '@sparktest/ui';
import { Plus, Play, Settings, Database, BarChart3, Code2, Server, Package, Zap } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

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
      {
        id: '3',
        name: 'Load Test',
        description: 'Performance testing for high load scenarios',
        code: 'use std::time::Instant;\nprintln!("Load test");',
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
        result: { success: true, output: 'Hello, world!' },
        created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
        updated_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      },
      {
        id: 'run-2',
        definition_id: '2',
        status: 'failed',
        error: 'Database connection failed',
        created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 minutes ago
        updated_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      },
      {
        id: 'run-3',
        definition_id: '3',
        status: 'running',
        created_at: new Date(Date.now() - 1000 * 60 * 2).toISOString(), // 2 minutes ago
        updated_at: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
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
        status: 'active',
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
    toast({
      title: "Test Created",
      description: `Created "${newTest.name}" successfully.`,
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
          ? { ...run, status: 'completed' as const, result: { success: true } }
          : run
      ));
      toast({
        title: "Test Completed",
        description: `"${definition?.name}" executed successfully.`,
      });
    }, 3000);
  };

  const handleDeleteTest = (id: string) => {
    const definition = testDefinitions.find(d => d.id === id);
    setTestDefinitions(testDefinitions.filter(t => t.id !== id));
    toast({
      title: "Test Deleted",
      description: `Deleted "${definition?.name}".`,
      variant: "destructive",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-500';
      case 'running': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-500';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-500';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-500';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-500';
    }
  };

  const getLanguageIcon = (language: string) => {
    switch (language) {
      case 'javascript': return '🟨';
      case 'python': return '🐍';
      case 'rust': return '🦀';
      default: return '📄';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const renderDashboard = () => (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's what's happening with your tests.</p>
        </div>
        <Button onClick={handleCreateTest} size="lg" className="gap-2">
          <Plus className="h-4 w-4" />
          New Test
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
            <Code2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{testDefinitions.length}</div>
            <p className="text-xs text-muted-foreground">definitions created</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Test Runs</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{testRuns.length}</div>
            <p className="text-xs text-muted-foreground">runs this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">67%</div>
            <p className="text-xs text-muted-foreground">last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Executors</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{executors.filter(e => e.status === 'active').length}</div>
            <p className="text-xs text-muted-foreground">active executors</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Test Runs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Test Runs</CardTitle>
          <CardDescription>Latest test executions and their results</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {testRuns.slice(0, 5).map(run => {
            const definition = testDefinitions.find(d => d.id === run.definition_id);
            return (
              <div key={run.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getLanguageIcon(definition?.language || '')}</span>
                    <div>
                      <p className="font-medium">{definition?.name || 'Unknown Test'}</p>
                      <p className="text-sm text-muted-foreground">
                        Run {run.id.slice(-8)} • {formatTimeAgo(run.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(run.status)}`}>
                    {run.status}
                  </span>
                  {run.status === 'completed' && (
                    <Button variant="ghost" size="sm">
                      View Results
                    </Button>
                  )}
                  {definition && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleRunTest(definition.id)}
                      className="gap-1"
                    >
                      <Play className="h-3 w-3" />
                      Run Again
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );

  const renderDefinitions = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Test Definitions</h1>
          <p className="text-muted-foreground">Manage your test definitions and configurations.</p>
        </div>
        <Button onClick={handleCreateTest} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Test
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {testDefinitions.map(definition => (
          <Card key={definition.id} className="group hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-lg">{getLanguageIcon(definition.language)}</span>
                {definition.name}
              </CardTitle>
              <CardDescription>{definition.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="px-2 py-1 bg-secondary rounded text-xs font-medium">
                  {definition.language}
                </span>
                <span>•</span>
                <span>Updated {formatTimeAgo(definition.updated_at)}</span>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Edit
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => handleDeleteTest(definition.id)}
                >
                  Delete
                </Button>
              </div>
              <Button 
                onClick={() => handleRunTest(definition.id)}
                size="sm"
                className="gap-1"
              >
                <Play className="h-3 w-3" />
                Run
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderRuns = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Test Runs</h1>
        <p className="text-muted-foreground">Monitor your test executions and results.</p>
      </div>

      <div className="space-y-4">
        {testRuns.map(run => {
          const definition = testDefinitions.find(d => d.id === run.definition_id);
          return (
            <Card key={run.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{getLanguageIcon(definition?.language || '')}</span>
                    <div>
                      <p>{definition?.name || 'Unknown Test'}</p>
                      <p className="text-sm text-muted-foreground font-normal">
                        Run {run.id.slice(-8)}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(run.status)}`}>
                    {run.status}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Started {formatTimeAgo(run.created_at)}</span>
                  {run.result && (
                    <span>• Output: {JSON.stringify(run.result)}</span>
                  )}
                  {run.error && (
                    <span className="text-red-600">• Error: {run.error}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderExecutors = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Executors</h1>
          <p className="text-muted-foreground">Manage your test execution environments.</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Executor
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {executors.map(executor => (
          <Card key={executor.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  {executor.name}
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  executor.status === 'active' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-500'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-500'
                }`}>
                  {executor.status}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-secondary rounded text-xs font-medium">
                    {executor.type}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Config: {JSON.stringify(executor.config)}
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" size="sm">
                Configure
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Edit
                </Button>
                <Button variant="destructive" size="sm">
                  Delete
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderSuites = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Test Suites</h1>
          <p className="text-muted-foreground">Organize and run collections of tests together.</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Suite
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {testSuites.map(suite => (
          <Card key={suite.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {suite.name}
              </CardTitle>
              <CardDescription>{suite.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {suite.test_definitions.length} test{suite.test_definitions.length !== 1 ? 's' : ''} included
              </p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Edit
                </Button>
                <Button variant="destructive" size="sm">
                  Delete
                </Button>
              </div>
              <Button size="sm" className="gap-1">
                <Play className="h-3 w-3" />
                Run Suite
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return renderDashboard();
      case 'definitions': return renderDefinitions();
      case 'runs': return renderRuns();
      case 'executors': return renderExecutors();
      case 'suites': return renderSuites();
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Zap className="h-5 w-5" />
              SparkTest
            </h1>
            <ThemeToggle />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarNav>
            <SidebarNavItem
              isActive={activeTab === 'dashboard'}
              onClick={() => setActiveTab('dashboard')}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Dashboard
            </SidebarNavItem>
            <SidebarNavItem
              isActive={activeTab === 'definitions'}
              onClick={() => setActiveTab('definitions')}
            >
              <Code2 className="mr-2 h-4 w-4" />
              Test Definitions
            </SidebarNavItem>
            <SidebarNavItem
              isActive={activeTab === 'runs'}
              onClick={() => setActiveTab('runs')}
            >
              <Play className="mr-2 h-4 w-4" />
              Test Runs
            </SidebarNavItem>
            <SidebarNavItem
              isActive={activeTab === 'executors'}
              onClick={() => setActiveTab('executors')}
            >
              <Server className="mr-2 h-4 w-4" />
              Executors
            </SidebarNavItem>
            <SidebarNavItem
              isActive={activeTab === 'suites'}
              onClick={() => setActiveTab('suites')}
            >
              <Package className="mr-2 h-4 w-4" />
              Test Suites
            </SidebarNavItem>
          </SidebarNav>
          
          {/* Backend Status */}
          <div className="mt-auto p-4 border-t">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Database className="h-3 w-3" />
              <div>
                <p>Backend: {defaultConfig.backend_url}</p>
                <p>Mode: {defaultConfig.storage_mode}</p>
              </div>
            </div>
          </div>
        </SidebarContent>
      </Sidebar>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}