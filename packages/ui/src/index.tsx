import React from 'react';
import { TestDefinition, TestRun, Executor, TestSuite } from '@sparktest/core';

// Modern UI Components
export { Button } from './components/ui/button';
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from './components/ui/card';
export { ThemeToggle } from './components/ui/theme-toggle';
export { 
  Toast, 
  ToastProvider, 
  ToastViewport, 
  ToastTitle, 
  ToastDescription, 
  ToastClose, 
  ToastAction,
  type ToastProps,
  type ToastActionElement
} from './components/ui/toast';
export { Sidebar, SidebarContent, SidebarHeader, SidebarNav, SidebarNavItem } from './components/ui/sidebar';

// Legacy components for backward compatibility (will be redesigned)
export interface TestDefinitionCardProps {
  definition: TestDefinition;
  onEdit?: (definition: TestDefinition) => void;
  onDelete?: (id: string) => void;
  onRun?: (id: string) => void;
}

export const TestDefinitionCard: React.FC<TestDefinitionCardProps> = ({
  definition,
  onEdit,
  onDelete,
  onRun,
}) => {
  return (
    <div className="border rounded-lg p-4 mb-4">
      <h3 className="font-bold">{definition.name}</h3>
      {definition.description && (
        <p className="text-gray-600 mb-2">{definition.description}</p>
      )}
      <div className="flex gap-2 mb-2">
        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
          {definition.language}
        </span>
      </div>
      <div className="flex gap-2">
        {onEdit && (
          <button
            onClick={() => onEdit(definition)}
            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
          >
            Edit
          </button>
        )}
        {onRun && (
          <button
            onClick={() => onRun(definition.id)}
            className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
          >
            Run
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(definition.id)}
            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
};

export interface TestRunCardProps {
  run: TestRun;
}

export const TestRunCard: React.FC<TestRunCardProps> = ({ run }) => {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    running: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
  };

  return (
    <div className="border rounded-lg p-4 mb-4">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold">Run {run.id.slice(-8)}</h4>
        <span className={`px-2 py-1 rounded text-sm ${statusColors[run.status]}`}>
          {run.status}
        </span>
      </div>
      <p className="text-sm text-gray-600">Created: {new Date(run.created_at).toLocaleString()}</p>
      {run.error && (
        <div className="mt-2 p-2 bg-red-50 border-l-4 border-red-500 text-red-700">
          {run.error}
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
  const statusColors = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="border rounded-lg p-4 mb-4">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold">{executor.name}</h3>
        <span className={`px-2 py-1 rounded text-sm ${statusColors[executor.status]}`}>
          {executor.status}
        </span>
      </div>
      <div className="flex gap-2 mb-2">
        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">
          {executor.type}
        </span>
      </div>
      <div className="flex gap-2">
        {onEdit && (
          <button
            onClick={() => onEdit(executor)}
            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
          >
            Edit
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(executor.id)}
            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
};

export interface TestSuiteCardProps {
  suite: TestSuite;
  onEdit?: (suite: TestSuite) => void;
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
    <div className="border rounded-lg p-4 mb-4">
      <h3 className="font-bold">{suite.name}</h3>
      {suite.description && (
        <p className="text-gray-600 mb-2">{suite.description}</p>
      )}
      <p className="text-sm text-gray-600 mb-2">
        {suite.test_definitions.length} test{suite.test_definitions.length !== 1 ? 's' : ''}
      </p>
      <div className="flex gap-2">
        {onEdit && (
          <button
            onClick={() => onEdit(suite)}
            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
          >
            Edit
          </button>
        )}
        {onRun && (
          <button
            onClick={() => onRun(suite.id)}
            className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
          >
            Run Suite
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(suite.id)}
            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
};