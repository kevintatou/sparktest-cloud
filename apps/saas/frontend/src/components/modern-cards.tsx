import React from 'react';
import { TestDefinition, TestRun, Executor, TestSuite } from '@tatou/sparktest-core';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Edit, Trash2, Clock, CheckCircle, XCircle, Loader } from 'lucide-react';
import { cn } from '@/lib/utils';

// Enhanced Test Definition Card
export interface ModernTestDefinitionCardProps {
  definition: TestDefinition;
  onEdit?: (definition: TestDefinition) => void;
  onDelete?: (id: string) => void;
  onRun?: (id: string) => void;
}

export const ModernTestDefinitionCard: React.FC<ModernTestDefinitionCardProps> = ({
  definition,
  onEdit,
  onDelete,
  onRun,
}) => {
  return (
    <Card className="premium-card group">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2 flex-1">
            <CardTitle className="text-lg font-semibold line-clamp-1 group-hover:text-primary transition-colors">
              {definition.name}
            </CardTitle>
            {definition.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                {definition.description}
              </p>
            )}
          </div>
          <Badge className={`language-badge language-${definition.language} shrink-0`}>
            {definition.language}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pb-4">
        <div className="text-xs text-muted-foreground">
          Updated {new Date(definition.updated_at).toLocaleDateString()}
        </div>
      </CardContent>

      <CardFooter className="pt-0 gap-2 flex-wrap">
        {onRun && (
          <Button 
            size="sm" 
            onClick={() => onRun(definition.id)}
            className="btn-gradient-primary gap-2 flex-1 sm:flex-none"
          >
            <Play className="h-3 w-3" />
            Run
          </Button>
        )}
        {onEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(definition)}
            className="gap-2 hover:border-primary/50"
          >
            <Edit className="h-3 w-3" />
            Edit
          </Button>
        )}
        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(definition.id)}
            className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-3 w-3" />
            Delete
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

// Enhanced Test Run Card
export interface ModernTestRunCardProps {
  run: TestRun;
}

export const ModernTestRunCard: React.FC<ModernTestRunCardProps> = ({ run }) => {
  const StatusIcon = {
    pending: Clock,
    running: Loader,
    completed: CheckCircle,
    failed: XCircle,
  }[run.status];

  return (
    <Card className="premium-card group">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">
            Run {run.id.slice(-8)}
          </CardTitle>
          <div className={`status-badge status-${run.status} flex items-center gap-1.5`}>
            <StatusIcon className={cn('h-3 w-3', run.status === 'running' && 'animate-spin')} />
            <span className="capitalize">{run.status}</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="text-sm text-muted-foreground">
          Created {new Date(run.created_at).toLocaleString()}
        </div>
        {run.error && (
          <div className="p-3 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/30 border-l-4 border-red-500 rounded-r-lg">
            <p className="text-sm text-red-800 dark:text-red-200 font-medium">Error</p>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">{run.error}</p>
          </div>
        )}
        {run.result && (
          <div className="p-3 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 border-l-4 border-green-500 rounded-r-lg">
            <p className="text-sm text-green-800 dark:text-green-200 font-medium">Result</p>
            <pre className="text-xs text-green-700 dark:text-green-300 mt-1 overflow-x-auto">
              {JSON.stringify(run.result, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Enhanced Executor Card
export interface ModernExecutorCardProps {
  executor: Executor;
  onEdit?: (executor: Executor) => void;
  onDelete?: (id: string) => void;
}

export const ModernExecutorCard: React.FC<ModernExecutorCardProps> = ({
  executor,
  onEdit,
  onDelete,
}) => {
  const typeColors = {
    local: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    kubernetes: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400 border-purple-200 dark:border-purple-800',
    docker: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800',
  };

  return (
    <Card className="premium-card group">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors">
              {executor.name}
            </CardTitle>
            <div className="flex gap-2">
              <Badge className={cn('language-badge', typeColors[executor.type])}>
                {executor.type}
              </Badge>
              <div className={`status-badge status-${executor.status}`}>
                <div className="flex items-center gap-1.5">
                  <div className={cn(
                    'h-2 w-2 rounded-full',
                    executor.status === 'active' ? 'bg-current animate-pulse' : 'bg-current opacity-50'
                  )}></div>
                  <span className="capitalize">{executor.status}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pb-4">
        <div className="text-sm text-muted-foreground">
          Updated {new Date(executor.updated_at).toLocaleDateString()}
        </div>
      </CardContent>

      <CardFooter className="pt-0 gap-2">
        {onEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(executor)}
            className="gap-2 hover:border-primary/50"
          >
            <Edit className="h-3 w-3" />
            Edit
          </Button>
        )}
        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(executor.id)}
            className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-3 w-3" />
            Delete
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

// Enhanced Test Suite Card
export interface ModernTestSuiteCardProps {
  suite: TestSuite;
  onEdit?: (suite: TestSuite) => void;
  onDelete?: (id: string) => void;
  onRun?: (id: string) => void;
}

export const ModernTestSuiteCard: React.FC<ModernTestSuiteCardProps> = ({
  suite,
  onEdit,
  onDelete,
  onRun,
}) => {
  return (
    <Card className="premium-card group">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors">
              {suite.name}
            </CardTitle>
            {suite.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                {suite.description}
              </p>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pb-4">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 bg-primary rounded-full"></div>
            <span>{suite.test_definitions.length} test{suite.test_definitions.length !== 1 ? 's' : ''}</span>
          </div>
          <span>•</span>
          <span>Updated {new Date(suite.updated_at).toLocaleDateString()}</span>
        </div>
      </CardContent>

      <CardFooter className="pt-0 gap-2 flex-wrap">
        {onRun && (
          <Button 
            size="sm" 
            onClick={() => onRun(suite.id)}
            className="btn-gradient-primary gap-2 flex-1 sm:flex-none"
          >
            <Play className="h-3 w-3" />
            Run Suite
          </Button>
        )}
        {onEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(suite)}
            className="gap-2 hover:border-primary/50"
          >
            <Edit className="h-3 w-3" />
            Edit
          </Button>
        )}
        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(suite.id)}
            className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-3 w-3" />
            Delete
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};