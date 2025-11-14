/**
 * React Query Configuration
 * 
 * Provides caching, background refetching, and optimistic updates
 * for all API calls across the application.
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes
      staleTime: 5 * 60 * 1000,
      
      // Keep unused data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      
      // Retry failed requests 2 times
      retry: 2,
      
      // Retry with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Refetch on window focus for fresh data
      refetchOnWindowFocus: true,
      
      // Don't refetch on mount if data is fresh
      refetchOnMount: false,
      
      // Refetch in background when data becomes stale
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
    },
  },
});

// Query keys factory for type-safe query keys
export const queryKeys = {
  // Discovery queries
  discovery: {
    all: ['discovery'] as const,
    online: (filters?: Record<string, any>) => ['discovery', 'online', filters] as const,
    nearby: (filters?: Record<string, any>) => ['discovery', 'nearby', filters] as const,
  },
  
  // User queries
  user: {
    all: ['user'] as const,
    profile: (userId: string) => ['user', 'profile', userId] as const,
    me: () => ['user', 'me'] as const,
  },
  
  // Match queries
  matches: {
    all: ['matches'] as const,
    list: () => ['matches', 'list'] as const,
    detail: (matchId: string) => ['matches', 'detail', matchId] as const,
  },
  
  // Project queries
  projects: {
    all: ['projects'] as const,
    list: (filters?: Record<string, any>) => ['projects', 'list', filters] as const,
    detail: (projectId: string) => ['projects', 'detail', projectId] as const,
    myProjects: () => ['projects', 'my'] as const,
  },
  
  // Event queries
  events: {
    all: ['events'] as const,
    list: (filters?: Record<string, any>) => ['events', 'list', filters] as const,
    detail: (eventId: string) => ['events', 'detail', eventId] as const,
    myEvents: () => ['events', 'my'] as const,
  },
  
  // Chat queries
  chat: {
    all: ['chat'] as const,
    conversations: () => ['chat', 'conversations'] as const,
    messages: (conversationId: string) => ['chat', 'messages', conversationId] as const,
  },
} as const;
