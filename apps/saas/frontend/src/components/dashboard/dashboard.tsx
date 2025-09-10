'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TestDefinitionCard, TestRunCard } from '@tatou/ui';
import { Definition, Run, Executor, Suite } from '@tatou/core';
import { Plus, Play, Server, Layers, FileText } from 'lucide-react';

export interface DashboardProps {
  testDefinitions: Definition[];
  testRuns: Run[];
  executors: Executor[];
  testSuites: Suite[];
  loading: boolean;
  setShowCreateDialog: (show: boolean) => void;
  handleRunTest: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  testDefinitions,
  testRuns,
  executors,
  testSuites,
  loading,
  setShowCreateDialog,
  handleRunTest,
}) => {
  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome back
            </h1>
            <p className="text-muted-foreground">
              Loading your test data...
            </p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border-l-4 border-l-gray-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Loading...</CardTitle>
                <div className="p-2 bg-gray-50 rounded-md animate-pulse">
                  <div className="h-4 w-4 bg-gray-300 rounded" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">--</div>
                <p className="text-xs text-muted-foreground">
                  Please wait...
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
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
        
        <div>
          <Button 
            size="lg" 
            onClick={() => setShowCreateDialog(true)} 
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Create New Definition
          </Button>
        </div>
      </div>

      {/* Stats Cards with Simple Styling */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Definitions</CardTitle>
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
            <CardTitle className="text-sm font-medium">Suites</CardTitle>
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
              Recent Runs
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
                <p className="text-sm">No runs yet</p>
                <p className="text-xs">Create and run your first definition to get started</p>
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
                <p className="text-sm">No definitions yet</p>
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  variant="outline"
                  size="sm"
                  className="mt-3"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Definition
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};