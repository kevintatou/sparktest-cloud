'use client';

import { useState, useEffect } from 'react';
import { Definition, Run, Executor, Suite } from '@tatou/core';

export function useStorage() {
  const [definitions, setDefinitions] = useState<Definition[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [executors, setExecutors] = useState<Executor[]>([]);
  const [suites, setSuites] = useState<Suite[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize with sample data
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Sample data for testing
        const sampleDefinitions: Definition[] = [
          {
            id: 'def-1',
            name: 'Basic API Test',
            description: 'Tests the basic API endpoints for user authentication and data retrieval',
            image: 'javascript',
            commands: ['npm test'],
            createdAt: new Date().toISOString(),
          },
          {
            id: 'def-2',
            name: 'Database Connection Test',
            description: 'Tests database connectivity and basic CRUD operations',
            image: 'python',
            commands: ['python test.py'],
            createdAt: new Date().toISOString(),
          },
          {
            id: 'def-3',
            name: 'Performance Benchmark',
            description: 'Load testing for API endpoints under high traffic conditions',
            image: 'rust',
            commands: ['cargo test --release'],
            createdAt: new Date().toISOString(),
          },
        ];

        const sampleRuns: Run[] = [
          {
            id: 'run-1',
            name: 'Run run-1',
            image: 'javascript',
            command: ['npm', 'test'],
            status: 'completed',
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            definitionId: 'def-1',
            duration: 1250,
          },
          {
            id: 'run-2',
            name: 'Run run-2',
            image: 'python',
            command: ['python', 'test.py'],
            status: 'failed',
            createdAt: new Date(Date.now() - 7200000).toISOString(),
            definitionId: 'def-2',
            logs: ['Database connection failed: Connection timeout'],
          },
          {
            id: 'run-3',
            name: 'Run run-3',
            image: 'rust',
            command: ['cargo', 'test'],
            status: 'running',
            createdAt: new Date(Date.now() - 300000).toISOString(),
            definitionId: 'def-3',
          },
        ];

        const sampleExecutors: Executor[] = [
          {
            id: 'exec-1',
            name: 'Local Docker',
            image: 'local-runner',
            description: 'Local Docker executor for development testing',
            createdAt: new Date().toISOString(),
          },
          {
            id: 'exec-2',
            name: 'Kubernetes Cluster',
            image: 'k8s-runner',
            description: 'Production Kubernetes cluster executor',
            createdAt: new Date().toISOString(),
          },
          {
            id: 'exec-3',
            name: 'Cloud Runner',
            image: 'docker-runner',
            description: 'Cloud-based Docker execution environment',
            createdAt: new Date().toISOString(),
          },
        ];

        const sampleSuites: Suite[] = [
          {
            id: 'suite-1',
            name: 'API Test Suite',
            description: 'Complete API testing suite covering all endpoints',
            testDefinitionIds: ['def-1', 'def-2'],
            createdAt: new Date().toISOString(),
            executionMode: 'parallel',
          },
          {
            id: 'suite-2',
            name: 'Performance Suite',
            description: 'Performance and load testing suite',
            testDefinitionIds: ['def-3'],
            createdAt: new Date().toISOString(),
            executionMode: 'sequential',
          },
        ];

        setDefinitions(sampleDefinitions);
        setRuns(sampleRuns);
        setExecutors(sampleExecutors);
        setSuites(sampleSuites);
      } catch (error) {
        console.error('Failed to initialize data:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  const createDefinition = async (testData: Omit<Definition, 'id' | 'createdAt'>) => {
    const newDefinition: Definition = {
      ...testData,
      id: `def-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setDefinitions(prev => [newDefinition, ...prev]);
    return newDefinition;
  };

  const runTest = async (definitionId: string) => {
    const definition = definitions.find(d => d.id === definitionId);
    if (!definition) throw new Error('Definition not found');

    const newRun: Run = {
      id: `run-${Date.now()}`,
      name: `Run ${definition.name}`,
      image: definition.image,
      command: definition.commands,
      status: 'running',
      createdAt: new Date().toISOString(),
      definitionId,
    };

    setRuns(prev => [newRun, ...prev]);

    // Simulate run completion
    setTimeout(() => {
      setRuns(prev => prev.map(run => 
        run.id === newRun.id 
          ? { ...run, status: 'completed' as const, duration: Math.floor(Math.random() * 3000) + 500 }
          : run
      ));
    }, 2000);

    return newRun;
  };

  const deleteDefinition = async (id: string) => {
    setDefinitions(prev => prev.filter(d => d.id !== id));
  };

  const deleteRun = async (id: string) => {
    setRuns(prev => prev.filter(r => r.id !== id));
  };

  const deleteExecutor = async (id: string) => {
    setExecutors(prev => prev.filter(e => e.id !== id));
  };

  const deleteSuite = async (id: string) => {
    setSuites(prev => prev.filter(s => s.id !== id));
  };

  return {
    definitions,
    runs,
    executors,
    suites,
    loading,
    createDefinition,
    runTest,
    deleteDefinition,
    deleteRun,
    deleteExecutor,
    deleteSuite,
  };
}