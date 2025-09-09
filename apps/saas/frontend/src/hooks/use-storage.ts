'use client';

import { useState, useEffect } from 'react';
import { Definition, Run, Executor, Suite } from '@tatou/core';
import { SparkTestStorageService } from '@tatou/storage-service';

// Create a singleton storage service instance
const storageService = new SparkTestStorageService();

export function useStorage() {
  const [definitions, setDefinitions] = useState<Definition[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [executors, setExecutors] = useState<Executor[]>([]);
  const [suites, setSuites] = useState<Suite[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize storage service and load data
  useEffect(() => {
    const initializeStorage = async () => {
      try {
        await storageService.initialize();
        
        // Load all data in parallel
        const [defsData, runsData, execsData, suitesData] = await Promise.all([
          storageService.getDefinitions(),
          storageService.getRuns(),
          storageService.getExecutors(),
          storageService.getTestSuites(),
        ]);

        setDefinitions(defsData);
        setRuns(runsData);
        setExecutors(execsData);
        setSuites(suitesData);
      } catch (error) {
        console.error('Failed to initialize storage:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeStorage();

    // Subscribe to run changes for real-time updates
    const unsubscribe = storageService.subscribeToRuns((payload) => {
      if (payload.eventType === 'INSERT' && payload.new) {
        setRuns(prev => [payload.new!, ...prev]);
      } else if (payload.eventType === 'UPDATE' && payload.new) {
        setRuns(prev => prev.map(run => 
          run.id === payload.new!.id ? payload.new! : run
        ));
      } else if (payload.eventType === 'DELETE' && payload.old) {
        setRuns(prev => prev.filter(run => run.id !== payload.old!.id));
      }
    });

    return unsubscribe;
  }, []);

  const createDefinition = async (definitionData: Omit<Definition, 'id' | 'createdAt'>) => {
    const newDefinition: Definition = {
      ...definitionData,
      id: `def-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    
    const saved = await storageService.saveDefinition(newDefinition);
    setDefinitions(prev => [...prev, saved]);
    return saved;
  };

  const runTest = async (definitionId: string) => {
    const definition = definitions.find(d => d.id === definitionId);
    if (!definition) throw new Error('Definition not found');

    const newRun = await storageService.createRun(definitionId, {
      name: `${definition.name} Run`,
      image: definition.image,
      commands: definition.commands,
    });

    // The run will be added to state via subscription
    return newRun;
  };

  const deleteDefinition = async (id: string) => {
    await storageService.deleteDefinition(id);
    setDefinitions(prev => prev.filter(d => d.id !== id));
  };

  const deleteRun = async (id: string) => {
    await storageService.deleteRun(id);
    setRuns(prev => prev.filter(r => r.id !== id));
  };

  const deleteExecutor = async (id: string) => {
    await storageService.deleteExecutor(id);
    setExecutors(prev => prev.filter(e => e.id !== id));
  };

  const deleteSuite = async (id: string) => {
    await storageService.deleteTestSuite(id);
    setSuites(prev => prev.filter(s => s.id !== id));
  };

  return {
    // Data
    definitions,
    runs,
    executors,
    suites,
    loading,
    
    // Actions
    createDefinition,
    runTest,
    deleteDefinition,
    deleteRun,
    deleteExecutor,
    deleteSuite,
    
    // Storage service for direct access if needed
    storage: storageService,
  };
}