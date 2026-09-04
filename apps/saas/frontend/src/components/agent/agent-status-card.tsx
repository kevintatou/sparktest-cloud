'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Radio, Cpu, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

type Agent = {
  id: string;
  name: string;
  version?: string;
  status: string;
  last_seen_at?: string;
};

interface AgentStatusCardProps {
  agent: Agent;
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${diffDay}d ago`;
}

export function isAgentOnline(lastSeenAt?: string): boolean {
  if (!lastSeenAt) return false;
  const diffMs = Date.now() - new Date(lastSeenAt).getTime();
  return diffMs < 60_000; // Online if seen within 60s
}

export const AgentStatusCard: React.FC<AgentStatusCardProps> = ({ agent }) => {
  const online = isAgentOnline(agent.last_seen_at);

  return (
    <Card
      className={cn(
        'transition-all hover:shadow-md',
        online
          ? 'border-l-4 border-l-green-500'
          : 'border-l-4 border-l-zinc-300 dark:border-l-zinc-600'
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Radio className="h-4 w-4" />
            {agent.name}
          </CardTitle>
          <Badge
            variant={online ? 'default' : 'secondary'}
            className={cn(
              'text-xs',
              online &&
                'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            )}
          >
            <span
              className={cn(
                'mr-1.5 h-2 w-2 rounded-full inline-block',
                online ? 'bg-green-500 animate-pulse' : 'bg-zinc-400'
              )}
            />
            {online ? 'Online' : 'Offline'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {agent.version && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Cpu className="h-3.5 w-3.5" />
            <span>v{agent.version}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-muted-foreground">
          {online ? (
            <Wifi className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <WifiOff className="h-3.5 w-3.5" />
          )}
          <span>
            {agent.last_seen_at
              ? `Last seen ${timeAgo(agent.last_seen_at)}`
              : 'Never connected'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
