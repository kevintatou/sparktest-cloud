import { ApiClient } from '@tatou/core';
import { User, Project, CreateUser, CreateProject } from './schemas';

const apiClient = new ApiClient(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001');

// User API functions
export const userApi = {
  getAll: () => apiClient.get('/api/users'),
  getById: (id: string) => apiClient.get(`/api/users/${id}`),
  create: (user: CreateUser) => apiClient.post('/api/users', user),
  update: (id: string, user: Partial<User>) => apiClient.put(`/api/users/${id}`, user),
  delete: (id: string) => apiClient.delete(`/api/users/${id}`),
};

// Project API functions
export const projectApi = {
  getAll: () => apiClient.get('/api/projects'),
  getById: (id: string) => apiClient.get(`/api/projects/${id}`),
  create: (project: CreateProject) => apiClient.post('/api/projects', project),
  update: (id: string, project: Partial<Project>) => apiClient.put(`/api/projects/${id}`, project),
  delete: (id: string) => apiClient.delete(`/api/projects/${id}`),
  getByUser: (userId: string) => apiClient.get(`/api/users/${userId}/projects`),
};

// Authentication API functions
export const authApi = {
  login: (credentials: { email: string; password: string }) =>
    apiClient.post('/api/auth/login', credentials),
  register: (userData: CreateUser) => apiClient.post('/api/auth/register', userData),
  logout: () => apiClient.post('/api/auth/logout', {}),
  refresh: () => apiClient.post('/api/auth/refresh', {}),
  me: () => apiClient.get('/api/auth/me'),
};

// Dashboard API functions
export const dashboardApi = {
  getStats: () => apiClient.get('/api/dashboard/stats'),
  getActivity: () => apiClient.get('/api/dashboard/activity'),
  getNotifications: () => apiClient.get('/api/dashboard/notifications'),
};

// Settings API functions
export const settingsApi = {
  getProfile: () => apiClient.get('/api/settings/profile'),
  updateProfile: (data: User) => apiClient.put('/api/settings/profile', data),
  getPreferences: () => apiClient.get('/api/settings/preferences'),
  updatePreferences: (data: Record<string, unknown>) => apiClient.put('/api/settings/preferences', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiClient.put('/api/settings/password', data),
};