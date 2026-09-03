import React from 'react';
import { Definition, Run, Executor, Suite } from '@tatou/core';

// Clean UI components for SparkTest
export interface TestDefinitionCardProps {
  definition: Definition;
  onEdit?: (definition: Definition) => void;
  onDelete?: (id: string) => void;
  onRun?: (id: string) => void;
}

export const TestDefinitionCard: React.FC<TestDefinitionCardProps> = ({
  definition,
  onEdit,
  onDelete,
  onRun,
}) => {
  const getLanguageClasses = (image: string) => {
    const classes = {
      javascript:
        'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
      python:
        'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      rust: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800',
      default:
        'bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800',
    };
    return classes[image as keyof typeof classes] || classes.default;
  };

  return (
    <div className="bg-card rounded-lg border p-4 transition-all duration-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="space-y-1 flex-1">
          <h3 className="font-semibold text-card-foreground line-clamp-1">
            {definition.name}
          </h3>
          {definition.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {definition.description}
            </p>
          )}
        </div>
        <span
          className={`px-2 py-1 rounded text-xs font-medium border ${getLanguageClasses(definition.image)}`}
        >
          {definition.image}
        </span>
      </div>

      <div className="text-xs text-muted-foreground mb-3">
        Created {new Date(definition.createdAt).toLocaleDateString()}
      </div>

      <div className="flex gap-2 flex-wrap">
        {onRun && (
          <button
            onClick={() => onRun(definition.id)}
            className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground font-medium rounded text-sm transition-colors hover:bg-primary/90"
          >
            <svg
              className="h-3 w-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6-8h12a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2z"
              />
            </svg>
            Run
          </button>
        )}
        {onEdit && (
          <button
            onClick={() => onEdit(definition)}
            className="flex items-center gap-1 px-3 py-1.5 border border-border text-foreground font-medium rounded text-sm transition-colors hover:bg-accent"
          >
            <svg
              className="h-3 w-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Edit
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(definition.id)}
            className="flex items-center gap-1 px-3 py-1.5 text-destructive font-medium rounded text-sm transition-colors hover:bg-destructive/10"
          >
            <svg
              className="h-3 w-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Delete
          </button>
        )}
      </div>
    </div>
  );
};

export interface TestRunCardProps {
  run: Run;
  onClick?: (id: string) => void;
  onDelete?: (id: string) => void;
  onRetry?: (id: string) => void;
}

export const TestRunCard: React.FC<TestRunCardProps> = ({
  run,
  onClick,
  onDelete,
  onRetry,
}) => {
  const getStatusConfig = (status: string) => {
    const configs = {
      queued: {
        classes:
          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
        icon: (
          <svg
            className="h-3 w-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ),
      },
      pending: {
        classes:
          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
        icon: (
          <svg
            className="h-3 w-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ),
      },
      running: {
        classes:
          'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
        icon: (
          <svg
            className="h-3 w-3 animate-spin"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        ),
      },
      completed: {
        classes:
          'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
        icon: (
          <svg
            className="h-3 w-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ),
      },
      passed: {
        classes:
          'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
        icon: (
          <svg
            className="h-3 w-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ),
      },
      failed: {
        classes: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
        icon: (
          <svg
            className="h-3 w-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ),
      },
      error: {
        classes: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
        icon: (
          <svg
            className="h-3 w-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ),
      },
      cancelled: {
        classes:
          'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300',
        icon: (
          <svg
            className="h-3 w-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ),
      },
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  const statusConfig = getStatusConfig(run.status);

  return (
    <div
      className={`bg-card rounded-lg border p-4 transition-all duration-200 hover:shadow-md ${onClick ? 'cursor-pointer hover:border-primary/50' : ''}`}
      onClick={onClick ? () => onClick(run.id) : undefined}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-card-foreground">
          Run {run.id.slice(-8)}
        </h4>
        <div
          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${statusConfig.classes}`}
        >
          {statusConfig.icon}
          <span className="capitalize">{run.status}</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-sm text-muted-foreground">
          Created {new Date(run.createdAt).toLocaleString()}
        </div>

        {run.logs && run.logs.length > 0 && (
          <div className="p-2 bg-destructive/10 border-l-2 border-destructive rounded-r">
            <p className="text-sm text-destructive font-medium">Error</p>
            <p className="text-sm text-destructive/80 mt-1">{run.logs[0]}</p>
          </div>
        )}

        {run.duration && (
          <div className="p-2 bg-green-50 dark:bg-green-900/20 border-l-2 border-green-500 rounded-r">
            <p className="text-sm text-green-800 dark:text-green-200 font-medium">
              Completed
            </p>
            <p className="text-xs text-green-700 dark:text-green-300 mt-1">
              Duration: {run.duration}ms
            </p>
          </div>
        )}
      </div>

      {(onDelete || onRetry) && (
        <div className="flex gap-2 mt-4 pt-3 border-t">
          {onRetry && (
            <button
              onClick={() => onRetry(run.id)}
              className="flex items-center gap-1 px-3 py-1.5 border border-border text-foreground font-medium rounded text-sm transition-colors hover:bg-accent"
            >
              <svg
                className="h-3 w-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Retry
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(run.id)}
              className="flex items-center gap-1 px-3 py-1.5 text-destructive font-medium rounded text-sm transition-colors hover:bg-destructive/10"
            >
              <svg
                className="h-3 w-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export interface ExecutorCardProps {
  executor: Executor;
  onEdit?: (executor: Executor) => void;
  onDelete?: (id: string) => void;
}

export const ExecutorCard: React.FC<ExecutorCardProps> = ({
  executor,
  onEdit,
  onDelete,
}) => {
  const getTypeClasses = (image: string) => {
    const classes = {
      'local-runner':
        'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
      'k8s-runner':
        'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300',
      'docker-runner':
        'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300',
      default:
        'bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-300',
    };
    return classes[image as keyof typeof classes] || classes.default;
  };

  return (
    <div className="bg-card rounded-lg border p-4 transition-all duration-200 hover:shadow-md">
      <div className="flex items-start justify-between mb-3">
        <div className="space-y-2 flex-1">
          <h3 className="font-semibold text-card-foreground">
            {executor.name}
          </h3>
          <div className="flex gap-2 flex-wrap">
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${getTypeClasses(executor.image)}`}
            >
              {executor.image}
            </span>
          </div>
        </div>
      </div>

      <div className="text-sm text-muted-foreground mb-3">
        Created {new Date(executor.createdAt).toLocaleDateString()}
      </div>

      <div className="flex gap-2">
        {onEdit && (
          <button
            onClick={() => onEdit(executor)}
            className="flex items-center gap-1 px-3 py-1.5 border border-border text-foreground font-medium rounded text-sm transition-colors hover:bg-accent"
          >
            <svg
              className="h-3 w-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Edit
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(executor.id)}
            className="flex items-center gap-1 px-3 py-1.5 text-destructive font-medium rounded text-sm transition-colors hover:bg-destructive/10"
          >
            <svg
              className="h-3 w-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Delete
          </button>
        )}
      </div>
    </div>
  );
};

export interface TestSuiteCardProps {
  suite: Suite;
  onEdit?: (suite: Suite) => void;
  onDelete?: (id: string) => void;
  onRun?: (id: string) => void;
}

export const TestSuiteCard: React.FC<TestSuiteCardProps> = ({
  suite,
  onEdit,
  onDelete,
  onRun,
}) => {
  return (
    <div className="bg-card rounded-lg border p-4 transition-all duration-200 hover:shadow-md">
      <div className="flex items-start justify-between mb-3">
        <div className="space-y-1 flex-1">
          <h3 className="font-semibold text-card-foreground">{suite.name}</h3>
          {suite.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {suite.description}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 bg-primary rounded-full"></div>
          <span>
            {suite.testDefinitionIds.length} test
            {suite.testDefinitionIds.length !== 1 ? 's' : ''}
          </span>
        </div>
        <span>•</span>
        <span>Created {new Date(suite.createdAt).toLocaleDateString()}</span>
      </div>

      <div className="flex gap-2 flex-wrap">
        {onRun && (
          <button
            onClick={() => onRun(suite.id)}
            className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground font-medium rounded text-sm transition-colors hover:bg-primary/90"
          >
            <svg
              className="h-3 w-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6-8h12a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2z"
              />
            </svg>
            Run Suite
          </button>
        )}
        {onEdit && (
          <button
            onClick={() => onEdit(suite)}
            className="flex items-center gap-1 px-3 py-1.5 border border-border text-foreground font-medium rounded text-sm transition-colors hover:bg-accent"
          >
            <svg
              className="h-3 w-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Edit
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(suite.id)}
            className="flex items-center gap-1 px-3 py-1.5 text-destructive font-medium rounded text-sm transition-colors hover:bg-destructive/10"
          >
            <svg
              className="h-3 w-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Delete
          </button>
        )}
      </div>
    </div>
  );
};
