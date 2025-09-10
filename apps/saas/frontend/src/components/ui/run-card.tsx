import React from 'react';
import { Run } from '@tatou/core';

export interface TestRunCardProps {
  run: Run;
  onClick?: (id: string) => void;
  onDelete?: (id: string) => void;
  onRetry?: (id: string) => void;
}

export const TestRunCard: React.FC<TestRunCardProps> = ({ run, onClick, onDelete, onRetry }) => {
  const getStatusConfig = (status: string) => {
    const configs = {
      pending: {
        classes: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
        icon: (
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      },
      running: {
        classes: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
        icon: (
          <svg className="h-3 w-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        )
      },
      completed: {
        classes: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
        icon: (
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      },
      failed: {
        classes: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
        icon: (
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      }
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
        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${statusConfig.classes}`}>
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
            <p className="text-sm text-green-800 dark:text-green-200 font-medium">Completed</p>
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
              onClick={(e) => {
                e.stopPropagation();
                onRetry(run.id);
              }}
              className="flex items-center gap-1 px-3 py-1.5 border border-border text-foreground font-medium rounded text-sm transition-colors hover:bg-accent"
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Retry
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(run.id);
              }}
              className="flex items-center gap-1 px-3 py-1.5 text-destructive font-medium rounded text-sm transition-colors hover:bg-destructive/10"
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
};