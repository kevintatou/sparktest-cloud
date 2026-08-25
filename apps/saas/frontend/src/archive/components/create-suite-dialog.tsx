'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Suite, Definition } from '@tatou/core';

interface CreateSuiteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateSuite: (suiteData: Omit<Suite, 'id' | 'createdAt'>) => void;
  availableDefinitions: Definition[];
}

export function CreateSuiteDialog({
  open,
  onOpenChange,
  onCreateSuite,
  availableDefinitions,
}: CreateSuiteDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [executionMode, setExecutionMode] = useState<'parallel' | 'sequential'>('parallel');
  const [selectedDefinitions, setSelectedDefinitions] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || selectedDefinitions.length === 0) return;

    onCreateSuite({
      name,
      description,
      executionMode,
      testDefinitionIds: selectedDefinitions,
    });

    // Reset form
    setName('');
    setDescription('');
    setExecutionMode('parallel');
    setSelectedDefinitions([]);
    onOpenChange(false);
  };

  const toggleDefinition = (definitionId: string) => {
    setSelectedDefinitions(prev =>
      prev.includes(definitionId)
        ? prev.filter(id => id !== definitionId)
        : [...prev, definitionId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Suite</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Enter suite name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the test suite..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="executionMode">Execution Mode</Label>
            <Select value={executionMode} onValueChange={(value: 'parallel' | 'sequential') => setExecutionMode(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select execution mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="parallel">Parallel - Run all tests simultaneously</SelectItem>
                <SelectItem value="sequential">Sequential - Run tests one after another</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Select Definitions ({selectedDefinitions.length} selected)</Label>
            <div className="border rounded-md p-4 space-y-3 max-h-48 overflow-y-auto">
              {availableDefinitions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No definitions available. Create some definitions first.</p>
              ) : (
                availableDefinitions.map((def) => (
                  <div key={def.id} className="flex items-start space-x-3">
                    <Checkbox
                      id={def.id}
                      checked={selectedDefinitions.includes(def.id)}
                      onCheckedChange={() => toggleDefinition(def.id)}
                    />
                    <div className="flex-1">
                      <Label htmlFor={def.id} className="text-sm font-medium cursor-pointer">
                        {def.name}
                      </Label>
                      {def.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {def.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name || selectedDefinitions.length === 0}>
              Create Suite
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}