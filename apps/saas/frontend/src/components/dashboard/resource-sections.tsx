'use client';

import { useState } from 'react';
import { Executor, Suite } from '@tatou/core';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { NavigationKey } from './navigation';
import { Definition } from '@tatou/core';
import { Plus, Trash2 } from 'lucide-react';

type Props = {
  activeTab: NavigationKey;
  definitions: Definition[];
  executors: Executor[];
  suites: Suite[];
  createExecutor: (data: { name: string; executorType: string; image?: string; description?: string }) => Promise<Executor>;
  deleteExecutor: (id: string) => Promise<void>;
  createSuite: (data: { name: string; description?: string; executionMode: Suite['executionMode']; testDefinitionIds: string[] }) => Promise<Suite>;
  deleteSuite: (id: string) => Promise<void>;
};

export function ResourceSections({ activeTab, definitions, executors, suites, createExecutor, deleteExecutor, createSuite, deleteSuite }: Props) {
  if (activeTab === 'executors') {
    return <ExecutorSection executors={executors} createExecutor={createExecutor} deleteExecutor={deleteExecutor} />;
  }
  return <SuiteSection definitions={definitions} suites={suites} createSuite={createSuite} deleteSuite={deleteSuite} />;
}

function ExecutorSection({ executors, createExecutor, deleteExecutor }: Pick<Props, 'executors' | 'createExecutor' | 'deleteExecutor'>) {
  const [name, setName] = useState('');
  const [type, setType] = useState('native-agent');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await createExecutor({ name: name.trim(), executorType: type, description: description.trim() });
      setName('');
      setDescription('');
    } finally {
      setSaving(false);
    }
  };

  return <ResourceLayout title="Executors" description="Manage the environments that can execute your tests.">
    <Card><CardContent className="pt-6"><form onSubmit={submit} className="grid gap-4 md:grid-cols-4 md:items-end">
      <div className="space-y-2"><Label htmlFor="executor-name">Name</Label><Input id="executor-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Local agent" /></div>
      <div className="space-y-2"><Label htmlFor="executor-type">Type</Label><Input id="executor-type" value={type} onChange={(event) => setType(event.target.value)} placeholder="native-agent" /></div>
      <div className="space-y-2"><Label htmlFor="executor-description">Description</Label><Input id="executor-description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Optional" /></div>
      <Button type="submit" disabled={saving || !name.trim()}><Plus className="mr-2 h-4 w-4" />Add executor</Button>
    </form></CardContent></Card>
    <div className="grid gap-4 md:grid-cols-2">{executors.map((executor) => <Card key={executor.id}><CardContent className="flex items-start justify-between gap-4 pt-6"><div><h3 className="font-semibold">{executor.name}</h3><p className="text-sm text-muted-foreground">{executor.image}</p>{executor.description && <p className="mt-2 text-sm text-muted-foreground">{executor.description}</p>}</div><Button variant="ghost" size="icon" aria-label={`Delete ${executor.name}`} onClick={() => deleteExecutor(executor.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></CardContent></Card>)}</div>
    {executors.length === 0 && <Empty text="No executors yet. Add the environment that should run your tests." />}
  </ResourceLayout>;
}

function SuiteSection({ definitions, suites, createSuite, deleteSuite }: Pick<Props, 'definitions' | 'suites' | 'createSuite' | 'deleteSuite'>) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState<Suite['executionMode']>('sequential');
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || selected.length === 0) return;
    setSaving(true);
    try { await createSuite({ name: name.trim(), description: description.trim(), executionMode: mode, testDefinitionIds: selected }); setName(''); setDescription(''); setSelected([]); } finally { setSaving(false); }
  };
  return <ResourceLayout title="Test Suites" description="Group definitions into sequential or parallel runs.">
    <Card className="shadow-none"><CardContent className="p-5"><form onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-[1fr_1.4fr_1fr]"><div className="space-y-2"><Label htmlFor="suite-name">Name</Label><Input id="suite-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Smoke tests" /></div><div className="space-y-2"><Label htmlFor="suite-description">Description</Label><Input id="suite-description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Optional" /></div><div className="space-y-2"><Label htmlFor="suite-mode">Execution mode</Label><select id="suite-mode" className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={mode} onChange={(event) => setMode(event.target.value as Suite['executionMode'])}><option value="sequential">Sequential</option><option value="parallel">Parallel</option></select></div></div>
      <div className="space-y-2"><div className="flex items-center justify-between"><Label>Definitions</Label><span className="text-xs text-muted-foreground">{selected.length} selected</span></div>{definitions.length === 0 ? <p className="rounded-md bg-muted/40 px-3 py-2 text-sm text-muted-foreground">Create a definition first, then add it to this suite.</p> : <div className="grid gap-2 rounded-md bg-muted/30 p-3 md:grid-cols-2">{definitions.map((definition) => <label key={definition.id} className="flex items-center gap-2 rounded-md border border-border bg-background p-3 text-sm"><Checkbox checked={selected.includes(definition.id)} onCheckedChange={(checked) => setSelected((current) => checked ? [...current, definition.id] : current.filter((id) => id !== definition.id))} />{definition.name}</label>)}</div>}</div>
      <Button type="submit" disabled={saving || !name.trim() || selected.length === 0}><Plus className="mr-2 h-4 w-4" />Create suite</Button>
    </form></CardContent></Card>
    <div className="grid gap-4 md:grid-cols-2">{suites.map((suite) => <Card key={suite.id}><CardContent className="flex items-start justify-between gap-4 pt-6"><div><h3 className="font-semibold">{suite.name}</h3><p className="text-sm text-muted-foreground">{suite.executionMode} · {suite.testDefinitionIds.length} definitions</p></div><Button variant="ghost" size="icon" aria-label={`Delete ${suite.name}`} onClick={() => deleteSuite(suite.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></CardContent></Card>)}</div>
    {suites.length === 0 && <Empty text="No suites yet. Group definitions to run them together." />}
  </ResourceLayout>;
}

function ResourceLayout({ title, description, children }: { title: string; description: string; children: React.ReactNode }) { return <div className="space-y-6"><div><h2 className="text-2xl font-bold tracking-tight">{title}</h2><p className="text-muted-foreground">{description}</p></div>{children}</div>; }
function Empty({ text }: { text: string }) { return <p className="rounded-lg border border-dashed border-border px-4 py-5 text-center text-sm text-muted-foreground">{text}</p>; }
