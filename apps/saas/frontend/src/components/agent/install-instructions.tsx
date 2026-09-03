'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InstallInstructionsProps {
  token: string;
  compact?: boolean;
}

export const InstallInstructions: React.FC<InstallInstructionsProps> = ({
  token,
  compact = false,
}) => {
  const [copied, setCopied] = useState(false);

  const displayToken = token || 'YOUR_TOKEN';

  const command = `export SPARKTEST_AGENT_TOKEN=${displayToken}
curl -fsSL https://raw.githubusercontent.com/kevintatou/sparktest-cloud/main/scripts/install-agent.sh | bash`;

  const copyCommand = async () => {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn('space-y-4', compact && 'space-y-3')}>
      {!compact && (
        <p className="text-sm text-muted-foreground">
          Works on any machine with Git, Rust, and Cargo installed.
        </p>
      )}

      {/* Command block */}
      <Card className="bg-zinc-950 border-zinc-800">
        <CardContent className="p-0">
          <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
            <span className="text-xs text-zinc-400 font-mono">terminal</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyCommand}
              className="h-7 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </>
              )}
            </Button>
          </div>
          <pre className="p-4 text-sm text-green-400 font-mono overflow-x-auto whitespace-pre-wrap break-all">
            {command}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
};
