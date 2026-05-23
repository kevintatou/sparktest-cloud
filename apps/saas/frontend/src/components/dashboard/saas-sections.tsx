'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, CreditCard, Folder, Radio, Settings } from 'lucide-react';
import { NavigationKey } from './navigation';
import { BillingSection } from './billing-section';
import { supabase } from '@/lib/supabase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type Project = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
};

type Agent = {
  id: string;
  name: string;
  version?: string;
  status: string;
  last_seen_at?: string;
};

type AgentTokenCreated = {
  id: string;
  name: string;
  token: string;
  created_at: string;
};

export interface SaasSectionsProps {
  activeTab: NavigationKey;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    return { Authorization: `Bearer ${session.access_token}` };
  }
  return {};
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const authHeaders = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options?.headers,
    },
    ...options,
  });
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
}

export const SaasSections: React.FC<SaasSectionsProps> = ({ activeTab }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [projectName, setProjectName] = useState('');
  const [tokenName, setTokenName] = useState('default-agent');
  const [createdToken, setCreatedToken] = useState<AgentTokenCreated | null>(null);

  useEffect(() => {
    if (activeTab === 'projects') {
      fetchApi<Project[]>('/api/projects').then(setProjects).catch(console.error);
    }
    if (activeTab === 'agents') {
      fetchApi<Agent[]>('/api/agents').then(setAgents).catch(console.error);
    }
  }, [activeTab]);

  const createProject = async () => {
    if (!projectName.trim()) return;
    const project = await fetchApi<Project>('/api/projects', {
      method: 'POST',
      body: JSON.stringify({ name: projectName.trim() }),
    });
    setProjects(prev => [project, ...prev]);
    setProjectName('');
  };

  const createAgentToken = async () => {
    if (!tokenName.trim()) return;
    const token = await fetchApi<AgentTokenCreated>('/api/agent-tokens', {
      method: 'POST',
      body: JSON.stringify({ name: tokenName.trim() }),
    });
    setCreatedToken(token);
  };

  switch (activeTab) {
    case 'projects':
      return (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Projects</h2>
              <p className="text-muted-foreground">
                Keep definitions, runs, agents, and billing scoped to a project.
              </p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Input
                value={projectName}
                onChange={event => setProjectName(event.target.value)}
                placeholder="Project name"
              />
              <Button onClick={createProject} className="gap-2 shrink-0">
                <Plus className="h-4 w-4" />
                Create
              </Button>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map(project => (
              <Card key={project.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Folder className="h-4 w-4" />
                    {project.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <p>Slug: {project.slug}</p>
                  <p>Created {new Date(project.created_at).toLocaleDateString()}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      );

    case 'agents':
      return (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Agents</h2>
              <p className="text-muted-foreground">
                Mint a project token, run an agent, and it will poll queued runs.
              </p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Input
                value={tokenName}
                onChange={event => setTokenName(event.target.value)}
                placeholder="Agent token name"
              />
              <Button onClick={createAgentToken} className="gap-2 shrink-0">
                <Plus className="h-4 w-4" />
                Create Token
              </Button>
            </div>
          </div>
          {createdToken && (
            <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
              <CardContent className="py-4">
                <p className="text-sm font-medium">Agent token created</p>
                <code className="mt-2 block overflow-x-auto rounded bg-background p-3 text-xs">
                  SPARKTEST_AGENT_TOKEN={createdToken.token} cargo run -p sparktest-agent
                </code>
              </CardContent>
            </Card>
          )}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {agents.map(agent => (
              <Card key={agent.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Radio className="h-4 w-4" />
                    {agent.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm text-muted-foreground">
                  <p>Status: {agent.status}</p>
                  {agent.version && <p>Version: {agent.version}</p>}
                  {agent.last_seen_at && <p>Last seen {new Date(agent.last_seen_at).toLocaleString()}</p>}
                </CardContent>
              </Card>
            ))}
            {agents.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Radio className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No agents connected</h3>
                  <p className="text-muted-foreground">
                    Create a token and start `sparktest-agent` to claim queued runs.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      );

    case 'billing':
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Billing</h2>
            <p className="text-muted-foreground">
              Project plan limits are enforced around agents and queued execution.
            </p>
          </div>
          <BillingSection />
        </div>
      );

    case 'settings':
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
            <p className="text-muted-foreground">
              Configure project defaults for cloud execution.
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>API</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>Base URL: {API_BASE_URL}</p>
                <p>Human auth: Supabase JWT headers are expected at the API boundary.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Execution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>New runs enter the queue and are claimed by connected agents.</p>
                <p>Kubernetes job execution is owned by the agent process.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      );

    default:
      return null;
  }
};
