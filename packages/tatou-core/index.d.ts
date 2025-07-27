// Type definitions for Tatou Core package

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'guest';
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

export interface AuthConfig {
  version: string;
  sessionTimeout: number;
  refreshThreshold: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
}

export interface ApiClientOptions {
  timeout?: number;
  headers?: Record<string, string>;
  [key: string]: any;
}

export declare class ApiClient {
  constructor(baseUrl: string, options?: ApiClientOptions);
  request(endpoint: string, options?: RequestInit): Promise<any>;
  get(endpoint: string, options?: RequestInit): Promise<any>;
  post(endpoint: string, data: any, options?: RequestInit): Promise<any>;
  put(endpoint: string, data: any, options?: RequestInit): Promise<any>;
  delete(endpoint: string, options?: RequestInit): Promise<any>;
}

export declare class ApiError extends Error {
  status: number;
  endpoint: string;
  timestamp: string;
  constructor(message: string, status: number, endpoint: string);
}

export interface ErrorTypes {
  VALIDATION: 'VALIDATION_ERROR';
  AUTHENTICATION: 'AUTHENTICATION_ERROR';
  AUTHORIZATION: 'AUTHORIZATION_ERROR';
  NOT_FOUND: 'NOT_FOUND_ERROR';
  SERVER: 'SERVER_ERROR';
  NETWORK: 'NETWORK_ERROR';
}

export declare class EventEmitter {
  on(event: string, callback: (data: any) => void): () => void;
  off(event: string, callback: (data: any) => void): void;
  emit(event: string, data?: any): void;
  once(event: string, callback: (data: any) => void): () => void;
}

export interface Config {
  development: {
    apiUrl: string;
    enableLogs: boolean;
    enableDebug: boolean;
  };
  production: {
    apiUrl: string;
    enableLogs: boolean;
    enableDebug: boolean;
  };
  test: {
    apiUrl: string;
    enableLogs: boolean;
    enableDebug: boolean;
  };
}

// Function declarations
export declare const AuthConfig: AuthConfig;
export declare const createUser: (userData: Partial<User>) => User;
export declare const validateEmail: (email: string) => boolean;
export declare const ErrorTypes: ErrorTypes;
export declare const generateId: () => string;
export declare const debounce: <T extends (...args: any[]) => any>(func: T, delay: number) => (...args: Parameters<T>) => void;
export declare const throttle: <T extends (...args: any[]) => any>(func: T, limit: number) => (...args: Parameters<T>) => void;
export declare const formatDate: (date: string | Date, format?: string) => string;
export declare const Config: Config;
export declare const getConfig: (env?: string) => Config[keyof Config];
export declare const sortBy: <T>(array: T[], key: string, direction?: 'asc' | 'desc') => T[];
export declare const groupBy: <T>(array: T[], key: string) => Record<string, T[]>;
export declare const filterBy: <T>(array: T[], filters: Record<string, any>) => T[];

// Legacy compatibility
export declare const SomeCore: {
  version: string;
  status: string;
  init: () => void;
};