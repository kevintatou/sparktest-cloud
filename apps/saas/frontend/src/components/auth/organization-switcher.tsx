'use client';

import { useAuth } from '@/contexts/auth-context';
import { Building2 } from 'lucide-react';

export function OrganizationSwitcher() {
  const { user, loading } = useAuth();

  if (loading || !user) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 bg-muted/50 rounded-md">
        <Building2 className="h-4 w-4" />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  // With Supabase, organization management would typically be handled 
  // through custom tables and Row Level Security (RLS) policies
  // This is a simplified placeholder for Supabase integration
  return (
    <div className="flex items-center space-x-2 px-3 py-2 bg-muted/50 rounded-md">
      <Building2 className="h-4 w-4" />
      <span className="text-sm">Personal Workspace</span>
    </div>
  );
}