'use client';

import { useState, useEffect } from 'react';
import { Definition, Executor, Suite } from '@tatou/core';
import { CreateTestDialog } from '@/components/create-test-dialog';
import { CreateExecutorDialog } from '@/components/create-executor-dialog';
import { CreateSuiteDialog } from '@/components/create-suite-dialog';
import { ThemeToggle } from '@/components/theme-toggle';
import { useToast } from '@/hooks/use-toast';
import { useStorage } from '@/hooks/use-storage';
import { cn } from '@/lib/utils';
import { Zap, Database, Menu } from 'lucide-react';

import { Navigation, NavigationKey } from '@/components/dashboard/navigation';
import { Dashboard } from '@/components/dashboard/dashboard';
import { TestSections } from '@/components/dashboard/test-sections';
import { SaasSections } from '@/components/dashboard/saas-sections';

export default function Home() {
  const [activeTab, setActiveTab] = useState<NavigationKey>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false); // Start closed on initial load
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showCreateExecutorDialog, setShowCreateExecutorDialog] = useState(false);
  const [showCreateSuiteDialog, setShowCreateSuiteDialog] = useState(false);
  const { toast } = useToast();
  
  // Use storage service instead of local state
  const {
    definitions: testDefinitions,
    runs: testRuns,
    executors,
    suites: testSuites,
    loading,
    createDefinition,
    updateDefinition,
    createExecutor,
    updateExecutor,
    createSuite,
    updateSuite,
    runTest,
    runSuite,
    deleteDefinition,
    deleteRun,
    deleteExecutor,
    deleteSuite,
  } = useStorage();

  // Initialize sidebar state based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true); // Always open on desktop
      } else {
        setSidebarOpen(false); // Always closed on mobile initially
      }
    };

    // Set initial state
    handleResize();
    
    // Listen for resize events
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleCreateDefinition = async (testData: Omit<Definition, 'id' | 'createdAt'>) => {
    try {
      const newDefinition = await createDefinition(testData);
      toast({
        title: "Definition Created",
        description: `"${newDefinition.name}" has been created successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create definition.",
        variant: "destructive",
      });
    }
  };

  const handleRunDefinition = async (definitionId: string) => {
    try {
      const definition = testDefinitions.find(d => d.id === definitionId);
      if (!definition) {
        throw new Error('Definition not found');
      }

      await runTest(definitionId);
      
      toast({
        title: "Run Started",
        description: `Running "${definition.name}"...`,
      });

      // The storage service will handle status updates via subscriptions
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start run.",
        variant: "destructive",
      });
    }
  };

  const handleRunClick = (runId: string) => {
    const run = testRuns.find(r => r.id === runId);
    if (run) {
      toast({
        title: "Run Details",
        description: `Viewing details for Run ${run.id.slice(-8)} (${run.status})`,
      });
    }
  };

  const handleDeleteDefinition = async (id: string) => {
    try {
      const definition = testDefinitions.find(d => d.id === id);
      await deleteDefinition(id);
      toast({
        title: "Definition Deleted",
        description: `"${definition?.name}" has been deleted.`,
        variant: "destructive",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete definition.",
        variant: "destructive",
      });
    }
  };

  const handleCreateExecutor = async (executorData: Omit<Executor, 'id' | 'createdAt'>) => {
    try {
      const newExecutor = await createExecutor(executorData);
      toast({
        title: "Executor Created",
        description: `"${newExecutor.name}" has been created successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create executor.",
        variant: "destructive",
      });
    }
  };

  const handleCreateSuite = async (suiteData: Omit<Suite, 'id' | 'createdAt'>) => {
    try {
      const newSuite = await createSuite(suiteData);
      toast({
        title: "Suite Created",
        description: `"${newSuite.name}" has been created successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create suite.",
        variant: "destructive",
      });
    }
  };

  const handleRunSuite = async (suiteId: string) => {
    try {
      const suite = testSuites.find(s => s.id === suiteId);
      if (!suite) {
        throw new Error('Suite not found');
      }

      await runSuite(suiteId);
      
      toast({
        title: "Suite Started",
        description: `Running suite "${suite.name}" with ${suite.testDefinitionIds.length} definitions...`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start suite.",
        variant: "destructive",
      });
    }
  };

  const renderTabContent = () => {
    if (activeTab === 'dashboard') {
      return (
        <Dashboard
          testDefinitions={testDefinitions}
          testRuns={testRuns}
          executors={executors}
          testSuites={testSuites}
          loading={loading}
          setShowCreateDialog={setShowCreateDialog}
          handleRunTest={handleRunDefinition}
          handleRunClick={handleRunClick}
        />
      );
    }

    if (['definitions', 'runs', 'executors', 'suites'].includes(activeTab)) {
      return (
        <TestSections
          activeTab={activeTab}
          testDefinitions={testDefinitions}
          testRuns={testRuns}
          executors={executors}
          testSuites={testSuites}
          setShowCreateDialog={setShowCreateDialog}
          setShowCreateExecutorDialog={setShowCreateExecutorDialog}
          setShowCreateSuiteDialog={setShowCreateSuiteDialog}
          setActiveTab={setActiveTab}
          handleRunTest={handleRunDefinition}
          handleRunSuite={handleRunSuite}
          handleDeleteTest={handleDeleteDefinition}
          handleRunClick={handleRunClick}
          deleteRun={deleteRun}
          deleteExecutor={deleteExecutor}
          deleteSuite={deleteSuite}
        />
      );
    }

    return <SaasSections activeTab={activeTab} />;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Enhanced Header */}
      <header className="bg-background border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              {/* Hamburger Menu Button for Mobile */}
              <button
                className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label="Toggle sidebar"
              >
                <Menu className="h-5 w-5" />
              </button>
              
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

      <div className="flex h-[calc(100vh-73px)]">
        {/* Sidebar with Simple Styling */}
        <aside className={cn(
          "fixed inset-y-0 left-0 z-50 bg-background border-r transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          sidebarCollapsed ? "w-16" : "w-72"
        )}>
          <div className="flex flex-col h-full">
            <Navigation
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              sidebarCollapsed={sidebarCollapsed}
              setSidebarCollapsed={setSidebarCollapsed}
              setSidebarOpen={setSidebarOpen}
            />
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
          "flex-1 transition-all duration-300 ease-in-out lg:ml-0 overflow-y-auto",
          sidebarCollapsed ? "lg:ml-16" : "lg:ml-0"
        )}>
          <div className="container mx-auto px-4 py-8 max-w-7xl">
            {renderTabContent()}
          </div>
        </main>
      </div>

      {/* Create Definition Dialog */}
      <CreateTestDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreateTest={handleCreateDefinition}
      />

      {/* Create Executor Dialog */}
      <CreateExecutorDialog
        open={showCreateExecutorDialog}
        onOpenChange={setShowCreateExecutorDialog}
        onCreateExecutor={handleCreateExecutor}
      />

      {/* Create Suite Dialog */}
      <CreateSuiteDialog
        open={showCreateSuiteDialog}
        onOpenChange={setShowCreateSuiteDialog}
        onCreateSuite={handleCreateSuite}
        availableDefinitions={testDefinitions}
      />
    </div>
  );
}