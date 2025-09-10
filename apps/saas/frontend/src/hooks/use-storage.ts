'use client';

import { useState, useEffect } from 'react';
import { Definition, Run, Executor, Suite } from '@tatou/core';
import { useOrganization } from '@/hooks/use-organization';

export function useStorage() {
  const { currentOrg } = useOrganization();
  const [definitions, setDefinitions] = useState<Definition[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [executors, setExecutors] = useState<Executor[]>([]);
  const [suites, setSuites] = useState<Suite[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data when org changes
  useEffect(() => {
    if (!currentOrg) {
      setLoading(true);
      return;
    }

    const loadOrgData = async () => {
      setLoading(true);
      try {
        const baseUrl = `http://localhost:3001/api/orgs/${currentOrg.slug}`;
        
        // Load all org-specific data
        const [defsRes, runsRes, execsRes, suitesRes] = await Promise.all([
          fetch(`${baseUrl}/test-definitions`),
          fetch(`${baseUrl}/test-runs`),
          fetch(`${baseUrl}/executors`),
          fetch(`${baseUrl}/test-suites`),
        ]);

        if (defsRes.ok) {
          const defs = await defsRes.json();
          // Transform backend data to frontend format
          setDefinitions(defs.map((def: any) => ({
            id: def.id,
            name: def.name,
            description: def.description || '',
            image: def.language,
            commands: [def.code],
            createdAt: def.created_at,
          })));
        }

        if (runsRes.ok) {
          const runs = await runsRes.json();
          setRuns(runs.map((run: any) => ({
            id: run.id,
            name: `Run ${run.id.slice(-8)}`,
            image: 'test-runner',
            command: ['run'],
            status: run.status,
            createdAt: run.created_at,
            definitionId: run.definition_id,
          })));
        }

        if (execsRes.ok) {
          const execs = await execsRes.json();
          setExecutors(execs.map((exec: any) => ({
            id: exec.id,
            name: exec.name,
            image: exec.executor_type,
            description: `${exec.executor_type} executor`,
            createdAt: exec.created_at,
          })));
        }

        if (suitesRes.ok) {
          const suites = await suitesRes.json();
          setSuites(suites.map((suite: any) => ({
            id: suite.id,
            name: suite.name,
            description: suite.description || '',
            testDefinitionIds: suite.test_definitions || [],
            createdAt: suite.created_at,
            executionMode: 'parallel' as const,
          })));
        }
      } catch (error) {
        console.error('Failed to load org data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOrgData();
  }, [currentOrg]);

  const createDefinition = async (testData: Omit<Definition, 'id' | 'createdAt'>) => {
    if (!currentOrg) throw new Error('No org selected');
    
    try {
      const response = await fetch(`http://localhost:3001/api/orgs/${currentOrg.slug}/test-definitions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: testData.name,
          description: testData.description,
          code: testData.commands.join('\n'),
          language: testData.image,
          is_public: false,
        }),
      });
      
      if (response.ok) {
        const def = await response.json();
        const newDefinition: Definition = {
          id: def.id,
          name: def.name,
          description: def.description || '',
          image: def.language,
          commands: [def.code],
          createdAt: def.created_at,
        };
        setDefinitions(prev => [newDefinition, ...prev]);
        return newDefinition;
      }
    } catch (error) {
      console.error('Failed to create definition:', error);
    }
    throw new Error('Failed to create definition');
  };

  const updateDefinition = async (id: string, updates: Partial<Omit<Definition, 'id' | 'createdAt'>>) => {
    setDefinitions(prev => prev.map(def => 
      def.id === id 
        ? { ...def, ...updates }
        : def
    ));
  };

  const createExecutor = async (executorData: Omit<Executor, 'id' | 'createdAt'>) => {
    if (!currentOrg) throw new Error('No org selected');
    
    try {
      const response = await fetch(`http://localhost:3001/api/orgs/${currentOrg.slug}/executors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: executorData.name,
          executor_type: executorData.image,
          config: {},
          status: 'active',
        }),
      });
      
      if (response.ok) {
        const exec = await response.json();
        const newExecutor: Executor = {
          id: exec.id,
          name: exec.name,
          image: exec.executor_type,
          description: executorData.description,
          createdAt: exec.created_at,
        };
        setExecutors(prev => [newExecutor, ...prev]);
        return newExecutor;
      }
    } catch (error) {
      console.error('Failed to create executor:', error);
    }
    throw new Error('Failed to create executor');
  };

  const updateExecutor = async (id: string, updates: Partial<Omit<Executor, 'id' | 'createdAt'>>) => {
    setExecutors(prev => prev.map(exec => 
      exec.id === id 
        ? { ...exec, ...updates }
        : exec
    ));
  };

  const createSuite = async (suiteData: Omit<Suite, 'id' | 'createdAt'>) => {
    if (!currentOrg) throw new Error('No org selected');
    
    try {
      const response = await fetch(`http://localhost:3001/api/orgs/${currentOrg.slug}/test-suites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: suiteData.name,
          description: suiteData.description,
          test_definitions: suiteData.testDefinitionIds,
        }),
      });
      
      if (response.ok) {
        const suite = await response.json();
        const newSuite: Suite = {
          id: suite.id,
          name: suite.name,
          description: suite.description || '',
          testDefinitionIds: suite.test_definitions || [],
          createdAt: suite.created_at,
          executionMode: 'parallel',
        };
        setSuites(prev => [newSuite, ...prev]);
        return newSuite;
      }
    } catch (error) {
      console.error('Failed to create suite:', error);
    }
    throw new Error('Failed to create suite');
  };

  const updateSuite = async (id: string, updates: Partial<Omit<Suite, 'id' | 'createdAt'>>) => {
    setSuites(prev => prev.map(suite => 
      suite.id === id 
        ? { ...suite, ...updates }
        : suite
    ));
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
    if (!currentOrg) throw new Error('No org selected');
    
    const definition = definitions.find(d => d.id === definitionId);
    if (!definition) throw new Error('Definition not found');

    try {
      const response = await fetch(`http://localhost:3001/api/orgs/${currentOrg.slug}/test-runs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          definition_id: definitionId,
          status: 'queued',
        }),
      });
      
      if (response.ok) {
        const run = await response.json();
        const newRun: Run = {
          id: run.id,
          name: `Run ${run.id.slice(-8)}`,
          image: 'test-runner',
          command: ['run'],
          status: run.status,
          createdAt: run.created_at,
          definitionId: run.definition_id,
        };
        setRuns(prev => [newRun, ...prev]);
        return newRun;
      }
    } catch (error) {
      console.error('Failed to run test:', error);
    }
    throw new Error('Failed to run test');
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