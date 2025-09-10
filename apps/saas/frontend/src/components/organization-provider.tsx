'use client';

import React from 'react';
import { OrganizationContext, useOrganizationLogic } from '@/hooks/use-organization';

interface OrganizationProviderProps {
  children: React.ReactNode;
}

export function OrganizationProvider({ children }: OrganizationProviderProps) {
  const organizationLogic = useOrganizationLogic();

  return (
    <OrganizationContext.Provider value={organizationLogic}>
      {children}
    </OrganizationContext.Provider>
  );
}