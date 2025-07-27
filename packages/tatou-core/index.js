// Core business logic and utilities for Tatou SaaS platform

// Authentication and User Management
export const AuthConfig = {
  version: "0.2.0",
  sessionTimeout: 3600000, // 1 hour
  refreshThreshold: 300000, // 5 minutes
  maxLoginAttempts: 5,
  lockoutDuration: 900000, // 15 minutes
};

export const createUser = (userData) => {
  const timestamp = new Date().toISOString();
  return {
    id: generateId(),
    ...userData,
    createdAt: timestamp,
    updatedAt: timestamp,
    status: 'active',
    role: userData.role || 'user'
  };
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// API Client Utilities
export class ApiClient {
  constructor(baseUrl, options = {}) {
    this.baseUrl = baseUrl;
    this.options = {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      ...this.options,
      ...options,
      headers: {
        ...this.options.headers,
        ...options.headers
      }
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new ApiError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          endpoint
        );
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return await response.text();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(`Network error: ${error.message}`, 0, endpoint);
    }
  }

  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

// Error Handling
export class ApiError extends Error {
  constructor(message, status, endpoint) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.endpoint = endpoint;
    this.timestamp = new Date().toISOString();
  }
}

export const ErrorTypes = {
  VALIDATION: 'VALIDATION_ERROR',
  AUTHENTICATION: 'AUTHENTICATION_ERROR',
  AUTHORIZATION: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND_ERROR',
  SERVER: 'SERVER_ERROR',
  NETWORK: 'NETWORK_ERROR'
};

// Event System
export class EventEmitter {
  constructor() {
    this.events = {};
  }

  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(cb => cb !== callback);
  }

  emit(event, data) {
    if (!this.events[event]) return;
    this.events[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }
    });
  }

  once(event, callback) {
    const unsubscribe = this.on(event, (data) => {
      unsubscribe();
      callback(data);
    });
    return unsubscribe;
  }
}

// Utility Functions
export const generateId = () => {
  // Simple ID generation (would use nanoid in real implementation)
  return Math.random().toString(36).substr(2, 9);
};

export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

export const throttle = (func, limit) => {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

export const formatDate = (date, format = 'YYYY-MM-DD') => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  switch (format) {
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    default:
      return d.toISOString().split('T')[0];
  }
};

// Configuration Management
export const Config = {
  development: {
    apiUrl: 'http://localhost:3001',
    enableLogs: true,
    enableDebug: true
  },
  production: {
    apiUrl: 'https://api.tatou.com',
    enableLogs: false,
    enableDebug: false
  },
  test: {
    apiUrl: 'http://localhost:3001',
    enableLogs: false,
    enableDebug: true
  }
};

export const getConfig = (env = 'development') => {
  return Config[env] || Config.development;
};

// Data Processing Utilities
export const sortBy = (array, key, direction = 'asc') => {
  return [...array].sort((a, b) => {
    const aVal = key.split('.').reduce((obj, prop) => obj[prop], a);
    const bVal = key.split('.').reduce((obj, prop) => obj[prop], b);
    
    if (direction === 'asc') {
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    }
    return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
  });
};

export const groupBy = (array, key) => {
  return array.reduce((groups, item) => {
    const group = key.split('.').reduce((obj, prop) => obj[prop], item);
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {});
};

export const filterBy = (array, filters) => {
  return array.filter(item => {
    return Object.entries(filters).every(([key, value]) => {
      const itemValue = key.split('.').reduce((obj, prop) => obj[prop], item);
      if (Array.isArray(value)) {
        return value.includes(itemValue);
      }
      if (typeof value === 'string' && typeof itemValue === 'string') {
        return itemValue.toLowerCase().includes(value.toLowerCase());
      }
      return itemValue === value;
    });
  });
};

// Legacy export for backward compatibility
export const SomeCore = {
  version: "0.2.0",
  status: "Active",
  init: () => console.log("Tatou Core initialized")
};