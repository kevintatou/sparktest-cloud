// Configuration types
export interface AppConfig {
  backend_url: string;
  storage_mode: 'local' | 'api';
  debug?: boolean;
}

export const defaultConfig: AppConfig = {
  backend_url: 'http://localhost:3001',
  storage_mode: 'api',
  debug: false,
};
