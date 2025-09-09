'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TestDefinitionCard, TestRunCard, ExecutorCard, TestSuiteCard } from '@tatou/ui';
import { Definition, Run, Executor, Suite } from '@tatou/core';
import { Plus, FileText, Play, Server, Layers } from 'lucide-react';
import { NavigationKey } from './navigation';

export interface TestSectionsProps {
  activeTab: NavigationKey;
  testDefinitions: Definition[];
  testRuns: Run[];
  executors: Executor[];
  testSuites: Suite[];
  setShowCreateDialog: (show: boolean) => void;
  setActiveTab: (tab: NavigationKey) => void;
  handleRunTest: (id: string) => void;
  handleDeleteTest: (id: string) => void;
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
  setActiveTab,
  handleRunTest,
  handleDeleteTest,
  deleteExecutor,
  deleteSuite,
}) => {
  switch (activeTab) {
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
              <ExecutorCard 
                key={executor.id} 
                executor={executor}
                onDelete={deleteExecutor}
              />
            ))}
            {executors.length === 0 && (
              <div className="col-span-full">
                <Card>
                  <CardContent className="text-center py-12">
                    <Server className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No executors yet</h3>
                    <p className="text-muted-foreground mb-4">Add execution environments to run your tests</p>
                    <Button className="gap-2">
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
              <TestSuiteCard 
                key={suite.id} 
                suite={suite}
                onDelete={deleteSuite}
              />
            ))}
            {testSuites.length === 0 && (
              <div className="col-span-full">
                <Card>
                  <CardContent className="text-center py-12">
                    <Layers className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No test suites yet</h3>
                    <p className="text-muted-foreground mb-4">Create suites to organize related tests</p>
                    <Button className="gap-2">
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