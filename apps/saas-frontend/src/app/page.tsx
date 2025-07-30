'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// SparkTest core imports
import { 
  type Definition, 
  type Run, 
  type Suite,
  type Executor,
  sampleDefinitions,
  sampleRuns,
  sampleSuites,
  sampleExecutors,
  formatDistanceToNow
} from "@tatou/core";

import { LocalStorageService } from "@tatou/storage-service";

// Icons
import { 
  Play, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Users,
  Activity,
  Settings,
  Database,
  Server,
  Zap
} from "lucide-react";

export default function SparkTestDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [definitions, setDefinitions] = useState<Definition[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [suites, setSuites] = useState<Suite[]>([]);
  const [executors, setExecutors] = useState<Executor[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const storageService = new LocalStorageService();

  // Initialize with sample data
  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      try {
        // Load existing data or initialize with samples
        const existingDefinitions = await storageService.getDefinitions();

        if (existingDefinitions.length === 0) {
          // Initialize with sample data
          for (const def of sampleDefinitions) {
            await storageService.createDefinition(def);
          }
          for (const run of sampleRuns) {
            await storageService.createRun(run);
          }
          for (const suite of sampleSuites) {
            await storageService.createSuite(suite);
          }
          for (const executor of sampleExecutors) {
            await storageService.createExecutor(executor);
          }
        }

        // Load current data
        setDefinitions(await storageService.getDefinitions());
        setRuns(await storageService.getRuns());
        setSuites(await storageService.getSuites());
        setExecutors(await storageService.getExecutors());
      } catch (error) {
        console.error('Failed to initialize data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, []);

  const executeTest = async (definition: Definition) => {
    setIsLoading(true);
    try {
      const newRun = await storageService.createRun({
        name: `${definition.name} - ${new Date().toLocaleTimeString()}`,
        image: definition.image,
        command: definition.commands,
        status: 'running',
        definitionId: definition.id,
        executorId: definition.executorId,
        variables: definition.variables,
        artifacts: [],
        logs: [`> Starting ${definition.name}...`, '> Initializing container...'],
      });

      // Simulate test execution
      setTimeout(async () => {
        const status = Math.random() > 0.3 ? 'completed' : 'failed';
        await storageService.updateRun(newRun.id, {
          status,
          duration: Math.floor(Math.random() * 60000) + 5000, // 5-65 seconds
          logs: [
            ...newRun.logs || [],
            '> Container started',
            '> Running tests...',
            status === 'completed' ? '✅ Tests completed successfully' : '❌ Tests failed'
          ]
        });
        setRuns(await storageService.getRuns());
      }, 2000);

      setRuns(await storageService.getRuns());
    } catch (error) {
      console.error('Failed to execute test:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running': return <Badge className="bg-blue-500">Running</Badge>;
      case 'completed': return <Badge className="bg-green-500">Completed</Badge>;
      case 'failed': return <Badge variant="destructive">Failed</Badge>;
      default: return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const stats = {
    totalTests: definitions.length,
    totalRuns: runs.length,
    successRate: runs.length > 0 ? Math.round((runs.filter(r => r.status === 'completed').length / runs.length) * 100) : 0,
    averageRunTime: runs.length > 0 ? Math.round(runs.filter(r => r.duration).reduce((acc, r) => acc + (r.duration || 0), 0) / runs.filter(r => r.duration).length / 1000) : 0
  };

  if (isLoading && definitions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading SparkTest...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Zap className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">SparkTest</h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Kubernetes Test Orchestration Platform
          </p>
          <div className="flex justify-center items-center gap-4 mt-4">
            <Badge variant="secondary">OSS Edition</Badge>
            <Badge variant="outline">v0.2.0</Badge>
            <Badge>K8s Ready</Badge>
          </div>
        </header>

        {/* Navigation */}
        <div className="flex justify-center mb-8">
          <div className="flex gap-2 p-1 bg-muted rounded-lg">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Activity },
              { id: 'definitions', label: 'Test Definitions', icon: Database },
              { id: 'runs', label: 'Test Runs', icon: Server },
              { id: 'suites', label: 'Test Suites', icon: Users },
              { id: 'executors', label: 'Executors', icon: Settings }
            ].map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2"
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
                  <Database className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalTests}</div>
                  <p className="text-xs text-muted-foreground">Test definitions available</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Runs</CardTitle>
                  <Server className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalRuns}</div>
                  <p className="text-xs text-muted-foreground">Executions completed</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.successRate}%</div>
                  <p className="text-xs text-muted-foreground">Tests passing</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Runtime</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.averageRunTime}s</div>
                  <p className="text-xs text-muted-foreground">Average execution time</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Runs */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Test Runs</CardTitle>
                <CardDescription>Latest test executions and their status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {runs.slice(0, 5).map((run) => (
                    <div key={run.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(run.status)}
                        <div>
                          <h4 className="font-medium">{run.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {formatDistanceToNow(run.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {run.duration && (
                          <span className="text-sm text-muted-foreground">
                            {Math.round(run.duration / 1000)}s
                          </span>
                        )}
                        {getStatusBadge(run.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Test Definitions Tab */}
        {activeTab === 'definitions' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Test Definitions</CardTitle>
                <CardDescription>
                  Reusable test configurations that can be executed as Kubernetes jobs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {definitions.map((definition) => (
                    <Card key={definition.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base">{definition.name}</CardTitle>
                            <CardDescription className="text-sm mt-1">
                              {definition.description}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Image</p>
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {definition.image}
                            </code>
                          </div>
                          
                          {definition.labels && (
                            <div className="flex flex-wrap gap-1">
                              {definition.labels.map((label) => (
                                <Badge key={label} variant="outline" className="text-xs">
                                  {label}
                                </Badge>
                              ))}
                            </div>
                          )}

                          <Button 
                            size="sm" 
                            onClick={() => executeTest(definition)}
                            disabled={isLoading}
                            className="w-full"
                          >
                            <Play className="h-3 w-3 mr-2" />
                            Run Test
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Test Runs Tab */}
        {activeTab === 'runs' && (
          <Card>
            <CardHeader>
              <CardTitle>Test Runs</CardTitle>
              <CardDescription>
                History of test executions with logs and artifacts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {runs.map((run) => (
                  <Card key={run.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(run.status)}
                          <div>
                            <CardTitle className="text-base">{run.name}</CardTitle>
                            <CardDescription>
                              Started {formatDistanceToNow(run.createdAt)}
                              {run.duration && ` • Duration: ${Math.round(run.duration / 1000)}s`}
                            </CardDescription>
                          </div>
                        </div>
                        {getStatusBadge(run.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium mb-2">Command</p>
                          <code className="text-xs bg-muted p-2 rounded block">
                            {Array.isArray(run.command) ? run.command.join(' && ') : run.command}
                          </code>
                        </div>
                        
                        {run.logs && run.logs.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-2">Logs</p>
                            <div className="bg-black text-green-400 p-3 rounded text-xs font-mono max-h-32 overflow-y-auto">
                              {run.logs.map((log, index) => (
                                <div key={index}>{log}</div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Test Suites Tab */}
        {activeTab === 'suites' && (
          <Card>
            <CardHeader>
              <CardTitle>Test Suites</CardTitle>
              <CardDescription>
                Grouped test definitions for comprehensive testing scenarios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {suites.map((suite) => (
                  <Card key={suite.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{suite.name}</CardTitle>
                      <CardDescription>{suite.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium mb-2">Execution Mode</p>
                          <Badge variant={suite.executionMode === 'parallel' ? 'default' : 'secondary'}>
                            {suite.executionMode}
                          </Badge>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium mb-2">Tests ({suite.testDefinitionIds.length})</p>
                          <div className="text-sm text-muted-foreground space-y-1">
                            {suite.testDefinitionIds.map((defId) => {
                              const def = definitions.find(d => d.id === defId);
                              return def ? (
                                <div key={defId}>• {def.name}</div>
                              ) : (
                                <div key={defId}>• {defId}</div>
                              );
                            })}
                          </div>
                        </div>

                        {suite.labels && (
                          <div className="flex flex-wrap gap-1">
                            {suite.labels.map((label) => (
                              <Badge key={label} variant="outline" className="text-xs">
                                {label}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Executors Tab */}
        {activeTab === 'executors' && (
          <Card>
            <CardHeader>
              <CardTitle>Test Executors</CardTitle>
              <CardDescription>
                Predefined test execution environments and configurations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {executors.map((executor) => (
                  <Card key={executor.id}>
                    <CardHeader>
                      <CardTitle className="text-base">{executor.name}</CardTitle>
                      <CardDescription>{executor.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Image</p>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {executor.image}
                          </code>
                        </div>

                        {executor.supportedFileTypes && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Supported Files</p>
                            <div className="flex flex-wrap gap-1">
                              {executor.supportedFileTypes.map((type) => (
                                <Badge key={type} variant="outline" className="text-xs">
                                  .{type}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <p className="text-xs text-muted-foreground">
                          Created {formatDistanceToNow(executor.createdAt)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
