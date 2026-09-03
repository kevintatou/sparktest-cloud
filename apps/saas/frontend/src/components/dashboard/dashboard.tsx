'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Definition, Run } from '@tatou/core';
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Filter,
  Plus,
  XCircle,
} from 'lucide-react';

export interface DashboardProps {
  testDefinitions: Definition[];
  testRuns: Run[];
  loading: boolean;
  setShowCreateDialog: (show: boolean) => void;
  handleRunTest: (id: string) => void;
  handleRunClick: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  testDefinitions,
  testRuns,
  loading,
  setShowCreateDialog,
  handleRunClick,
}) => {
  const completedRuns = testRuns.filter((run) =>
    ['completed', 'passed'].includes(run.status)
  ).length;
  const failedRuns = testRuns.filter((run) =>
    ['failed', 'error'].includes(run.status)
  ).length;
  const runningRuns = testRuns.filter((run) =>
    ['queued', 'pending', 'running'].includes(run.status)
  ).length;
  const passRate =
    testRuns.length > 0
      ? Math.round((completedRuns / testRuns.length) * 100)
      : 0;

  if (loading) {
    return (
      <div className="space-y-8">
        <PageHeader />
        <div className="grid gap-6 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-36 animate-pulse rounded-xl border border-border bg-card"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader />

      <div className="grid gap-6 md:grid-cols-3">
        <MetricCard
          label="Pass Rate"
          value={`${passRate}%`}
          detail={`${completedRuns} of ${testRuns.length} tests passed`}
          icon={<CheckCircle2 className="h-5 w-5" />}
          tone="cyan"
        />
        <MetricCard
          label="Failed"
          value={failedRuns}
          detail={`${runningRuns} currently active`}
          icon={<XCircle className="h-5 w-5" />}
          tone="red"
        />
        <MetricCard
          label="Total Runs"
          value={testRuns.length}
          detail={`${testDefinitions.length} definitions`}
          icon={<ArrowUpRight className="h-5 w-5" />}
          tone="sky"
        />
      </div>

      <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
        <StatusDot
          className="bg-emerald-500"
          label={`${completedRuns} Completed`}
        />
        <StatusDot className="bg-rose-500" label={`${failedRuns} Failed`} />
        <StatusDot className="bg-amber-500" label={`${runningRuns} Running`} />
      </div>

      <section className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold tracking-tight">
              Recent Activity
            </h2>
          </div>
          <Button variant="outline" className="gap-2 rounded-xl">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </div>

        <Card className="overflow-hidden rounded-xl shadow-sm">
          <CardContent className="p-0">
            {testRuns.length > 0 ? (
              <div className="divide-y divide-border">
                {testRuns.slice(0, 6).map((run) => {
                  const definition = testDefinitions.find(
                    (item) => item.id === run.definitionId
                  );

                  return (
                    <button
                      key={run.id}
                      onClick={() => handleRunClick(run.id)}
                      className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-muted"
                    >
                      <Clock className="h-4 w-4 text-slate-400" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-foreground">
                            {definition?.name ?? `Test Run ${run.id.slice(-8)}`}
                          </p>
                          <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground ring-1 ring-border">
                            {run.status}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          <span>{run.id.slice(-8)}</span>
                          <span>{definition?.image ?? 'cloud agent'}</span>
                        </div>
                      </div>
                      <time className="hidden text-sm text-muted-foreground sm:block">
                        {new Date(run.createdAt).toLocaleString()}
                      </time>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-primary ring-1 ring-border">
                  <Activity className="h-6 w-6" />
                </div>
                <h3 className="font-medium text-foreground">No runs yet</h3>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Create a definition, connect an agent, and your execution
                  history will appear here.
                </p>
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  className="mt-5 gap-2 rounded-xl"
                >
                  <Plus className="h-4 w-4" />
                  Create Definition
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

function PageHeader() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Dashboard
      </h1>
      <p className="mt-2 text-base text-muted-foreground">
        Monitor cloud test runs, agent activity, and system health.
      </p>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon,
  tone,
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: React.ReactNode;
  tone: 'cyan' | 'red' | 'sky';
}) {
  const toneClasses = {
    cyan: 'bg-cyan-100 text-cyan-700',
    red: 'bg-rose-100 text-rose-600',
    sky: 'bg-sky-100 text-sky-700',
  };

  return (
    <Card className="rounded-xl shadow-sm">
      <CardContent className="flex min-h-36 items-start justify-between p-6">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <div className="mt-4 flex items-baseline gap-2">
            <p className="text-3xl font-semibold tracking-tight text-foreground">
              {value}
            </p>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">{detail}</p>
        </div>
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${toneClasses[tone]}`}
        >
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

function StatusDot({ className, label }: { className: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${className}`} />
      <span>{label}</span>
    </div>
  );
}
