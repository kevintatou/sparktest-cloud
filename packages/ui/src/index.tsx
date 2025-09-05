import React from 'react';
import { TestDefinition, TestRun, Executor, TestSuite } from '@tatou/core';

// Premium UI components for SparkTest
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
  const getLanguageClasses = (language: string) => {
    const classes = {
      javascript: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
      python: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-800',
      rust: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400 border-orange-200 dark:border-orange-800',
      default: 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-800'
    };
    return classes[language as keyof typeof classes] || classes.default;
  };

  return (
    <div className="group bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 p-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="space-y-2 flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-1">
            {definition.name}
          </h3>
          {definition.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
              {definition.description}
            </p>
          )}
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-sm shrink-0 ${getLanguageClasses(definition.language)}`}>
          {definition.language}
        </span>
      </div>
      
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        Updated {new Date(definition.updated_at).toLocaleDateString()}
      </div>

      <div className="flex gap-2 flex-wrap">
        {onRun && (
          <button
            onClick={() => onRun(definition.id)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg text-sm flex-1 sm:flex-none justify-center"
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6-8h12a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2z" />
            </svg>
            Run
          </button>
        )}
        {onEdit && (
          <button
            onClick={() => onEdit(definition)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-all duration-200 hover:border-purple-300 dark:hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-sm"
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(definition.id)}
            className="flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 font-medium rounded-lg transition-all duration-200 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm"
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
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
  const getStatusConfig = (status: string) => {
    const configs = {
      pending: {
        classes: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white',
        icon: (
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      },
      running: {
        classes: 'bg-gradient-to-r from-purple-600 to-blue-600 text-white',
        icon: (
          <svg className="h-3 w-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        )
      },
      completed: {
        classes: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white',
        icon: (
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      },
      failed: {
        classes: 'bg-gradient-to-r from-red-500 to-pink-500 text-white',
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
    <div className="group bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          Run {run.id.slice(-8)}
        </h4>
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${statusConfig.classes}`}>
          {statusConfig.icon}
          <span className="capitalize">{run.status}</span>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="text-sm text-gray-500 dark:text-gray-400">
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
            <pre className="text-xs text-green-700 dark:text-green-300 mt-1 overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(run.result, null, 2)}
            </pre>
          </div>
        )}
      </div>
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
  const getTypeClasses = (type: string) => {
    const classes = {
      local: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-800',
      kubernetes: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 border-purple-200 dark:border-purple-800',
      docker: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800',
      default: 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-800'
    };
    return classes[type as keyof typeof classes] || classes.default;
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      active: {
        classes: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white',
        indicator: 'bg-current animate-pulse'
      },
      inactive: {
        classes: 'bg-gradient-to-r from-gray-500 to-gray-600 text-white',
        indicator: 'bg-current opacity-50'
      }
    };
    return configs[status as keyof typeof configs] || configs.inactive;
  };

  const statusConfig = getStatusConfig(executor.status);

  return (
    <div className="group bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-3 flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
            {executor.name}
          </h3>
          <div className="flex gap-2 flex-wrap">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-sm ${getTypeClasses(executor.type)}`}>
              {executor.type}
            </span>
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${statusConfig.classes}`}>
              <div className={`h-2 w-2 rounded-full ${statusConfig.indicator}`}></div>
              <span className="capitalize">{executor.status}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Updated {new Date(executor.updated_at).toLocaleDateString()}
      </div>

      <div className="flex gap-2">
        {onEdit && (
          <button
            onClick={() => onEdit(executor)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-all duration-200 hover:border-purple-300 dark:hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-sm"
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(executor.id)}
            className="flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 font-medium rounded-lg transition-all duration-200 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm"
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
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
    <div className="group bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-2 flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
            {suite.name}
          </h3>
          {suite.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
              {suite.description}
            </p>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 bg-purple-500 rounded-full"></div>
          <span>{suite.test_definitions.length} test{suite.test_definitions.length !== 1 ? 's' : ''}</span>
        </div>
        <span>•</span>
        <span>Updated {new Date(suite.updated_at).toLocaleDateString()}</span>
      </div>

      <div className="flex gap-2 flex-wrap">
        {onRun && (
          <button
            onClick={() => onRun(suite.id)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg text-sm flex-1 sm:flex-none justify-center"
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6-8h12a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2z" />
            </svg>
            Run Suite
          </button>
        )}
        {onEdit && (
          <button
            onClick={() => onEdit(suite)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-all duration-200 hover:border-purple-300 dark:hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-sm"
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(suite.id)}
            className="flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 font-medium rounded-lg transition-all duration-200 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm"
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
        )}
      </div>
    </div>
  );
};