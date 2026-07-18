'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useCi, Schedule, Webhook } from '@/hooks/use-ci';
import {
  Plus, Clock, Globe, Trash2, ToggleLeft, ToggleRight,
  GitBranch, Webhook as WebhookIcon, CalendarClock, Loader2,
  CheckCircle2, XCircle, ExternalLink,
} from 'lucide-react';

type CiTab = 'schedules' | 'webhooks' | 'integrations';

export function CiSection() {
  const {
    integrations, schedules, webhooks, deliveries, loading,
    createSchedule, toggleSchedule, deleteSchedule,
    createWebhook, toggleWebhook, deleteWebhook,
    loadDeliveries,
  } = useCi();

  const [tab, setTab] = useState<CiTab>('schedules');

  // Schedule form
  const [schedName, setSchedName] = useState('');
  const [schedCron, setSchedCron] = useState('0 */6 * * *');
  const [schedTz, setSchedTz] = useState('UTC');

  // Webhook form
  const [whName, setWhName] = useState('');
  const [whUrl, setWhUrl] = useState('');
  const [whEvents, setWhEvents] = useState('run.completed,run.failed');

  const handleCreateSchedule = async () => {
    if (!schedName.trim() || !schedCron.trim()) return;
    await createSchedule({ name: schedName, cron_expression: schedCron, timezone: schedTz });
    setSchedName('');
  };

  const handleCreateWebhook = async () => {
    if (!whName.trim() || !whUrl.trim()) return;
    await createWebhook({ name: whName, url: whUrl, events: whEvents.split(',').map(e => e.trim()) });
    setWhName('');
    setWhUrl('');
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
        <h2 className="text-2xl font-bold tracking-tight">CI &amp; Automation</h2>
        <p className="text-muted-foreground">
          Schedule recurring runs, configure webhooks, and connect CI providers.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 border-b pb-2">
        {([
          { key: 'schedules' as CiTab, label: 'Schedules', icon: CalendarClock, count: schedules.length },
          { key: 'webhooks' as CiTab, label: 'Webhooks', icon: Globe, count: webhooks.length },
          { key: 'integrations' as CiTab, label: 'CI Providers', icon: GitBranch, count: integrations.length },
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

      {/* Schedules tab */}
      {tab === 'schedules' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">New Schedule</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-3">
              <Input value={schedName} onChange={e => setSchedName(e.target.value)} placeholder="Schedule name" className="flex-1" />
              <Input value={schedCron} onChange={e => setSchedCron(e.target.value)} placeholder="0 */6 * * *" className="w-40" />
              <Input value={schedTz} onChange={e => setSchedTz(e.target.value)} placeholder="UTC" className="w-28" />
              <Button onClick={handleCreateSchedule} className="gap-2 shrink-0">
                <Plus className="h-4 w-4" /> Create
              </Button>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {schedules.map(schedule => (
              <ScheduleCard
                key={schedule.id}
                schedule={schedule}
                onToggle={() => toggleSchedule(schedule.id, !schedule.enabled)}
                onDelete={() => deleteSchedule(schedule.id)}
              />
            ))}
            {schedules.length === 0 && (
              <Card className="col-span-full">
                <CardContent className="text-center py-12">
                  <CalendarClock className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-semibold mb-2">No schedules yet</h3>
                  <p className="text-muted-foreground text-sm">Create a cron schedule to run tests automatically.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Webhooks tab */}
      {tab === 'webhooks' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">New Webhook</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-3">
              <Input value={whName} onChange={e => setWhName(e.target.value)} placeholder="Webhook name" className="w-40" />
              <Input value={whUrl} onChange={e => setWhUrl(e.target.value)} placeholder="https://example.com/hook" className="flex-1" />
              <Input value={whEvents} onChange={e => setWhEvents(e.target.value)} placeholder="run.completed,run.failed" className="w-56" />
              <Button onClick={handleCreateWebhook} className="gap-2 shrink-0">
                <Plus className="h-4 w-4" /> Create
              </Button>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {webhooks.map(webhook => (
              <WebhookCard
                key={webhook.id}
                webhook={webhook}
                onToggle={() => toggleWebhook(webhook.id, !webhook.enabled)}
                onDelete={() => deleteWebhook(webhook.id)}
                onViewDeliveries={() => loadDeliveries(webhook.id)}
              />
            ))}
            {webhooks.length === 0 && (
              <Card className="col-span-full">
                <CardContent className="text-center py-12">
                  <Globe className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-semibold mb-2">No webhooks yet</h3>
                  <p className="text-muted-foreground text-sm">Get notified when runs complete or fail.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* CI Providers tab */}
      {tab === 'integrations' && (
        <div className="grid gap-4 md:grid-cols-3">
          {(['github', 'gitlab', 'bitbucket'] as const).map(provider => {
            const connected = integrations.find(i => i.provider === provider);
            return (
              <Card key={provider} className={connected ? 'border-green-300' : ''}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 capitalize">
                    <GitBranch className="h-4 w-4" />
                    {provider === 'github' ? 'GitHub Actions' : provider === 'gitlab' ? 'GitLab CI' : 'Bitbucket Pipelines'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {connected ? (
                    <div className="space-y-2">
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">Connected</Badge>
                      <p className="text-sm text-muted-foreground">{connected.repo_owner}/{connected.repo_name}</p>
                      {connected.last_sync_at && (
                        <p className="text-xs text-muted-foreground">Last sync {new Date(connected.last_sync_at).toLocaleString()}</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Trigger SparkTest runs from your {provider} pipelines.
                      </p>
                      <Button variant="outline" size="sm" className="gap-2 w-full">
                        <ExternalLink className="h-3.5 w-3.5" /> Connect
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ScheduleCard({ schedule, onToggle, onDelete }: {
  schedule: Schedule;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h4 className="font-semibold">{schedule.name}</h4>
            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{schedule.cron_expression}</code>
            <span className="text-xs text-muted-foreground ml-2">{schedule.timezone}</span>
          </div>
          <Badge variant={schedule.enabled ? 'default' : 'secondary'}>
            {schedule.enabled ? 'Active' : 'Paused'}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-3">
          <span>{schedule.run_count} runs</span>
          {schedule.next_run_at && <span>Next: {new Date(schedule.next_run_at).toLocaleString()}</span>}
        </div>
        <div className="flex gap-2 mt-3 pt-3 border-t">
          <Button variant="ghost" size="sm" onClick={onToggle} className="gap-1">
            {schedule.enabled ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />}
            {schedule.enabled ? 'Pause' : 'Enable'}
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete} className="gap-1 text-destructive hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function WebhookCard({ webhook, onToggle, onDelete, onViewDeliveries }: {
  webhook: Webhook;
  onToggle: () => void;
  onDelete: () => void;
  onViewDeliveries: () => void;
}) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h4 className="font-semibold">{webhook.name}</h4>
            <p className="text-xs text-muted-foreground truncate max-w-[240px]">{webhook.url}</p>
          </div>
          <Badge variant={webhook.enabled ? 'default' : 'secondary'}>
            {webhook.enabled ? 'Active' : 'Disabled'}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {webhook.events.map(event => (
            <Badge key={event} variant="outline" className="text-xs">{event}</Badge>
          ))}
        </div>
        <div className="flex gap-2 mt-3 pt-3 border-t">
          <Button variant="ghost" size="sm" onClick={onToggle} className="gap-1">
            {webhook.enabled ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />}
            {webhook.enabled ? 'Disable' : 'Enable'}
          </Button>
          <Button variant="ghost" size="sm" onClick={onViewDeliveries} className="gap-1">
            <Clock className="h-3.5 w-3.5" /> Deliveries
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete} className="gap-1 text-destructive hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
