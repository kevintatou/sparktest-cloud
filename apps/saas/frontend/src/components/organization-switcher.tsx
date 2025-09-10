'use client';

import { useState } from 'react';
import { Check, ChevronDown, Building } from 'lucide-react';
import { useOrganization } from '@/hooks/use-organization';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

export function OrganizationSwitcher() {
  const { currentOrg, organizations, switchOrg, loading } = useOrganization();

  if (loading || !currentOrg) {
    return (
      <div className="flex items-center space-x-2 bg-muted/50 px-3 py-1.5 rounded-md border">
        <Building className="h-4 w-4 animate-pulse" />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center space-x-2 bg-muted/50 px-3 py-1.5 rounded-md border hover:bg-muted">
          <Building className="h-4 w-4" />
          <span className="text-sm font-medium">{currentOrg.name}</span>
          <Badge variant="secondary" className="text-xs px-1">
            {currentOrg.slug}
          </Badge>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => switchOrg(org)}
            className="flex items-center justify-between"
          >
            <div className="flex items-center space-x-2">
              <Building className="h-4 w-4" />
              <div>
                <div className="font-medium">{org.name}</div>
                <div className="text-xs text-muted-foreground">{org.slug}</div>
              </div>
            </div>
            {currentOrg.id === org.id && (
              <Check className="h-4 w-4" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}