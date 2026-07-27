'use client';

import { useEffect, useState } from 'react';
import { Run, Definition } from '@tatou/core';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowLeft,
  Play,
  RotateCcw,
  Clock,
  Calendar,
  Hash,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Timer,
  Terminal,
  Box,
  FileBox,
  HardDrive,
  ShieldCheck,
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface RunDetailProps {
  run: Run;
  definition?: Definition;
  onBack: () => void;
  onRetry?: (definitionId: string) => void;
}

interface Artifact {
  id: string;
  run_id: string;
  name: string;
  path: string;
  size_bytes: number;
  content_type: string;
  storage_key: string;
  uploaded_at: string;
  expires_at: string | null;
}

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  if (response.status === 204) return undefined as T;
  return response.json();
}

function StatusBadge({ status }: { status: Run['status'] }) {
  const config: Record<string, { icon: React.ReactNode; classes: string }> = {
    queued: {
      icon: <Clock className="h-3.5 w-3.5" />,
      classes:
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    },
    pending: {
      icon: <Clock className="h-3.5 w-3.5" />,
      classes:
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    },
    running: {
      icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
      classes:
        'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    },
    completed: {
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      classes:
        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    },
    passed: {
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      classes:
        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    },
    failed: {
      icon: <XCircle className="h-3.5 w-3.5" />,
      classes: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    },
    error: {
      icon: <AlertCircle className="h-3.5 w-3.5" />,
      classes: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    },
    cancelled: {
      icon: <XCircle className="h-3.5 w-3.5" />,
      classes:
        'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
    },
  };

  const { icon, classes } = config[status] || config.pending;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${classes}`}
    >
      {icon}
      <span className="capitalize">{status}</span>
    </span>
  );
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60_000);
  const seconds = ((ms % 60_000) / 1000).toFixed(0);
  return `${minutes}m ${seconds}s`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function RunDetail({
  run,
  definition,
  onBack,
  onRetry,
}: RunDetailProps) {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [artifactsLoading, setArtifactsLoading] = useState(true);
  const [artifactsError, setArtifactsError] = useState(false);
  const isTerminal = [
    'completed',
    'passed',
    'failed',
    'error',
    'cancelled',
  ].includes(run.status);

  useEffect(() => {
    let cancelled = false;

    setArtifactsLoading(true);
    setArtifactsError(false);
    fetchApi<Artifact[]>('/api/insights/artifacts?limit=500')
      .then((items) => {
        if (!cancelled) {
          setArtifacts(items.filter((artifact) => artifact.run_id === run.id));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setArtifacts([]);
          setArtifactsError(true);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setArtifactsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [run.id]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold tracking-tight">
                Run {run.id.slice(-8)}
              </h2>
              <StatusBadge status={run.status} />
            </div>
            <p className="text-muted-foreground mt-1">{run.name}</p>
          </div>
        </div>
        {onRetry && isTerminal && run.definitionId && (
          <Button onClick={() => onRetry(run.definitionId)} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Retry
          </Button>
        )}
      </div>

      {/* Info grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Hash className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Run ID</p>
                <p
                  className="text-sm font-mono font-medium truncate max-w-[180px]"
                  title={run.id}
                >
                  {run.id.slice(0, 12)}…
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="text-sm font-medium">
                  {formatDate(run.createdAt)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Timer className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="text-sm font-medium">
                  {run.duration ? formatDuration(run.duration) : '—'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Box className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Image</p>
                <p
                  className="text-sm font-mono font-medium truncate max-w-[180px]"
                  title={run.image}
                >
                  {run.image}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Definition info */}
      {definition && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Play className="h-4 w-4" />
              Definition
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Name</p>
                <p className="font-medium">{definition.name}</p>
              </div>
              {definition.description && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Description
                  </p>
                  <p className="text-sm">{definition.description}</p>
                </div>
              )}
              <div className="sm:col-span-2">
                <p className="text-xs text-muted-foreground mb-1">Commands</p>
                <div className="bg-muted rounded-lg p-3 font-mono text-sm space-y-1">
                  {definition.commands.map((cmd: string, i: number) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-muted-foreground select-none">
                        $
                      </span>
                      <span>{cmd}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Command */}
      {run.command && run.command.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Terminal className="h-4 w-4" />
              Command
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted rounded-lg p-3 font-mono text-sm space-y-1">
              {run.command.map((cmd: string, i: number) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-muted-foreground select-none">$</span>
                  <span>{cmd}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Artifacts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <FileBox className="h-4 w-4" />
              Artifacts
            </span>
            {artifacts.length > 0 && (
              <span className="text-xs font-normal text-muted-foreground">
                {artifacts.length} files ·{' '}
                {formatBytes(
                  artifacts.reduce(
                    (sum, artifact) => sum + artifact.size_bytes,
                    0
                  )
                )}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {artifactsLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : artifactsError ? (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              Artifacts could not be loaded for this run.
            </div>
          ) : artifacts.length > 0 ? (
            <div className="divide-y rounded-lg border">
              {artifacts.map((artifact) => (
                <div
                  key={artifact.id}
                  className="grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <FileBox className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <p
                        className="truncate text-sm font-medium"
                        title={artifact.name}
                      >
                        {artifact.name}
                      </p>
                    </div>
                    <p
                      className="mt-1 truncate text-xs text-muted-foreground"
                      title={artifact.path}
                    >
                      {artifact.path}
                    </p>
                  </div>
                  <div className="grid gap-2 text-xs text-muted-foreground sm:min-w-[260px]">
                    <div className="flex items-center justify-between gap-4">
                      <span className="flex items-center gap-1.5">
                        <HardDrive className="h-3.5 w-3.5" />
                        {formatBytes(artifact.size_bytes)}
                      </span>
                      <span className="truncate" title={artifact.content_type}>
                        {artifact.content_type}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span>Uploaded {formatDate(artifact.uploaded_at)}</span>
                      {artifact.expires_at && (
                        <span className="flex items-center gap-1.5">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Expires {formatDate(artifact.expires_at)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <FileBox className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                No artifacts attached to this run.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Logs / Output */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Terminal className="h-4 w-4" />
            Output
          </CardTitle>
        </CardHeader>
        <CardContent>
          {run.logs && run.logs.length > 0 ? (
            <div className="bg-zinc-950 text-zinc-100 rounded-lg p-4 font-mono text-sm max-h-[500px] overflow-y-auto">
              {run.logs.map((line: string, i: number) => (
                <div key={i} className="flex">
                  <span className="text-zinc-600 select-none w-10 shrink-0 text-right pr-3">
                    {i + 1}
                  </span>
                  <span className="whitespace-pre-wrap break-all">{line}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              {run.status === 'running' ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <p>Waiting for output…</p>
                </div>
              ) : run.status === 'queued' || run.status === 'pending' ? (
                <div className="flex flex-col items-center gap-3">
                  <Clock className="h-8 w-8 opacity-50" />
                  <p>
                    Run is queued. Output will appear once an agent picks it up.
                  </p>
                </div>
              ) : (
                <p>No output captured for this run.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
