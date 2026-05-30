'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Shield, Key, ScrollText, Users, Plus, Trash2, Copy,
  Loader2, Eye, EyeOff, Clock, AlertTriangle, CheckCircle2,
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ── Types ──────────────────────────────────────────────────────

interface Role {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  permissions: string[];
  is_default: boolean;
  created_at: string;
}

interface AuditLogEntry {
  id: string;
  actor_email: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  metadata: Record<string, any>;
  ip_address: string | null;
  created_at: string;
}

interface ApiKey {
  id: string;
  project_id: string;
  name: string;
  key_prefix: string;
  permissions: string[];
  last_used_at: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
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

type SecurityTab = 'roles' | 'audit' | 'apikeys';

const ALL_PERMISSIONS = [
  'read', 'execute', 'manage_definitions', 'manage_suites',
  'manage_agents', 'manage_members', 'manage_billing', 'admin',
];

export function SecuritySection() {
  const [tab, setTab] = useState<SecurityTab>('roles');
  const [roles, setRoles] = useState<Role[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyRevealed, setNewKeyRevealed] = useState<string | null>(null);

  // Role form
  const [roleName, setRoleName] = useState('');
  const [rolePerms, setRolePerms] = useState<string[]>(['read']);

  // API key form
  const [keyName, setKeyName] = useState('');
  const [keyPerms, setKeyPerms] = useState<string[]>(['read']);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, logs, keys] = await Promise.all([
        fetchApi<Role[]>('/api/security/roles').catch(() => []),
        fetchApi<AuditLogEntry[]>('/api/security/audit?limit=100').catch(() => []),
        fetchApi<ApiKey[]>('/api/security/api-keys').catch(() => []),
      ]);
      setRoles(r);
      setAuditLogs(logs);
      setApiKeys(keys);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const createRole = async () => {
    if (!roleName.trim()) return;
    const created = await fetchApi<Role>('/api/security/roles', {
      method: 'POST',
      body: JSON.stringify({ name: roleName.trim(), permissions: rolePerms }),
    });
    setRoles(prev => [...prev, created]);
    setRoleName('');
    setRolePerms(['read']);
  };

  const deleteRole = async (id: string) => {
    await fetchApi(`/api/security/roles/${id}`, { method: 'DELETE' });
    setRoles(prev => prev.filter(r => r.id !== id));
  };

  const createApiKey = async () => {
    if (!keyName.trim()) return;
    const result = await fetchApi<{ api_key: ApiKey; raw_key: string }>('/api/security/api-keys', {
      method: 'POST',
      body: JSON.stringify({ name: keyName.trim(), permissions: keyPerms }),
    });
    setApiKeys(prev => [result.api_key, ...prev]);
    setNewKeyRevealed(result.raw_key);
    setKeyName('');
    setKeyPerms(['read']);
  };

  const revokeApiKey = async (id: string) => {
    await fetchApi(`/api/security/api-keys/${id}`, { method: 'DELETE' });
    setApiKeys(prev => prev.map(k => k.id === id ? { ...k, revoked_at: new Date().toISOString() } : k));
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
        <h2 className="text-2xl font-bold tracking-tight">Security &amp; Access</h2>
        <p className="text-muted-foreground">
          Role-based access control, audit trail, and API key management.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 border-b pb-2">
        {([
          { key: 'roles' as SecurityTab, label: 'Roles', icon: Users, count: roles.length },
          { key: 'audit' as SecurityTab, label: 'Audit Log', icon: ScrollText, count: auditLogs.length },
          { key: 'apikeys' as SecurityTab, label: 'API Keys', icon: Key, count: apiKeys.filter(k => !k.revoked_at).length },
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

      {/* Roles */}
      {tab === 'roles' && (
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">New Role</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-3">
                <Input value={roleName} onChange={e => setRoleName(e.target.value)} placeholder="Role name" className="flex-1" />
                <Button onClick={createRole} className="gap-2 shrink-0">
                  <Plus className="h-4 w-4" /> Create
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {ALL_PERMISSIONS.map(perm => (
                  <label key={perm} className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rolePerms.includes(perm)}
                      onChange={e => {
                        if (e.target.checked) setRolePerms(prev => [...prev, perm]);
                        else setRolePerms(prev => prev.filter(p => p !== perm));
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="text-muted-foreground">{perm}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {roles.map(role => (
              <Card key={role.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        {role.name}
                        {role.is_default && <Badge variant="outline" className="text-xs">Default</Badge>}
                      </h4>
                      {role.description && <p className="text-xs text-muted-foreground mt-1">{role.description}</p>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {role.permissions.map(perm => (
                      <Badge key={perm} variant="secondary" className="text-xs">{perm}</Badge>
                    ))}
                  </div>
                  {!role.is_default && (
                    <div className="flex gap-2 mt-3 pt-3 border-t">
                      <Button variant="ghost" size="sm" onClick={() => deleteRole(role.id)}
                        className="gap-1 text-destructive hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {roles.length === 0 && (
              <Card className="col-span-full">
                <CardContent className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-semibold mb-2">No custom roles</h3>
                  <p className="text-muted-foreground text-sm">Create roles to control team member permissions.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Audit Log */}
      {tab === 'audit' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {auditLogs.length > 0 ? (
              <div className="divide-y max-h-[600px] overflow-y-auto">
                {auditLogs.map(log => (
                  <div key={log.id} className="flex items-start gap-3 py-3">
                    <div className="mt-0.5">
                      {log.action.includes('create') ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : log.action.includes('delete') || log.action.includes('revoke') ? (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      ) : (
                        <Clock className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{log.actor_email || 'System'}</span>
                        <Badge variant="outline" className="text-xs">{log.action}</Badge>
                        <span className="text-xs text-muted-foreground">{log.resource_type}</span>
                        {log.resource_id && (
                          <code className="text-xs bg-muted px-1 rounded">{log.resource_id.slice(0, 8)}</code>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(log.created_at).toLocaleString()}
                        {log.ip_address && ` · ${log.ip_address}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ScrollText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-semibold mb-2">No audit events yet</h3>
                <p className="text-muted-foreground text-sm">Actions will be recorded here automatically.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* API Keys */}
      {tab === 'apikeys' && (
        <div className="space-y-4">
          {newKeyRevealed && (
            <Card className="border-green-300 bg-green-50 dark:bg-green-900/10">
              <CardContent className="py-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <p className="font-semibold text-green-800 dark:text-green-200">API key created — copy it now, it won't be shown again</p>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 bg-white dark:bg-gray-900 rounded border text-sm font-mono break-all">
                    {newKeyRevealed}
                  </code>
                  <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(newKeyRevealed); }} className="gap-1 shrink-0">
                    <Copy className="h-3.5 w-3.5" /> Copy
                  </Button>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setNewKeyRevealed(null)} className="mt-2 text-xs">
                  Dismiss
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle className="text-base">New API Key</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-3">
                <Input value={keyName} onChange={e => setKeyName(e.target.value)} placeholder="Key name (e.g. CI Pipeline)" className="flex-1" />
                <Button onClick={createApiKey} className="gap-2 shrink-0">
                  <Plus className="h-4 w-4" /> Generate
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {['read', 'execute', 'manage_definitions', 'admin'].map(perm => (
                  <label key={perm} className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={keyPerms.includes(perm)}
                      onChange={e => {
                        if (e.target.checked) setKeyPerms(prev => [...prev, perm]);
                        else setKeyPerms(prev => prev.filter(p => p !== perm));
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="text-muted-foreground">{perm}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-3">
            {apiKeys.map(key => (
              <Card key={key.id} className={key.revoked_at ? 'opacity-60' : ''}>
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <Key className={`h-5 w-5 ${key.revoked_at ? 'text-red-400' : 'text-muted-foreground'}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{key.name}</p>
                        {key.revoked_at && <Badge variant="destructive" className="text-xs">Revoked</Badge>}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <code>{key.key_prefix}…</code>
                        <span>Created {new Date(key.created_at).toLocaleDateString()}</span>
                        {key.last_used_at && <span>Last used {new Date(key.last_used_at).toLocaleDateString()}</span>}
                        {key.expires_at && <span>Expires {new Date(key.expires_at).toLocaleDateString()}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex flex-wrap gap-1">
                      {key.permissions.map(p => (
                        <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
                      ))}
                    </div>
                    {!key.revoked_at && (
                      <Button variant="ghost" size="sm" onClick={() => revokeApiKey(key.id)}
                        className="gap-1 text-destructive hover:text-destructive ml-2">
                        <Trash2 className="h-3.5 w-3.5" /> Revoke
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {apiKeys.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Key className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-semibold mb-2">No API keys</h3>
                  <p className="text-muted-foreground text-sm">Generate keys for CI pipelines and programmatic access.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
