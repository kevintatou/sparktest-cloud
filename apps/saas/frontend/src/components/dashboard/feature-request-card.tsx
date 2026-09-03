import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare } from 'lucide-react';

export function FeatureRequestCard() {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold">Help shape SparkTest</h2>
            <Badge variant="secondary">Free Beta</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Tell us about a capability or bug that would make SparkTest better.
          </p>
        </div>
        <Button asChild className="shrink-0">
          <a
            href="https://github.com/kevintatou/sparktest-cloud/issues/new?title=Request%3A%20"
            target="_blank"
            rel="noreferrer"
          >
            <MessageSquare className="h-4 w-4" />
            Send request
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
