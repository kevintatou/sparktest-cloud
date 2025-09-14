'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiService, User, Organization, SignupRequest, LoginRequest } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  signup: (data: SignupRequest) => Promise<void>;
  logout: () => Promise<void>;
  switchOrganization: (orgId: string) => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user;

  const refreshAuth = async () => {
    try {
      const token = apiService.getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const authData = await apiService.getMe();
      setUser({
        id: authData.user_id,
        email: authData.email,
        name: authData.name,
      });

      if (authData.organization_id) {
        // This is a simplified version - in a real app you'd fetch full org details
        setOrganization({
          id: authData.organization_id,
          name: 'Current Organization', // Would be fetched from API
          role: authData.role || 'Member',
        });
      } else {
        setOrganization(null);
      }
    } catch (error) {
      console.error('Failed to refresh auth:', error);
      // Token is invalid, clear it
      apiService.setToken(null);
      setUser(null);
      setOrganization(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAuth();
  }, []);

  const login = async (credentials: LoginRequest) => {
    setLoading(true);
    try {
      const response = await apiService.login(credentials);
      setUser(response.user);
      setOrganization(response.organization || null);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (data: SignupRequest) => {
    setLoading(true);
    try {
      const response = await apiService.signup(data);
      setUser(response.user);
      setOrganization(response.organization || null);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setOrganization(null);
      setLoading(false);
    }
  };

  const switchOrganization = async (orgId: string) => {
    setLoading(true);
    try {
      const response = await apiService.switchOrganization(orgId);
      setUser(response.user);
      setOrganization(response.organization || null);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    organization,
    loading,
    isAuthenticated,
    login,
    signup,
    logout,
    switchOrganization,
    refreshAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}