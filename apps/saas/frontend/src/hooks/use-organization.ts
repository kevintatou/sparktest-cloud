'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { Organization } from '@tatou/core';

export interface OrganizationContextType {
  currentOrg: Organization | null;
  organizations: Organization[];
  switchOrg: (org: Organization) => void;
  loading: boolean;
}

const OrganizationContext = createContext<OrganizationContextType | null>(null);

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
}

export function useOrganizationLogic() {
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/organizations');
        if (response.ok) {
          const orgs = await response.json();
          setOrganizations(orgs);
          
          // Set default org (first one or from localStorage)
          const savedOrgSlug = localStorage.getItem('currentOrgSlug');
          let defaultOrg = orgs[0];
          
          if (savedOrgSlug) {
            const savedOrg = orgs.find((org: Organization) => org.slug === savedOrgSlug);
            if (savedOrg) {
              defaultOrg = savedOrg;
            }
          }
          
          if (defaultOrg) {
            setCurrentOrg(defaultOrg);
          }
        }
      } catch (error) {
        console.error('Failed to fetch organizations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizations();
  }, []);

  const switchOrg = (org: Organization) => {
    setCurrentOrg(org);
    localStorage.setItem('currentOrgSlug', org.slug);
  };

  return {
    currentOrg,
    organizations,
    switchOrg,
    loading,
  };
}

export { OrganizationContext };