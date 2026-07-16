'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, CreditCard, Folder, Radio, Settings, Rocket } from 'lucide-react';
import { NavigationKey } from './navigation';
import { BillingSection } from './billing-section';
import { AgentOnboarding } from '@/components/agent/agent-onboarding';
import { AgentStatusCard } from '@/components/agent/agent-status-card';
import { TokenManager } from '@/components/agent/token-manager';
import { InstallInstructions } from '@/components/agent/install-instructions';
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

export interface SaasSectionsProps {
  activeTab: NavigationKey;
  setActiveTab?: (tab: NavigationKey) => void;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    return { Authorization: `Bearer ${session.access_token}` };
  }
  return {};
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

export const SaasSections: React.FC<SaasSectionsProps> = ({ activeTab, setActiveTab }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [projectName, setProjectName] = useState('');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [agentsLoaded, setAgentsLoaded] = useState(false);

  useEffect(() => {
    if (activeTab === 'projects') {
      fetchApi<Project[]>('/api/projects').then(setProjects).catch(console.error);
    }
    if (activeTab === 'agents') {
      fetchApi<Agent[]>('/api/agents')
        .then((agentList) => {
          setAgents(agentList);
          setAgentsLoaded(true);
          // Show onboarding wizard if no agents have ever connected
          if (agentList.length === 0) {
            setShowOnboarding(true);
          }
        })
        .catch(console.error);
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
      // Show the onboarding wizard for first-time users
      if (showOnboarding) {
        return (
          <AgentOnboarding
            onComplete={() => {
              setShowOnboarding(false);
              // Refresh agents list
              fetchApi<Agent[]>('/api/agents').then(setAgents).catch(console.error);
            }}
            onSkip={() => setShowOnboarding(false)}
          />
        );
      }

      return (
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Agents</h2>
              <p className="text-muted-foreground">
                Agents run in your infrastructure and execute queued test runs.
              </p>
            </div>
            {agents.length > 0 && (
              <Button
                variant="outline"
                onClick={() => setShowOnboarding(true)}
                className="gap-2"
              >
                <Rocket className="h-4 w-4" />
                Setup Wizard
              </Button>
            )}
          </div>

          {/* Connected agents */}
          {agents.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Connected Agents</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {agents.map(agent => (
                  <AgentStatusCard key={agent.id} agent={agent} />
                ))}
              </div>
            </div>
          )}

          {/* Empty state with CTA */}
          {agentsLoaded && agents.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Radio className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No agents connected</h3>
                <p className="text-muted-foreground mb-4">
                  Create a token and start an agent to begin executing test runs.
                </p>
                <Button onClick={() => setShowOnboarding(true)} className="gap-2">
                  <Rocket className="h-4 w-4" />
                  Launch Setup Wizard
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Token management */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Agent Tokens</h3>
            <TokenManager />
          </div>

          {/* Quick install reference */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Install Reference</h3>
            <p className="text-sm text-muted-foreground">
              Use an existing token to start a new agent instance.
            </p>
            <InstallInstructions token="" compact />
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
