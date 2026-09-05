'use client';

import React, { useState } from 'react';
import { Definition, Executor } from '@tatou/core';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface CreateTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTest: (test: Omit<Definition, 'id' | 'createdAt'>) => Promise<void>;
  executors?: Executor[];
  initialValues?: Partial<Definition>;
}

export function CreateTestDialog({
  open,
  onOpenChange,
  onCreateTest,
  initialValues,
  executors = [],
}: CreateTestDialogProps) {
  const [formData, setFormData] = useState({
    name: initialValues?.name || '',
    description: initialValues?.description || '',
    commands: initialValues?.commands?.[0] || 'echo "SparkTest connected"',
    image: initialValues?.image || 'alpine:3.20',
    executorId: initialValues?.executorId || '',
  });

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Definition name is required';
    }

    if (!formData.commands.trim()) {
      newErrors.commands = 'Commands are required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (saving || !validateForm()) {
      return;
    }

    setSaving(true);
    try {
      await onCreateTest({
        name: formData.name,
        description: formData.description,
        commands: [formData.commands],
        image: formData.image,
        executorId: formData.executorId || undefined,
      });

      // Reset form
      setFormData({
        name: '',
        description: '',
        commands: 'echo "SparkTest connected"',
        image: 'alpine:3.20',
        executorId: '',
      });

      setErrors({});
      onOpenChange(false);
    } catch {
      setErrors({
        submit:
          'Could not save the definition. Your input is preserved; please retry.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      description: '',
      commands: 'echo "SparkTest connected"',
      image: 'alpine:3.20',
      executorId: '',
    });

    setErrors({});
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!saving) onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Definition</DialogTitle>
          <DialogDescription>
            Commands run on your agent machine in its working directory using
            the tools installed there. Beta runs have a 10-minute execution
            limit.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Definition Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter definition name..."
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Brief description of what this test does..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">
                Container image (Docker / Kubernetes only)
              </Label>
              <Input
                id="image"
                value={formData.image}
                onChange={(e) =>
                  setFormData({ ...formData, image: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="commands">Shell command *</Label>
              <Textarea
                id="commands"
                value={formData.commands}
                onChange={(e) =>
                  setFormData({ ...formData, commands: e.target.value })
                }
                placeholder={'echo "SparkTest connected"'}
                className={cn(
                  'min-h-[200px] font-mono text-sm',
                  errors.commands ? 'border-destructive' : ''
                )}
              />
              {errors.commands && (
                <p className="text-sm text-destructive">{errors.commands}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="executor">Executor</Label>
              <Select
                value={formData.executorId || 'none'}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    executorId: value === 'none' ? '' : value,
                  })
                }
              >
                <SelectTrigger id="executor">
                  <SelectValue placeholder="Use definition defaults" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Use definition defaults</SelectItem>
                  {executors.map((executor) => (
                    <SelectItem key={executor.id} value={executor.id}>
                      {executor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {executors.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Create an executor first to select one here.
                </p>
              )}
            </div>
          </div>

          {errors.submit && (
            <p role="alert" className="text-destructive">
              {errors.submit}
            </p>
          )}
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Create Test'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
