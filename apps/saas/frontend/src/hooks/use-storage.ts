'use client';

import { useState, useEffect } from 'react';
import { Definition, Run, Executor, Suite, LocalStorageService } from '@tatou/core';

export function useStorage() {
  const [definitions, setDefinitions] = useState<Definition[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [executors, setExecutors] = useState<Executor[]>([]);
  const [suites, setSuites] = useState<Suite[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize storage service
  const storageService = new LocalStorageService();

  // Load data from storage on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [definitions, runs, execs, suites] = await Promise.all([
          storageService.listTestDefinitions(),
          storageService.listTestRuns(),
          storageService.listExecutors(),
          storageService.listTestSuites(),
        ]);
        
        setDefinitions(definitions);
        setRuns(runs);
        setExecutors(execs);
        setSuites(suites);

        // If no data exists, populate with sample data
        if (definitions.length === 0) {
          await initializeSampleData();
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Initialize sample data if storage is empty
  const initializeSampleData = async () => {
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

    try {
      // Save sample data to storage
      await Promise.all([
        ...sampleDefinitions.map(def => storageService.saveTestDefinition(def)),
        ...sampleRuns.map(run => storageService.saveTestRun(run)),
        ...sampleExecutors.map(exec => storageService.saveExecutor(exec)),
        ...sampleSuites.map(suite => storageService.saveTestSuite(suite)),
      ]);

      // Update state
      setDefinitions(sampleDefinitions);
      setRuns(sampleRuns);
      setExecutors(sampleExecutors);
      setSuites(sampleSuites);
    } catch (error) {
      console.error('Failed to initialize sample data:', error);
    }
  };

  const createDefinition = async (testData: Omit<Definition, 'id' | 'createdAt'>) => {
    const newDefinition: Definition = {
      ...testData,
      id: `def-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    
    try {
      await storageService.saveTestDefinition(newDefinition);
      setDefinitions(prev => [newDefinition, ...prev]);
      return newDefinition;
    } catch (error) {
      console.error('Failed to create definition:', error);
      throw error;
    }
  };

  const updateDefinition = async (id: string, updates: Partial<Omit<Definition, 'id' | 'createdAt'>>) => {
    const definition = definitions.find(d => d.id === id);
    if (!definition) throw new Error('Definition not found');
    
    const updatedDefinition = { ...definition, ...updates };
    
    try {
      await storageService.saveTestDefinition(updatedDefinition);
      setDefinitions(prev => prev.map(def => 
        def.id === id ? updatedDefinition : def
      ));
    } catch (error) {
      console.error('Failed to update definition:', error);
      throw error;
    }
  };

  const createExecutor = async (executorData: Omit<Executor, 'id' | 'createdAt'>) => {
    const newExecutor: Executor = {
      ...executorData,
      id: `exec-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    
    try {
      await storageService.saveExecutor(newExecutor);
      setExecutors(prev => [newExecutor, ...prev]);
      return newExecutor;
    } catch (error) {
      console.error('Failed to create executor:', error);
      throw error;
    }
  };

  const updateExecutor = async (id: string, updates: Partial<Omit<Executor, 'id' | 'createdAt'>>) => {
    const executor = executors.find(e => e.id === id);
    if (!executor) throw new Error('Executor not found');
    
    const updatedExecutor = { ...executor, ...updates };
    
    try {
      await storageService.saveExecutor(updatedExecutor);
      setExecutors(prev => prev.map(exec => 
        exec.id === id ? updatedExecutor : exec
      ));
    } catch (error) {
      console.error('Failed to update executor:', error);
      throw error;
    }
  };

  const createSuite = async (suiteData: Omit<Suite, 'id' | 'createdAt'>) => {
    const newSuite: Suite = {
      ...suiteData,
      id: `suite-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    
    try {
      await storageService.saveTestSuite(newSuite);
      setSuites(prev => [newSuite, ...prev]);
      return newSuite;
    } catch (error) {
      console.error('Failed to create suite:', error);
      throw error;
    }
  };

  const updateSuite = async (id: string, updates: Partial<Omit<Suite, 'id' | 'createdAt'>>) => {
    const suite = suites.find(s => s.id === id);
    if (!suite) throw new Error('Suite not found');
    
    const updatedSuite = { ...suite, ...updates };
    
    try {
      await storageService.saveTestSuite(updatedSuite);
      setSuites(prev => prev.map(s => 
        s.id === id ? updatedSuite : s
      ));
    } catch (error) {
      console.error('Failed to update suite:', error);
      throw error;
    }
  };

  const runSuite = async (suiteId: string) => {
    const suite = suites.find(s => s.id === suiteId);
    if (!suite) throw new Error('Suite not found');

    // Run all tests in the suite
    for (const defId of suite.testDefinitionIds) {
      await runTest(defId);
    }
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

    try {
      await storageService.saveTestRun(newRun);
      setRuns(prev => [newRun, ...prev]);

      // Simulate run completion
      setTimeout(async () => {
        const completedRun = { 
          ...newRun, 
          status: 'completed' as const, 
          duration: Math.floor(Math.random() * 3000) + 500 
        };
        
        try {
          await storageService.saveTestRun(completedRun);
          setRuns(prev => prev.map(run => 
            run.id === newRun.id ? completedRun : run
          ));
        } catch (error) {
          console.error('Failed to update run status:', error);
        }
      }, 2000);

      return newRun;
    } catch (error) {
      console.error('Failed to start test run:', error);
      throw error;
    }
  };

  const deleteDefinition = async (id: string) => {
    try {
      await storageService.deleteTestDefinition(id);
      setDefinitions(prev => prev.filter(d => d.id !== id));
    } catch (error) {
      console.error('Failed to delete definition:', error);
      throw error;
    }
  };

  const deleteRun = async (id: string) => {
    // Note: Storage service doesn't have deleteTestRun method, 
    // so we'll just remove from local state for now
    setRuns(prev => prev.filter(r => r.id !== id));
  };

  const deleteExecutor = async (id: string) => {
    // Note: Storage service doesn't have deleteExecutor method,
    // so we'll just remove from local state for now
    setExecutors(prev => prev.filter(e => e.id !== id));
  };

  const deleteSuite = async (id: string) => {
    // Note: Storage service doesn't have deleteTestSuite method,
    // so we'll just remove from local state for now
    setSuites(prev => prev.filter(s => s.id !== id));
  };

  return {
    definitions,
    runs,
    executors,
    suites,
    loading,
    createDefinition,
    updateDefinition,
    createExecutor,
    updateExecutor,
    createSuite,
    updateSuite,
    runTest,
    runSuite,
    deleteDefinition,
    deleteRun,
    deleteExecutor,
    deleteSuite,
  };
}