'use client';

import { useState, useEffect } from 'react';
import { Definition, Run, Executor, Suite } from '@tatou/core';
import { TestDefinitionCard, TestRunCard, ExecutorCard, TestSuiteCard } from '@tatou/ui';
import { CreateTestDialog } from '@/components/create-test-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/theme-toggle';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, Play, Settings, Database, LayoutDashboard, FileText, Server, Layers,
  Users, Building2, BarChart3, Bell, Plug, CreditCard, Folder,
  BookOpen, Monitor, GitBranch, Menu, ChevronDown, User, ChevronRight,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

type NavigationKey = 
  | 'dashboard' | 'definitions' | 'runs' | 'executors' | 'suites'
  | 'teams' | 'users' | 'billing' | 'analytics' | 'monitoring' 
  | 'integrations' | 'audit' | 'projects' | 'docs' | 'settings';

export default function Home() {
  const [activeTab, setActiveTab] = useState<NavigationKey>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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

  const navigationGroups = [
    {
      title: 'Testing',
      items: [
        { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { key: 'definitions', label: 'Test Definitions', icon: FileText },
        { key: 'runs', label: 'Test Runs', icon: Play },
        { key: 'executors', label: 'Executors', icon: Server },
        { key: 'suites', label: 'Test Suites', icon: Layers },
      ]
    },
    {
      title: 'Organization',
      items: [
        { key: 'projects', label: 'Projects', icon: Folder },
        { key: 'teams', label: 'Teams', icon: Users },
        { key: 'users', label: 'User Management', icon: User },
        { key: 'billing', label: 'Billing & Plans', icon: CreditCard },
      ]
    },
    {
      title: 'Analytics & Monitoring',
      items: [
        { key: 'analytics', label: 'Analytics', icon: BarChart3 },
        { key: 'monitoring', label: 'Monitoring & Alerts', icon: Monitor },
        { key: 'audit', label: 'Audit Logs', icon: BookOpen },
      ]
    },
    {
      title: 'Platform',
      items: [
        { key: 'integrations', label: 'Integrations', icon: Plug },
        { key: 'docs', label: 'API Documentation', icon: GitBranch },
        { key: 'settings', label: 'Settings', icon: Settings },
      ]
    }
  ];

  const renderDashboard = () => (
    <div className="space-y-8">
      {/* Hero Section */}
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
          <div className="flex items-center space-x-2 text-sm text-muted-foreground bg-muted/30 px-3 py-2 rounded-md">
            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
            <span>All systems operational</span>
          </div>
        </div>
      </div>

      {/* Stats Cards with Simple Styling */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
            <div className="p-2 bg-blue-50 rounded-md">
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
        
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Runs</CardTitle>
            <div className="p-2 bg-green-50 rounded-md">
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
        
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Executors</CardTitle>
            <div className="p-2 bg-purple-50 rounded-md">
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
        
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Test Suites</CardTitle>
            <div className="p-2 bg-orange-50 rounded-md">
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

      {/* Activity Sections */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="border-b">
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
              <div className="text-center py-6 text-muted-foreground">
                <div className="p-2 bg-muted/30 rounded-md w-fit mx-auto mb-3">
                  <Play className="h-5 w-5 opacity-50" />
                </div>
                <p className="text-sm">No test runs yet</p>
                <p className="text-xs">Create and run your first test to get started</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="border-b">
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
              <div className="text-center py-6 text-muted-foreground">
                <div className="p-2 bg-muted/30 rounded-md w-fit mx-auto mb-3">
                  <FileText className="h-5 w-5 opacity-50" />
                </div>
                <p className="text-sm">No test definitions yet</p>
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

      case 'projects':
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Projects</h2>
                <p className="text-muted-foreground">
                  Organize your tests into projects for better management.
                </p>
              </div>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Project
              </Button>
            </div>
            <Card>
              <CardContent className="text-center py-12">
                <Folder className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
                <p className="text-muted-foreground mb-4">Create projects to organize your tests and collaborate with teams</p>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Your First Project
                </Button>
              </CardContent>
            </Card>
          </div>
        );

      case 'teams':
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Teams</h2>
                <p className="text-muted-foreground">
                  Manage your organization's teams and collaboration.
                </p>
              </div>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Team
              </Button>
            </div>
            <Card>
              <CardContent className="text-center py-12">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No teams configured</h3>
                <p className="text-muted-foreground mb-4">Set up teams to collaborate on test projects</p>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Your First Team
                </Button>
              </CardContent>
            </Card>
          </div>
        );

      case 'users':
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
                <p className="text-muted-foreground">
                  Manage users, roles, and permissions across your organization.
                </p>
              </div>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Invite User
              </Button>
            </div>
            <Card>
              <CardContent className="text-center py-12">
                <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">User management</h3>
                <p className="text-muted-foreground mb-4">Invite team members and manage permissions</p>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Invite Team Members
                </Button>
              </CardContent>
            </Card>
          </div>
        );

      case 'billing':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Billing & Plans</h2>
              <p className="text-muted-foreground">
                Manage your subscription, billing, and usage.
              </p>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Current Plan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Professional Plan</span>
                      <span className="text-2xl font-bold">$29/mo</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Unlimited tests, 5 team members, priority support
                    </p>
                    <Button variant="outline" className="w-full">
                      Manage Subscription
                    </Button>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Usage This Month</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Test Runs</span>
                      <span className="font-medium">1,245 / ∞</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Team Members</span>
                      <span className="font-medium">3 / 5</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Storage Used</span>
                      <span className="font-medium">2.4GB / 10GB</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Analytics</h2>
              <p className="text-muted-foreground">
                Insights and metrics about your test performance and trends.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">94.2%</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-600">+2.1%</span> from last month
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
                  <Monitor className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">2.4min</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-600">-0.3min</span> faster
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Runs</CardTitle>
                  <Play className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1,245</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-600">+12%</span> this month
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Failed Tests</CardTitle>
                  <Bell className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">72</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-red-600">+5</span> this week
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'monitoring':
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Monitoring & Alerts</h2>
                <p className="text-muted-foreground">
                  Set up alerts and monitor your test infrastructure health.
                </p>
              </div>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Alert
              </Button>
            </div>
            <Card>
              <CardContent className="text-center py-12">
                <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No alerts configured</h3>
                <p className="text-muted-foreground mb-4">Set up monitoring and alerts for your test infrastructure</p>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Configure Your First Alert
                </Button>
              </CardContent>
            </Card>
          </div>
        );

      case 'integrations':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Integrations</h2>
              <p className="text-muted-foreground">
                Connect SparkTest with your development tools and workflows.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[
                { name: 'GitHub Actions', description: 'Integrate with CI/CD workflows', connected: true },
                { name: 'Slack', description: 'Get notifications in Slack', connected: false },
                { name: 'Jira', description: 'Link test results to issues', connected: false },
                { name: 'Discord', description: 'Team notifications', connected: false },
                { name: 'Webhook', description: 'Custom HTTP callbacks', connected: false },
              ].map((integration) => (
                <Card key={integration.name}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{integration.name}</h3>
                      <div className={cn(
                        "h-2 w-2 rounded-full",
                        integration.connected ? "bg-green-500" : "bg-gray-300"
                      )} />
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{integration.description}</p>
                    <Button 
                      variant={integration.connected ? "outline" : "default"} 
                      size="sm" 
                      className="w-full"
                    >
                      {integration.connected ? 'Configure' : 'Connect'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'audit':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Audit Logs</h2>
              <p className="text-muted-foreground">
                Track all user actions and system events for compliance and security.
              </p>
            </div>
            <Card>
              <CardContent className="text-center py-12">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Audit logs</h3>
                <p className="text-muted-foreground mb-4">All user actions and system events are logged here</p>
                <Button variant="outline">
                  View Recent Activity
                </Button>
              </CardContent>
            </Card>
          </div>
        );

      case 'docs':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">API Documentation</h2>
              <p className="text-muted-foreground">
                Complete API reference and integration guides.
              </p>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Start</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Get started with the SparkTest API in minutes
                  </p>
                  <Button className="w-full">
                    View Quick Start Guide
                  </Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>API Reference</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Complete API documentation with examples
                  </p>
                  <Button variant="outline" className="w-full">
                    Browse API Reference
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
              <p className="text-muted-foreground">
                Configure your organization and platform preferences.
              </p>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Organization Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Organization Name</label>
                    <p className="text-sm text-muted-foreground">Acme Corp</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Custom Domain</label>
                    <p className="text-sm text-muted-foreground">tests.acmecorp.com</p>
                  </div>
                  <Button variant="outline" className="w-full">
                    Edit Organization
                  </Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Platform Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Default Executor</label>
                    <p className="text-sm text-muted-foreground">Kubernetes Cluster</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Retention Policy</label>
                    <p className="text-sm text-muted-foreground">90 days</p>
                  </div>
                  <Button variant="outline" className="w-full">
                    Configure Platform
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Enhanced Header */}
      <header className="bg-background border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="p-2 bg-muted/50 rounded-lg border">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  SparkTest
                </h1>
                <p className="text-xs text-muted-foreground">Test Execution Platform</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2 bg-muted/50 px-3 py-1.5 rounded-md border">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <Database className="h-4 w-4" />
                <span>http://localhost:3001</span>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar with Simple Styling */}
        <aside className={cn(
          "fixed inset-y-0 left-0 z-50 bg-background border-r transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          sidebarCollapsed ? "w-16" : "w-72"
        )}>
          <div className="flex flex-col h-full pt-16 lg:pt-0">
            {/* Sidebar Header - only show when not collapsed */}
            {!sidebarCollapsed && (
              <div className="px-4 py-4 border-b">
                {/* Header content removed for cleaner look */}
              </div>
            )}

            <div className="flex-1 overflow-y-auto py-6">
              <nav className={cn("space-y-6", sidebarCollapsed ? "px-2" : "px-4")}>
                {navigationGroups.map((group) => (
                  <div key={group.title}>
                    {!sidebarCollapsed && (
                      <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {group.title}
                      </h3>
                    )}
                    <div className="space-y-1">
                      {group.items.map(({ key, label, icon: Icon }) => (
                        <button
                          key={key}
                          onClick={() => {
                            setActiveTab(key as NavigationKey);
                            if (window.innerWidth < 1024) setSidebarOpen(false);
                          }}
                          className={cn(
                            "group flex items-center w-full rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer",
                            sidebarCollapsed ? "p-3 justify-center" : "space-x-3 px-3 py-2",
                            activeTab === key
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/80 hover:scale-[1.02]"
                          )}
                          title={sidebarCollapsed ? label : undefined}
                        >
                          <Icon className={cn(
                            "flex-shrink-0",
                            sidebarCollapsed ? "h-5 w-5" : "h-4 w-4"
                          )} />
                          {!sidebarCollapsed && (
                            <span className="truncate">{label}</span>
                          )}
                          {/* Active indicator dot for collapsed mode */}
                          {sidebarCollapsed && activeTab === key && (
                            <div className="absolute -top-1 -right-1 h-2 w-2 bg-primary-foreground rounded-full"></div>
                          )}
                        </button>
                      ))}
                    </div>
                    {sidebarCollapsed && group !== navigationGroups[navigationGroups.length - 1] && (
                      <div className="h-px bg-border/50 mx-2 my-3"></div>
                    )}
                  </div>
                ))}
              </nav>
            </div>

            {/* Sidebar Footer with Collapse Toggle */}
            <div className={cn("p-4 border-t", sidebarCollapsed && "px-2")}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSidebarCollapsed(!sidebarCollapsed);
                  // On mobile, also close the sidebar when collapsing
                  if (window.innerWidth < 1024 && !sidebarCollapsed) {
                    setSidebarOpen(false);
                  }
                }}
                className={cn(
                  "w-full justify-start group",
                  sidebarCollapsed && "justify-center px-0"
                )}
                title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <ChevronRight className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  !sidebarCollapsed && "rotate-180"
                )} />
                {!sidebarCollapsed && <span className="ml-2 text-xs">Collapse</span>}
              </Button>
            </div>
          </div>
        </aside>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/20 z-40 lg:hidden" 
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content with Dynamic Margin */}
        <main className={cn(
          "flex-1 transition-all duration-300 ease-in-out lg:ml-0",
          sidebarCollapsed ? "lg:ml-16" : "lg:ml-0"
        )}>
          <div className="container mx-auto px-4 py-8 max-w-7xl">
            {renderTabContent()}
          </div>
        </main>
      </div>

      {/* Create Test Dialog */}
      <CreateTestDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreateTest={handleCreateTest}
      />
    </div>
  );
}