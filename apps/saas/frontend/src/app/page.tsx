'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Definition } from '@tatou/core';
import { CreateTestDialog } from '@/components/create-test-dialog';
import { ThemeToggle } from '@/components/theme-toggle';
import { useToast } from '@/hooks/use-toast';
import { useStorage } from '@/hooks/use-storage';
import { cn } from '@/lib/utils';
import { Menu, Search, Zap } from 'lucide-react';

import { Navigation, NavigationKey } from '@/components/dashboard/navigation';
import { Dashboard } from '@/components/dashboard/dashboard';
import { TestSections } from '@/components/dashboard/test-sections';
import { SaasSections } from '@/components/dashboard/saas-sections';
import { AuthGate } from '@/components/auth/auth-gate';
import { UserMenu } from '@/components/auth/user-menu';
import { UpdatePasswordForm } from '@/components/auth/update-password-form';
import { MarketingPage } from '@/components/marketing/marketing-page';
import { useAuth } from '@/contexts/auth-context';
import { FeatureRequestCard } from '@/components/dashboard/feature-request-card';
import { ResourceSections } from '@/components/dashboard/resource-sections';

export default function Home() {
  return (
    <Suspense fallback={<MarketingPage />}>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const { user } = useAuth();
  const authParam = useSearchParams().get('auth');
  const publicAuthView = authParam === 'login' || authParam === 'signup'
    ? authParam
    : null;
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return (
      new URLSearchParams(window.location.hash.slice(1)).get('type') ===
      'recovery'
    );
  });
  const [activeTab, setActiveTab] = useState<NavigationKey>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false); // Start closed on initial load
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { toast } = useToast();

  // Use storage service instead of local state
  const {
    definitions: testDefinitions,
    runs: testRuns,
    executors,
    suites,
    loading,
    createDefinition,
    runTest,
    deleteDefinition,
    deleteRun,
    createExecutor,
    deleteExecutor,
    createSuite,
    deleteSuite,
  } = useStorage();

  // Supabase password recovery links can land at /#type=recovery.
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    setIsPasswordRecovery(hashParams.get('type') === 'recovery');
  }, []);

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

  if (isPasswordRecovery) {
    return <UpdatePasswordForm />;
  }

  if (!user) {
    if (publicAuthView) {
      return <AuthGate initialView={publicAuthView}>{null}</AuthGate>;
    }
    return <MarketingPage />;
  }

  const handleCreateDefinition = async (
    testData: Omit<Definition, 'id' | 'createdAt'>
  ) => {
    try {
      const newDefinition = await createDefinition(testData);
      toast({
        title: 'Definition Created',
        description: `"${newDefinition.name}" has been created successfully.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create definition.',
        variant: 'destructive',
      });
    }
  };

  const handleRunDefinition = async (definitionId: string) => {
    try {
      const definition = testDefinitions.find((d) => d.id === definitionId);
      if (!definition) {
        throw new Error('Definition not found');
      }

      await runTest(definitionId);

      toast({
        title: 'Run Started',
        description: `Running "${definition.name}"...`,
      });

      // The storage service will handle status updates via subscriptions
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to start run.',
        variant: 'destructive',
      });
    }
  };

  const handleRunClick = (runId: string) => {
    const run = testRuns.find((r) => r.id === runId);
    if (run) {
      toast({
        title: 'Run Details',
        description: `Viewing details for Run ${run.id.slice(-8)} (${run.status})`,
      });
    }
  };

  const handleDeleteDefinition = async (id: string) => {
    try {
      const definition = testDefinitions.find((d) => d.id === id);
      await deleteDefinition(id);
      toast({
        title: 'Definition Deleted',
        description: `"${definition?.name}" has been deleted.`,
        variant: 'destructive',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete definition.',
        variant: 'destructive',
      });
    }
  };

  const renderTabContent = () => {
    if (activeTab === 'dashboard') {
      return (
        <Dashboard
          testDefinitions={testDefinitions}
          testRuns={testRuns}
          loading={loading}
          setShowCreateDialog={setShowCreateDialog}
          handleRunTest={handleRunDefinition}
          handleRunClick={handleRunClick}
        />
      );
    }

    if (['definitions', 'runs'].includes(activeTab)) {
      return (
        <TestSections
          activeTab={activeTab}
          testDefinitions={testDefinitions}
          testRuns={testRuns}
          setShowCreateDialog={setShowCreateDialog}
          setActiveTab={setActiveTab}
          handleRunTest={handleRunDefinition}
          handleDeleteTest={handleDeleteDefinition}
          deleteRun={deleteRun}
        />
      );
    }

    if (['suites', 'executors'].includes(activeTab)) {
      return (
        <ResourceSections
          activeTab={activeTab}
          definitions={testDefinitions}
          executors={executors}
          suites={suites}
          createExecutor={createExecutor}
          deleteExecutor={deleteExecutor}
          createSuite={createSuite}
          deleteSuite={deleteSuite}
        />
      );
    }

    return <SaasSections activeTab={activeTab} />;
  };

  return (
    <AuthGate>
      <div className="min-h-screen bg-background text-foreground">
        <div className="flex min-h-screen">
          <aside
            className={cn(
              'fixed inset-y-0 left-0 z-50 border-r border-border bg-card transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
              sidebarOpen ? 'translate-x-0' : '-translate-x-full',
              sidebarCollapsed ? 'w-16' : 'w-64'
            )}
          >
            <div className="flex flex-col h-full">
              <div
                className={cn(
                  'flex h-24 items-center border-b border-border/60 px-6',
                  sidebarCollapsed && 'justify-center px-3'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-sm shadow-sky-500/20">
                    <Zap className="h-6 w-6" />
                  </div>
                  {!sidebarCollapsed && (
                    <div className="min-w-0">
                      <h1 className="truncate text-xl font-semibold tracking-tight">
                        SparkTest
                      </h1>
                      <p className="truncate text-xs text-slate-500">
                        Cloud Testing Platform
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <Navigation
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                sidebarCollapsed={sidebarCollapsed}
                setSidebarCollapsed={setSidebarCollapsed}
                setSidebarOpen={setSidebarOpen}
              />
            </div>
          </aside>

          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/20 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          <main className="flex-1 overflow-y-auto">
            <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card/90 px-4 backdrop-blur lg:px-8">
              <div className="flex items-center gap-3">
                <button
                  className="rounded-lg border border-border p-2 text-foreground transition-colors hover:bg-accent lg:hidden"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  aria-label="Toggle sidebar"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div className="hidden w-64 items-center gap-2 rounded-xl bg-secondary px-3 py-2 text-sm text-muted-foreground ring-1 ring-border sm:flex">
                  <Search className="h-4 w-4" />
                  <span>Search...</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <UserMenu />
                <ThemeToggle />
              </div>
            </header>

            <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
              <div key={activeTab} className="space-y-8">
                <div className="view-transition">{renderTabContent()}</div>
                <FeatureRequestCard />
              </div>
            </div>
          </main>
        </div>

        {/* Create Definition Dialog */}
        <CreateTestDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onCreateTest={handleCreateDefinition}
        />
      </div>
    </AuthGate>
  );
}
