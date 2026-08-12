'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Check, Copy, Terminal, Box, Ship, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type InstallMethod = 'docker' | 'cargo' | 'kubernetes';

interface InstallInstructionsProps {
  token: string;
  apiUrl?: string;
  compact?: boolean;
}

export const InstallInstructions: React.FC<InstallInstructionsProps> = ({
  token,
  apiUrl = process.env.NEXT_PUBLIC_API_URL ||
    'https://sparktest-cloud-api.onrender.com',
  compact = false,
}) => {
  const agentImage = process.env.NEXT_PUBLIC_AGENT_IMAGE;
  const availableMethods: InstallMethod[] = agentImage
    ? ['cargo', 'docker', 'kubernetes']
    : ['cargo'];
  const [method, setMethod] = useState<InstallMethod>('cargo');
  const [copied, setCopied] = useState(false);

  const displayToken = token || 'YOUR_TOKEN';

  const instructions: Record<
    InstallMethod,
    {
      label: string;
      icon: React.ReactNode;
      command: string;
      description: string;
    }
  > = {
    docker: {
      label: 'Docker',
      icon: <Box className="h-4 w-4" />,
      description:
        'Run the agent as a Docker container. Recommended for most setups.',
      command: `docker run -d \\
  --name sparktest-agent \\
  -e SPARKTEST_CLOUD_URL=${apiUrl} \\
  -e SPARKTEST_AGENT_TOKEN=${displayToken} \\
  ${agentImage || 'YOUR_AGENT_IMAGE'}`,
    },
    cargo: {
      label: 'Run from source',
      icon: <Terminal className="h-4 w-4" />,
      description: agentImage
        ? 'Build and run from source with Rust. Best for development.'
        : 'Recommended for now. The public Docker image is not published yet.',
      command: `# Clone the repo
git clone https://github.com/kevintatou/sparktest-cloud.git
cd sparktest-cloud

# Run the agent
export SPARKTEST_CLOUD_URL=${apiUrl}
export SPARKTEST_AGENT_TOKEN=${displayToken}
cargo run -p sparktest-agent`,
    },
    kubernetes: {
      label: 'Kubernetes',
      icon: <Ship className="h-4 w-4" />,
      description: 'Deploy as a K8s Deployment. Best for production workloads.',
      command: `# Create the secret
kubectl create secret generic sparktest-agent \\
  --from-literal=token=${displayToken}

# Apply the deployment
cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sparktest-agent
spec:
  replicas: 1
  selector:
    matchLabels:
      app: sparktest-agent
  template:
    metadata:
      labels:
        app: sparktest-agent
    spec:
      containers:
      - name: agent
        image: ${agentImage || 'YOUR_AGENT_IMAGE'}
        env:
        - name: SPARKTEST_CLOUD_URL
          value: "${apiUrl}"
        - name: SPARKTEST_AGENT_TOKEN
          valueFrom:
            secretKeyRef:
              name: sparktest-agent
              key: token
EOF`,
    },
  };

  const copyCommand = async () => {
    await navigator.clipboard.writeText(instructions[method].command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn('space-y-4', compact && 'space-y-3')}>
      {/* Method selector */}
      <div className="flex gap-2">
        {availableMethods.map((key) => (
          <Button
            key={key}
            variant={method === key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMethod(key)}
            className="gap-2"
          >
            {instructions[key].icon}
            {instructions[key].label}
          </Button>
        ))}
      </div>

      {!compact && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {instructions[method].description}
          </p>
          {!agentImage && (
            <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                Docker and Kubernetes commands are hidden until a public agent
                image is published.
              </span>
            </div>
          )}
        </div>
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
            {instructions[method].command}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
};
