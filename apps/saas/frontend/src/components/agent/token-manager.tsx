'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Key, Trash2, Copy, Check, Shield } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api-config';
import { supabase } from '@/lib/supabase';

type AgentToken = {
  id: string;
  project_id: string;
  name: string;
  token_hash: string;
  last_used_at?: string;
  revoked_at?: string;
  created_at: string;
};

type AgentTokenCreated = {
  id: string;
  name: string;
  token: string;
  created_at: string;
};

interface TokenManagerProps {
  onTokenCreated?: (token: AgentTokenCreated) => void;
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

export const TokenManager: React.FC<TokenManagerProps> = ({
  onTokenCreated,
}) => {
  const [tokens, setTokens] = useState<AgentToken[]>([]);
  const [tokenName, setTokenName] = useState('');
  const [createdToken, setCreatedToken] = useState<AgentTokenCreated | null>(
    null
  );
  const [copied, setCopied] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchApi<AgentToken[]>('/api/agent-tokens')
      .then(setTokens)
      .catch(console.error);
  }, []);

  const createToken = async () => {
    const name = tokenName.trim() || 'default-agent';
    setCreating(true);
    try {
      const token = await fetchApi<AgentTokenCreated>('/api/agent-tokens', {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      setCreatedToken(token);
      setTokenName('');
      onTokenCreated?.(token);
      // Refresh token list
      const updated = await fetchApi<AgentToken[]>('/api/agent-tokens');
      setTokens(updated);
    } catch (error) {
      console.error('Failed to create token:', error);
    } finally {
      setCreating(false);
    }
  };

  const revokeToken = async (id: string, name: string) => {
    const confirmed = window.confirm(
      `Revoke token "${name}"?\n\nThis will immediately disconnect any agent using it and cannot be undone.`
    );
    if (!confirmed) return;
    try {
      await fetchApi(`/api/agent-tokens/${id}`, { method: 'DELETE' });
      setTokens((prev) => prev.filter((t) => t.id !== id));
    } catch (error) {
      console.error('Failed to revoke token:', error);
    }
  };

  const copyToken = async () => {
    if (!createdToken) return;
    await navigator.clipboard.writeText(createdToken.token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeTokens = tokens.filter((t) => !t.revoked_at);

  return (
    <div className="space-y-4">
      {/* Create token */}
      <div className="flex gap-2">
        <Input
          value={tokenName}
          onChange={(e) => setTokenName(e.target.value)}
          placeholder="Token name (e.g. production-agent)"
          className="max-w-xs"
          onKeyDown={(e) => e.key === 'Enter' && createToken()}
        />
        <Button
          onClick={createToken}
          disabled={creating}
          className="gap-2 shrink-0"
        >
          <Plus className="h-4 w-4" />
          Create Token
        </Button>
      </div>

      {/* Newly created token banner */}
      {createdToken && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
          <CardContent className="py-4 space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-600" />
              <p className="text-sm font-medium text-green-800 dark:text-green-300">
                Token created — copy it now, it won&apos;t be shown again
              </p>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-mono border overflow-x-auto">
                {createdToken.token}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={copyToken}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active tokens list */}
      {activeTokens.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            Active Tokens
          </h4>
          {activeTokens.map((token) => (
            <div
              key={token.id}
              className="flex items-center justify-between rounded-lg border px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <Key className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{token.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Created {new Date(token.created_at).toLocaleDateString()}
                    {token.last_used_at && (
                      <>
                        {' '}
                        · Last used{' '}
                        {new Date(token.last_used_at).toLocaleDateString()}
                      </>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {token.token_hash.slice(0, 8)}…
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => revokeToken(token.id, token.name)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
