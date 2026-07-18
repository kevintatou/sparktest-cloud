'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Plus, Trash2, Network, Tag, Route, Server,
  Loader2, ToggleLeft, ToggleRight, Globe2,
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ── Types ──────────────────────────────────────────────────────

interface Environment {
  id: string;
  project_id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  is_default: boolean;
  created_at: string;
}

interface RoutingRule {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  match_labels: Record<string, string>;
  target_environment_id: string | null;
  target_agent_id: string | null;
  priority: number;
  enabled: boolean;
  created_at: string;
}

interface AgentWithLabels {
  id: string;
  name: string;
  status: string;
  environment_id: string | null;
  labels: { key: string; value: string }[];
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

// ── Component ──────────────────────────────────────────────────

type RoutingTab = 'environments' | 'rules' | 'agents';

export function RoutingSection() {
  const [tab, setTab] = useState<RoutingTab>('environments');
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [rules, setRules] = useState<RoutingRule[]>([]);
  const [agents, setAgents] = useState<AgentWithLabels[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [envName, setEnvName] = useState('');
  const [envSlug, setEnvSlug] = useState('');
  const [ruleName, setRuleName] = useState('');
  const [ruleLabels, setRuleLabels] = useState('');
  const [ruleEnvId, setRuleEnvId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [envs, rls, ags] = await Promise.all([
        fetchApi<Environment[]>('/api/routing/environments').catch(() => []),
        fetchApi<RoutingRule[]>('/api/routing/rules').catch(() => []),
        fetchApi<AgentWithLabels[]>('/api/routing/agents').catch(() => []),
      ]);
      setEnvironments(envs);
      setRules(rls);
      setAgents(ags);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const createEnvironment = async () => {
    if (!envName.trim()) return;
    const slug = envSlug.trim() || envName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const created = await fetchApi<Environment>('/api/routing/environments', {
      method: 'POST',
      body: JSON.stringify({ name: envName.trim(), slug }),
    });
    setEnvironments(prev => [...prev, created]);
    setEnvName('');
    setEnvSlug('');
  };

  const deleteEnvironment = async (id: string) => {
    await fetchApi(`/api/routing/environments/${id}`, { method: 'DELETE' });
    setEnvironments(prev => prev.filter(e => e.id !== id));
  };

  const createRule = async () => {
    if (!ruleName.trim()) return;
    const labels: Record<string, string> = {};
    ruleLabels.split(',').forEach(pair => {
      const [k, v] = pair.split('=').map(s => s.trim());
      if (k && v) labels[k] = v;
    });
    const created = await fetchApi<RoutingRule>('/api/routing/rules', {
      method: 'POST',
      body: JSON.stringify({
        name: ruleName.trim(),
        match_labels: labels,
        target_environment_id: ruleEnvId || null,
      }),
    });
    setRules(prev => [...prev, created]);
    setRuleName('');
    setRuleLabels('');
    setRuleEnvId('');
  };

  const toggleRule = async (id: string, enabled: boolean) => {
    await fetchApi(`/api/routing/rules/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ enabled }),
    });
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled } : r));
  };

  const deleteRule = async (id: string) => {
    await fetchApi(`/api/routing/rules/${id}`, { method: 'DELETE' });
    setRules(prev => prev.filter(r => r.id !== id));
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
        <h2 className="text-2xl font-bold tracking-tight">Routing &amp; Environments</h2>
        <p className="text-muted-foreground">
          Target runs to specific agents, clusters, or environments using label-based routing.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 border-b pb-2">
        {([
          { key: 'environments' as RoutingTab, label: 'Environments', icon: Globe2, count: environments.length },
          { key: 'rules' as RoutingTab, label: 'Routing Rules', icon: Route, count: rules.length },
          { key: 'agents' as RoutingTab, label: 'Agent Labels', icon: Tag, count: agents.length },
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

      {/* Environments */}
      {tab === 'environments' && (
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">New Environment</CardTitle></CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-3">
              <Input value={envName} onChange={e => setEnvName(e.target.value)} placeholder="Environment name" className="flex-1" />
              <Input value={envSlug} onChange={e => setEnvSlug(e.target.value)} placeholder="slug (auto)" className="w-36" />
              <Button onClick={createEnvironment} className="gap-2 shrink-0">
                <Plus className="h-4 w-4" /> Create
              </Button>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {environments.map(env => (
              <Card key={env.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: env.color }} />
                      <h4 className="font-semibold">{env.name}</h4>
                    </div>
                    {env.is_default && <Badge variant="outline">Default</Badge>}
                  </div>
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{env.slug}</code>
                  <div className="flex gap-2 mt-3 pt-3 border-t">
                    <Button variant="ghost" size="sm" onClick={() => deleteEnvironment(env.id)}
                      className="gap-1 text-destructive hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {environments.length === 0 && (
              <Card className="col-span-full">
                <CardContent className="text-center py-12">
                  <Globe2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-semibold mb-2">No environments</h3>
                  <p className="text-muted-foreground text-sm">Create environments like staging, production, or canary.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Routing Rules */}
      {tab === 'rules' && (
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">New Routing Rule</CardTitle></CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-3">
              <Input value={ruleName} onChange={e => setRuleName(e.target.value)} placeholder="Rule name" className="w-40" />
              <Input value={ruleLabels} onChange={e => setRuleLabels(e.target.value)} placeholder="region=us,tier=prod" className="flex-1" />
              <select
                value={ruleEnvId}
                onChange={e => setRuleEnvId(e.target.value)}
                className="h-10 rounded-md border bg-background px-3 text-sm"
              >
                <option value="">Target environment…</option>
                {environments.map(env => (
                  <option key={env.id} value={env.id}>{env.name}</option>
                ))}
              </select>
              <Button onClick={createRule} className="gap-2 shrink-0">
                <Plus className="h-4 w-4" /> Create
              </Button>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {rules.sort((a, b) => b.priority - a.priority).map(rule => (
              <Card key={rule.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold">{rule.name}</h4>
                      {rule.description && <p className="text-xs text-muted-foreground">{rule.description}</p>}
                    </div>
                    <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                      {rule.enabled ? 'Active' : 'Disabled'}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {Object.entries(rule.match_labels).map(([k, v]) => (
                      <Badge key={k} variant="outline" className="text-xs">{k}={v}</Badge>
                    ))}
                  </div>
                  {rule.target_environment_id && (
                    <p className="text-xs text-muted-foreground mt-2">
                      → {environments.find(e => e.id === rule.target_environment_id)?.name || 'Unknown env'}
                    </p>
                  )}
                  <div className="flex gap-2 mt-3 pt-3 border-t">
                    <Button variant="ghost" size="sm" onClick={() => toggleRule(rule.id, !rule.enabled)} className="gap-1">
                      {rule.enabled ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />}
                      {rule.enabled ? 'Disable' : 'Enable'}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteRule(rule.id)}
                      className="gap-1 text-destructive hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {rules.length === 0 && (
              <Card className="col-span-full">
                <CardContent className="text-center py-12">
                  <Route className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-semibold mb-2">No routing rules</h3>
                  <p className="text-muted-foreground text-sm">Rules match run labels to target environments or agents.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Agent Labels */}
      {tab === 'agents' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {agents.map(agent => (
            <Card key={agent.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Server className="h-4 w-4" />
                  {agent.name}
                  <Badge variant={agent.status === 'online' ? 'default' : 'secondary'} className="ml-auto text-xs">
                    {agent.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {agent.labels.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {agent.labels.map(l => (
                      <Badge key={l.key} variant="outline" className="text-xs">
                        <Tag className="h-3 w-3 mr-1" />{l.key}={l.value}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No labels assigned</p>
                )}
                {agent.environment_id && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Environment: {environments.find(e => e.id === agent.environment_id)?.name || agent.environment_id}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
          {agents.length === 0 && (
            <Card className="col-span-full">
              <CardContent className="text-center py-12">
                <Network className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-semibold mb-2">No agents</h3>
                <p className="text-muted-foreground text-sm">Connect agents and assign labels for routing.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
