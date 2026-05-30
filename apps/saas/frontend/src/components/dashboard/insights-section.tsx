'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3, HardDrive, AlertTriangle, Clock, FileBox,
  Loader2, Trash2, Download, TrendingUp, CheckCircle2,
  XCircle, MinusCircle, Save,
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ── Types ──────────────────────────────────────────────────────

interface RetentionPolicy {
  id: string;
  project_id: string;
  resource_type: 'runs' | 'logs' | 'artifacts';
  retention_days: number;
  max_storage_bytes: number | null;
  auto_delete: boolean;
}

interface Artifact {
  id: string;
  run_id: string;
  name: string;
  path: string;
  size_bytes: number;
  content_type: string;
  uploaded_at: string;
  expires_at: string | null;
}

interface FlakyTest {
  id: string;
  definition_id: string;
  definition_name?: string;
  flake_rate: number;
  total_runs: number;
  flaky_runs: number;
  consecutive_passes: number;
  first_flake_at: string | null;
  last_flake_at: string | null;
  status: 'active' | 'resolved' | 'muted';
}

// ── API helper ─────────────────────────────────────────────────

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  if (response.status === 204) return undefined as T;
  return response.json();
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// ── Component ──────────────────────────────────────────────────

type InsightsTab = 'flaky' | 'artifacts' | 'retention';

export function InsightsSection() {
  const [tab, setTab] = useState<InsightsTab>('flaky');
  const [policies, setPolicies] = useState<RetentionPolicy[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [flakyTests, setFlakyTests] = useState<FlakyTest[]>([]);
  const [loading, setLoading] = useState(true);

  // Retention form
  const [retDays, setRetDays] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pol, art, flaky] = await Promise.all([
        fetchApi<RetentionPolicy[]>('/api/insights/retention').catch(() => []),
        fetchApi<Artifact[]>('/api/insights/artifacts?limit=50').catch(() => []),
        fetchApi<FlakyTest[]>('/api/insights/flaky').catch(() => []),
      ]);
      setPolicies(pol);
      setArtifacts(art);
      setFlakyTests(flaky);
      const days: Record<string, string> = {};
      pol.forEach(p => { days[p.resource_type] = String(p.retention_days); });
      setRetDays(days);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const saveRetention = async (resourceType: string) => {
    const days = parseInt(retDays[resourceType] || '30');
    if (isNaN(days) || days < 1) return;
    await fetchApi('/api/insights/retention', {
      method: 'PUT',
      body: JSON.stringify({ resource_type: resourceType, retention_days: days }),
    });
  };

  const deleteArtifact = async (id: string) => {
    await fetchApi(`/api/insights/artifacts/${id}`, { method: 'DELETE' });
    setArtifacts(prev => prev.filter(a => a.id !== id));
  };

  const muteFlaky = async (id: string) => {
    await fetchApi(`/api/insights/flaky/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'muted' }),
    });
    setFlakyTests(prev => prev.map(f => f.id === id ? { ...f, status: 'muted' } : f));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Insights &amp; Storage</h2>
        <p className="text-muted-foreground">
          Flaky test detection, run artifacts, and data retention settings.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 border-b pb-2">
        {([
          { key: 'flaky' as InsightsTab, label: 'Flaky Tests', icon: AlertTriangle, count: flakyTests.filter(f => f.status === 'active').length },
          { key: 'artifacts' as InsightsTab, label: 'Artifacts', icon: FileBox, count: artifacts.length },
          { key: 'retention' as InsightsTab, label: 'Retention', icon: HardDrive, count: policies.length },
        ]).map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              tab === key
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
            <Badge variant="secondary" className="ml-1 text-xs">{count}</Badge>
          </button>
        ))}
      </div>

      {/* Flaky Tests */}
      {tab === 'flaky' && (
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-l-4 border-l-red-500">
              <CardContent className="py-4">
                <p className="text-sm text-muted-foreground">Active Flaky</p>
                <p className="text-2xl font-bold">{flakyTests.filter(f => f.status === 'active').length}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-yellow-500">
              <CardContent className="py-4">
                <p className="text-sm text-muted-foreground">Avg Flake Rate</p>
                <p className="text-2xl font-bold">
                  {flakyTests.length > 0
                    ? `${(flakyTests.reduce((sum, f) => sum + Number(f.flake_rate), 0) / flakyTests.length).toFixed(1)}%`
                    : '0%'}
                </p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="py-4">
                <p className="text-sm text-muted-foreground">Resolved</p>
                <p className="text-2xl font-bold">{flakyTests.filter(f => f.status === 'resolved').length}</p>
              </CardContent>
            </Card>
          </div>

          {/* Flaky test list */}
          <div className="grid gap-3">
            {flakyTests.sort((a, b) => Number(b.flake_rate) - Number(a.flake_rate)).map(test => (
              <Card key={test.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    {test.status === 'active' ? (
                      <XCircle className="h-5 w-5 text-red-500" />
                    ) : test.status === 'muted' ? (
                      <MinusCircle className="h-5 w-5 text-yellow-500" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    )}
                    <div>
                      <p className="font-medium">{test.definition_name || test.definition_id.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground">
                        {test.flaky_runs}/{test.total_runs} flaky · {test.consecutive_passes} consecutive passes
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className={`text-lg font-bold ${Number(test.flake_rate) > 20 ? 'text-red-600' : Number(test.flake_rate) > 5 ? 'text-yellow-600' : 'text-green-600'}`}>
                        {Number(test.flake_rate).toFixed(1)}%
                      </p>
                      <p className="text-xs text-muted-foreground">flake rate</p>
                    </div>
                    {test.status === 'active' && (
                      <Button variant="ghost" size="sm" onClick={() => muteFlaky(test.id)} className="gap-1">
                        <MinusCircle className="h-3.5 w-3.5" /> Mute
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {flakyTests.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-semibold mb-2">No flaky tests detected</h3>
                  <p className="text-muted-foreground text-sm">Tests with inconsistent results will appear here automatically.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Artifacts */}
      {tab === 'artifacts' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>Recent Artifacts</span>
                <Badge variant="outline">{formatBytes(artifacts.reduce((s, a) => s + a.size_bytes, 0))} total</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {artifacts.length > 0 ? (
                <div className="divide-y">
                  {artifacts.map(artifact => (
                    <div key={artifact.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <FileBox className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{artifact.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatBytes(artifact.size_bytes)} · Run {artifact.run_id.slice(0, 8)} · {new Date(artifact.uploaded_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="gap-1">
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteArtifact(artifact.id)}
                          className="gap-1 text-destructive hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileBox className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">No artifacts uploaded yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Retention */}
      {tab === 'retention' && (
        <div className="grid gap-4 md:grid-cols-3">
          {(['runs', 'logs', 'artifacts'] as const).map(resourceType => {
            const policy = policies.find(p => p.resource_type === resourceType);
            return (
              <Card key={resourceType}>
                <CardHeader>
                  <CardTitle className="text-base capitalize flex items-center gap-2">
                    {resourceType === 'runs' ? <Clock className="h-4 w-4" /> : resourceType === 'logs' ? <FileBox className="h-4 w-4" /> : <HardDrive className="h-4 w-4" />}
                    {resourceType}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Retention (days)</label>
                    <Input
                      type="number"
                      min={1}
                      value={retDays[resourceType] || (policy?.retention_days ?? 30)}
                      onChange={e => setRetDays(prev => ({ ...prev, [resourceType]: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  {policy?.max_storage_bytes && (
                    <p className="text-xs text-muted-foreground">
                      Max storage: {formatBytes(policy.max_storage_bytes)}
                    </p>
                  )}
                  <Button size="sm" variant="outline" onClick={() => saveRetention(resourceType)} className="w-full gap-2">
                    <Save className="h-3.5 w-3.5" /> Save
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
