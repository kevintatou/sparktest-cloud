'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TestDefinitionCard, ExecutorCard, TestSuiteCard } from '@tatou/ui';
import { TestRunCard } from '@/components/ui/run-card';
import { Definition, Run, Executor, Suite } from '@tatou/core';
import { Plus, FileText, Play, Server, Layers } from 'lucide-react';
import { NavigationKey } from './navigation';
import { RunDetail } from './run-detail';

export interface TestSectionsProps {
  activeTab: NavigationKey;
  testDefinitions: Definition[];
  testRuns: Run[];
  executors: Executor[];
  testSuites: Suite[];
  setShowCreateDialog: (show: boolean) => void;
  setShowCreateExecutorDialog: (show: boolean) => void;
  setShowCreateSuiteDialog: (show: boolean) => void;
  setActiveTab: (tab: NavigationKey) => void;
  handleRunTest: (id: string) => void;
  handleRunSuite: (id: string) => void;
  handleDeleteTest: (id: string) => void;
  handleRunClick: (id: string) => void;
  deleteRun: (id: string) => void;
  deleteExecutor: (id: string) => void;
  deleteSuite: (id: string) => void;
}

export const TestSections: React.FC<TestSectionsProps> = ({
  activeTab,
  testDefinitions,
  testRuns,
  executors,
  testSuites,
  setShowCreateDialog,
  setShowCreateExecutorDialog,
  setShowCreateSuiteDialog,
  setActiveTab,
  handleRunTest,
  handleRunSuite,
  handleDeleteTest,
  handleRunClick,
  deleteRun,
  deleteExecutor,
  deleteSuite,
}) => {
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  // If a run is selected, show the detail view
  if (activeTab === 'runs' && selectedRunId) {
    const run = testRuns.find(r => r.id === selectedRunId);
    if (run) {
      const definition = testDefinitions.find(d => d.id === run.definitionId);
      return (
        <RunDetail
          run={run}
          definition={definition}
          onBack={() => setSelectedRunId(null)}
          onRetry={(defId) => {
            handleRunTest(defId);
            setSelectedRunId(null);
          }}
        />
      );
    }
  }

  switch (activeTab) {
    case 'definitions':
      return (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Definitions</h2>
              <p className="text-muted-foreground">
                Create and manage your definitions.
              </p>
            </div>
            <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Definition
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
                <Card>
                  <CardContent className="text-center py-16">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No definitions yet</h3>
                    <p className="text-muted-foreground mb-6">Get started by creating your first definition</p>
                    <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Create Your First Definition
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
            <h2 className="text-2xl font-bold tracking-tight">Runs</h2>
            <p className="text-muted-foreground">
              Monitor your execution history and results.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {testRuns.map(run => (
              <TestRunCard 
                key={run.id} 
                run={run}
                onClick={(id) => setSelectedRunId(id)}
                onDelete={deleteRun}
                onRetry={(runId) => {
                  const definition = testDefinitions.find(d => d.id === run.definitionId);
                  if (definition) {
                    handleRunTest(definition.id);
                  }
                }}
              />
            ))}
            {testRuns.length === 0 && (
              <div className="col-span-full">
                <Card>
                  <CardContent className="text-center py-16">
                    <Play className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No runs yet</h3>
                    <p className="text-muted-foreground mb-6">Run a definition to see execution history here</p>
                    <Button onClick={() => setActiveTab('definitions')} variant="outline">
                      View Definitions
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
                Manage your execution environments.
              </p>
            </div>
            <Button onClick={() => setShowCreateExecutorDialog(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Executor
            </Button>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {executors.map(executor => (
              <ExecutorCard 
                key={executor.id} 
                executor={executor}
                onDelete={deleteExecutor}
              />
            ))}
            {executors.length === 0 && (
              <div className="col-span-full">
                <Card>
                  <CardContent className="text-center py-16">
                    <Server className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No executors yet</h3>
                    <p className="text-muted-foreground mb-6">Add execution environments to run your definitions</p>
                    <Button onClick={() => setShowCreateExecutorDialog(true)} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Your First Executor
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      );

    case 'suites':
      return (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Suites</h2>
              <p className="text-muted-foreground">
                Group and manage collections of related definitions.
              </p>
            </div>
            <Button onClick={() => setShowCreateSuiteDialog(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Suite
            </Button>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {testSuites.map(suite => (
              <TestSuiteCard 
                key={suite.id} 
                suite={suite}
                onRun={handleRunSuite}
                onDelete={deleteSuite}
              />
            ))}
            {testSuites.length === 0 && (
              <div className="col-span-full">
                <Card>
                  <CardContent className="text-center py-16">
                    <Layers className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No suites yet</h3>
                    <p className="text-muted-foreground mb-6">Create suites to organize related definitions</p>
                    <Button onClick={() => setShowCreateSuiteDialog(true)} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Create Your First Suite
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      );

    default:
      return null;
  }
};