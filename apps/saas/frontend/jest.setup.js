import '@testing-library/jest-dom'
import React from 'react'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
    }
  },
}))

// Mock environment variables
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3001'

// Mock UI components globally
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }) => 
    React.createElement('button', { onClick, disabled, ...props }, children)
}))

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }) => 
    React.createElement('div', { 'data-testid': 'card', ...props }, children),
  CardContent: ({ children, ...props }) => 
    React.createElement('div', { 'data-testid': 'card-content', ...props }, children),
  CardHeader: ({ children, ...props }) => 
    React.createElement('div', { 'data-testid': 'card-header', ...props }, children),
  CardTitle: ({ children, ...props }) => 
    React.createElement('h3', { 'data-testid': 'card-title', ...props }, children),
}))

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }) => 
    React.createElement('span', { 'data-testid': 'badge', ...props }, children)
}))

jest.mock('lucide-react', () => ({
  Check: () => React.createElement('span', { 'data-testid': 'check-icon' }, '✓'),
  Loader2: () => React.createElement('span', { 'data-testid': 'loader-icon' }, 'Loading...'),
}))