'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Radio } from 'lucide-react';
import { NavigationKey } from './navigation';
import { AgentStatusCard } from '@/components/agent/agent-status-card';
import { TokenManager } from '@/components/agent/token-manager';
import { InstallInstructions } from '@/components/agent/install-instructions';
import { API_BASE_URL } from '@/lib/api-config';
import { supabase } from '@/lib/supabase';
import { capturePostHog } from '@/lib/posthog';
import { AccountSettings } from '@/components/settings/account-settings';

type Agent = {
  id: string;
  name: string;
  version?: string;
  status: string;
  last_seen_at?: string;
};

export interface SaasSectionsProps {
  activeTab: NavigationKey;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.access_token) {
    return { Authorization: `Bearer ${session.access_token}` };
  }
  return {};
}

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
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
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentsLoaded, setAgentsLoaded] = useState(false);
  const [trackedOnlineAgents] = useState(() => new Set<string>());

  useEffect(() => {
    if (activeTab !== 'agents') return;

    let cancelled = false;
    const loadAgents = () => {
      fetchApi<Agent[]>('/api/agents')
        .then((agentList) => {
          if (cancelled) return;
          setAgents(agentList);
          setAgentsLoaded(true);
          agentList
            .filter((agent) => agent.status === 'online')
            .forEach((agent) => {
              if (!trackedOnlineAgents.has(agent.id)) {
                trackedOnlineAgents.add(agent.id);
                capturePostHog('agent_online', { agent_id: agent.id });
              }
            });
        })
        .catch(console.error);
    };

    loadAgents();
    const refreshTimer = window.setInterval(loadAgents, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(refreshTimer);
    };
  }, [activeTab]);

  switch (activeTab) {
    case 'agents':
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
          </div>

          {/* Start here */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Start an agent</h3>
              <p className="text-sm text-muted-foreground">
                Create a token below, then run this command on the machine that
                should execute your tests.
              </p>
            </div>
            <InstallInstructions token="" />
          </div>

          {/* Connected agents */}
          {agents.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Connected Agents</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {agents.map((agent) => (
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
                <h3 className="text-lg font-semibold mb-2">
                  No agents connected
                </h3>
                <p className="text-muted-foreground mb-4">
                  Create a token and start an agent to begin executing test
                  runs.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Token management */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Agent Tokens</h3>
            <TokenManager />
          </div>
        </div>
      );

    case 'settings':
      return <AccountSettings />;

    default:
      return null;
  }
};
