'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Check, ChevronRight, Key, Radio, Rocket, Loader2, Copy, Shield,
  ArrowLeft, PartyPopper
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { InstallInstructions } from './install-instructions';
import { supabase } from '@/lib/supabase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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

interface AgentOnboardingProps {
  onComplete: () => void;
  onSkip: () => void;
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

const STEPS = [
  { id: 'token', title: 'Create Agent Token', icon: Key },
  { id: 'install', title: 'Install & Run Agent', icon: Radio },
  { id: 'verify', title: 'Verify Connection', icon: Check },
] as const;

type StepId = typeof STEPS[number]['id'];

export const AgentOnboarding: React.FC<AgentOnboardingProps> = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState<StepId>('token');
  const [tokenName, setTokenName] = useState('my-agent');
  const [createdToken, setCreatedToken] = useState<AgentTokenCreated | null>(null);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [polling, setPolling] = useState(false);
  const [connected, setConnected] = useState(false);

  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);

  const createToken = async () => {
    if (!tokenName.trim()) return;
    setCreating(true);
    try {
      const token = await fetchApi<AgentTokenCreated>('/api/agent-tokens', {
        method: 'POST',
        body: JSON.stringify({ name: tokenName.trim() }),
      });
      setCreatedToken(token);
    } catch (error) {
      console.error('Failed to create token:', error);
    } finally {
      setCreating(false);
    }
  };

  const copyToken = async () => {
    if (!createdToken) return;
    await navigator.clipboard.writeText(createdToken.token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Poll for agent connection
  const pollAgents = useCallback(async () => {
    try {
      const agentList = await fetchApi<Agent[]>('/api/agents');
      setAgents(agentList);
      const online = agentList.some(a => {
        if (!a.last_seen_at) return false;
        return Date.now() - new Date(a.last_seen_at).getTime() < 60_000;
      });
      if (online) {
        setConnected(true);
        setPolling(false);
      }
    } catch {
      // ignore polling errors
    }
  }, []);

  useEffect(() => {
    if (currentStep !== 'verify' || connected) return;
    setPolling(true);
    pollAgents(); // Immediate first check
    const interval = setInterval(pollAgents, 3000);
    return () => {
      clearInterval(interval);
      setPolling(false);
    };
  }, [currentStep, connected, pollAgents]);

  const goToStep = (step: StepId) => setCurrentStep(step);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
          <Rocket className="h-4 w-4" />
          Agent Setup
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Connect your first agent</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Agents run in your infrastructure and execute test runs. Generate a token, start the agent, then verify the connection.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2">
        {STEPS.map((step, i) => {
          const StepIcon = step.icon;
          const isActive = step.id === currentStep;
          const isComplete = i < currentStepIndex || (step.id === 'verify' && connected);
          return (
            <div key={step.id} className="flex items-center gap-2">
              {i > 0 && (
                <div className={cn(
                  "w-12 h-0.5 rounded",
                  i <= currentStepIndex ? "bg-primary" : "bg-muted"
                )} />
              )}
              <button
                onClick={() => {
                  if (i <= currentStepIndex || isComplete) goToStep(step.id);
                }}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                  isActive && "bg-primary text-primary-foreground",
                  isComplete && !isActive && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                  !isActive && !isComplete && "bg-muted text-muted-foreground"
                )}
              >
                {isComplete && !isActive ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <StepIcon className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">{step.title}</span>
                <span className="sm:hidden">{i + 1}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <Card>
        <CardContent className="pt-6">
          {/* Step 1: Create Token */}
          {currentStep === 'token' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-1">Generate an agent token</h3>
                <p className="text-sm text-muted-foreground">
                  The token authenticates your agent with SparkTest Cloud. Give it a descriptive name.
                </p>
              </div>

              {!createdToken ? (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={tokenName}
                      onChange={(e) => setTokenName(e.target.value)}
                      placeholder="e.g. production-agent, staging-runner"
                      className="max-w-sm"
                      onKeyDown={(e) => e.key === 'Enter' && createToken()}
                    />
                    <Button onClick={createToken} disabled={creating || !tokenName.trim()} className="gap-2">
                      {creating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Key className="h-4 w-4" />
                      )}
                      Generate Token
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-green-600" />
                      <p className="text-sm font-medium text-green-800 dark:text-green-300">
                        Save this token — it won&apos;t be shown again
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 rounded bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-mono border overflow-x-auto">
                        {createdToken.token}
                      </code>
                      <Button variant="outline" size="sm" onClick={copyToken} className="shrink-0">
                        {copied ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={() => goToStep('install')} className="gap-2">
                      Next: Install Agent
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Install & Run */}
          {currentStep === 'install' && createdToken && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-1">Install and run the agent</h3>
                <p className="text-sm text-muted-foreground">
                  Run the source-based command for now. Container commands will appear here once a public agent image is published.
                </p>
              </div>

              <InstallInstructions token={createdToken.token} />

              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => goToStep('token')} className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button onClick={() => goToStep('verify')} className="gap-2">
                  Next: Verify Connection
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Verify */}
          {currentStep === 'verify' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-1">
                  {connected ? 'Agent connected!' : 'Waiting for agent...'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {connected
                    ? 'Your agent is online and ready to execute test runs.'
                    : 'Start the agent with the command from the previous step. We\'ll detect it automatically.'}
                </p>
              </div>

              {!connected ? (
                <div className="flex flex-col items-center py-8 space-y-4">
                  <div className="relative">
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                      <Radio className="h-8 w-8 text-muted-foreground animate-pulse" />
                    </div>
                    {polling && (
                      <div className="absolute -top-1 -right-1">
                        <Loader2 className="h-5 w-5 text-primary animate-spin" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Checking every 3 seconds...
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center py-8 space-y-4">
                  <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <PartyPopper className="h-8 w-8 text-green-600" />
                  </div>
                  {agents.filter(a => a.last_seen_at && Date.now() - new Date(a.last_seen_at).getTime() < 60_000).map(agent => (
                    <div key={agent.id} className="flex items-center gap-3 px-4 py-2 rounded-lg border bg-card">
                      <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="font-medium">{agent.name}</span>
                      {agent.version && (
                        <Badge variant="secondary" className="text-xs">v{agent.version}</Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => goToStep('install')} className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                {connected ? (
                  <Button onClick={onComplete} className="gap-2">
                    <Rocket className="h-4 w-4" />
                    Start Testing
                  </Button>
                ) : (
                  <Button variant="outline" onClick={onSkip}>
                    Skip for now
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Skip link */}
      {currentStep !== 'verify' && (
        <div className="text-center">
          <button
            onClick={onSkip}
            className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors"
          >
            I&apos;ll set this up later
          </button>
        </div>
      )}
    </div>
  );
};
