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
import { Executor } from '@tatou/core';

interface CreateExecutorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateExecutor: (executorData: Omit<Executor, 'id' | 'createdAt'>) => void;
}

export function CreateExecutorDialog({
  open,
  onOpenChange,
  onCreateExecutor,
}: CreateExecutorDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !image) return;

    onCreateExecutor({
      name,
      description,
      image,
      command: [],
      supportedFileTypes: [],
      environmentVariables: [],
    });

    // Reset form
    setName('');
    setDescription('');
    setImage('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Executor</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Enter executor name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the executor environment..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Executor Type</Label>
            <Select value={image} onValueChange={setImage} required>
              <SelectTrigger>
                <SelectValue placeholder="Select executor type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="local-runner">Local Docker</SelectItem>
                <SelectItem value="k8s-runner">Kubernetes Cluster</SelectItem>
                <SelectItem value="docker-runner">Cloud Docker</SelectItem>
                <SelectItem value="github-runner">GitHub Actions</SelectItem>
                <SelectItem value="aws-runner">AWS EC2</SelectItem>
                <SelectItem value="azure-runner">Azure Container</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name || !image}>
              Create Executor
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
