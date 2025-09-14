'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { apiService, Organization } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Check, ChevronDown, Building2, Plus } from 'lucide-react';

export function OrganizationSwitcher() {
  const { organization, switchOrganization, loading: authLoading } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      const orgs = await apiService.getUserOrganizations();
      setOrganizations(orgs);
    } catch (error) {
      console.error('Failed to load organizations:', error);
    }
  };

  const handleSwitchOrganization = async (orgId: string) => {
    if (orgId === organization?.id) return;

    setLoading(true);
    try {
      await switchOrganization(orgId);
      toast({
        title: 'Organization switched',
        description: 'You have successfully switched organizations.',
      });
    } catch (error) {
      toast({
        title: 'Failed to switch organization',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !organization) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 bg-muted/50 rounded-md">
        <Building2 className="h-4 w-4" />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="justify-between min-w-[200px]"
          disabled={loading}
        >
          <div className="flex items-center space-x-2">
            <Building2 className="h-4 w-4" />
            <span className="truncate">{organization.name}</span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[200px]">
        <DropdownMenuLabel>Organizations</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => handleSwitchOrganization(org.id)}
            className="cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-2">
                <Building2 className="h-4 w-4" />
                <div className="flex flex-col">
                  <span className="truncate">{org.name}</span>
                  <span className="text-xs text-muted-foreground">{org.role}</span>
                </div>
              </div>
              {org.id === organization?.id && (
                <Check className="h-4 w-4" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer">
          <Plus className="h-4 w-4 mr-2" />
          Create Organization
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}