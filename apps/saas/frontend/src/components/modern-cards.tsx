import React from 'react';
import { TestDefinition, TestRun, Executor, TestSuite } from '@sparktest/core';
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
  const languageColors = {
    javascript: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    python: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    rust: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
  };

  return (
    <Card className="group hover:shadow-md transition-all duration-200 border-muted/40 hover:border-muted">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold line-clamp-1">
              {definition.name}
            </CardTitle>
            {definition.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {definition.description}
              </p>
            )}
          </div>
          <Badge 
            variant="outline" 
            className={cn('ml-2', languageColors[definition.language])}
          >
            {definition.language}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="text-xs text-muted-foreground">
          Updated {new Date(definition.updated_at).toLocaleDateString()}
        </div>
      </CardContent>

      <CardFooter className="pt-0 gap-2">
        {onRun && (
          <Button 
            size="sm" 
            onClick={() => onRun(definition.id)}
            className="gap-1"
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
            className="gap-1"
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
            className="gap-1 text-destructive hover:text-destructive"
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
  const statusConfig = {
    pending: {
      icon: Clock,
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
    },
    running: {
      icon: Loader,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    },
    completed: {
      icon: CheckCircle,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
    },
    failed: {
      icon: XCircle,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/20',
    },
  };

  const config = statusConfig[run.status];
  const StatusIcon = config.icon;

  return (
    <Card className="hover:shadow-md transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            Run {run.id.slice(-8)}
          </CardTitle>
          <Badge variant="outline" className={cn('gap-1', config.bgColor)}>
            <StatusIcon className={cn('h-3 w-3', config.color, run.status === 'running' && 'animate-spin')} />
            <span className={config.color}>{run.status}</span>
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="text-sm text-muted-foreground">
          Created {new Date(run.created_at).toLocaleString()}
        </div>
        {run.error && (
          <div className="mt-2 p-2 bg-destructive/10 border-l-2 border-destructive rounded text-sm text-destructive">
            {run.error}
          </div>
        )}
        {run.result && (
          <div className="mt-2 p-2 bg-muted rounded text-sm">
            <pre className="text-xs">{JSON.stringify(run.result, null, 2)}</pre>
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
  const statusConfig = {
    active: {
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
    },
    inactive: {
      color: 'text-gray-600 dark:text-gray-400',
      bgColor: 'bg-gray-100 dark:bg-gray-900/20',
    },
  };

  const typeColors = {
    local: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    kubernetes: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
    docker: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-400',
  };

  const config = statusConfig[executor.status];

  return (
    <Card className="group hover:shadow-md transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{executor.name}</CardTitle>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline" className={typeColors[executor.type]}>
                {executor.type}
              </Badge>
              <Badge variant="outline" className={config.bgColor}>
                <span className={config.color}>{executor.status}</span>
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
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
            className="gap-1"
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
            className="gap-1 text-destructive hover:text-destructive"
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
    <Card className="group hover:shadow-md transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{suite.name}</CardTitle>
            {suite.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {suite.description}
              </p>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="text-sm text-muted-foreground">
          {suite.test_definitions.length} test{suite.test_definitions.length !== 1 ? 's' : ''} • 
          Updated {new Date(suite.updated_at).toLocaleDateString()}
        </div>
      </CardContent>

      <CardFooter className="pt-0 gap-2">
        {onRun && (
          <Button 
            size="sm" 
            onClick={() => onRun(suite.id)}
            className="gap-1"
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
            className="gap-1"
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
            className="gap-1 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" />
            Delete
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};