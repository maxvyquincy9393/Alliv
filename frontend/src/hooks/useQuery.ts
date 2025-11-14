/**
 * Custom React Query Hooks for API Calls
 * 
 * Provides type-safe, cached API calls with automatic
 * refetching, error handling, and optimistic updates.
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryClient';
import { discoveryAPI, matchAPI } from '../services/api';
import type { User } from '../types/user';
import { config } from '../config';

// ==================== Discovery Hooks ====================

interface DiscoveryFilters {
  field?: string;
  skills?: string;
  interests?: string;
  vibe?: string;
  limit?: number;
}

interface NearbyFilters extends DiscoveryFilters {
  lat?: number;
  lon?: number;
  radiusKm?: number;
}

interface DiscoveryResponse {
  users: User[];
  nextCursor?: string;
  hasMore: boolean;
  total?: number;
}

/**
 * Hook for discovering online users with infinite scroll
 */
export function useDiscoverOnline(filters?: DiscoveryFilters) {
  return useInfiniteQuery({
    queryKey: queryKeys.discovery.online(filters),
    queryFn: async ({ pageParam }: { pageParam: string | undefined }) => {
      const response = await discoveryAPI.discoverOnline({
        ...filters,
        cursor: pageParam,
      });
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      return response.data as DiscoveryResponse;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : undefined,
    staleTime: 2 * 60 * 1000, // 2 minutes - discovery data changes frequently
  });
}

/**
 * Hook for discovering nearby users with infinite scroll
 */
export function useDiscoverNearby(filters?: NearbyFilters) {
  return useInfiniteQuery({
    queryKey: queryKeys.discovery.nearby(filters),
    queryFn: async ({ pageParam }: { pageParam: string | undefined }) => {
      const response = await discoveryAPI.discoverNearby({
        ...filters,
        cursor: pageParam,
      });
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      return response.data as DiscoveryResponse;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : undefined,
    staleTime: 2 * 60 * 1000,
    enabled: !!(filters?.lat && filters?.lon), // Only fetch if we have location
  });
}

// ==================== Match Hooks ====================

/**
 * Hook for swiping on users
 */
export function useSwipe() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ targetId, action }: { targetId: string; action: 'skip' | 'save' | 'connect' }) =>
      matchAPI.swipe(targetId, action),
    onSuccess: () => {
      // Invalidate discovery queries to refresh the list
      queryClient.invalidateQueries({ queryKey: queryKeys.discovery.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.matches.all });
    },
  });
}

/**
 * Hook for getting all matches
 */
export function useMatches() {
  return useQuery({
    queryKey: queryKeys.matches.list(),
    queryFn: async () => {
      const response = await matchAPI.getMatches();
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

// ==================== User Profile Hooks ====================

/**
 * Hook for getting current user profile
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.user.me(),
    queryFn: async () => {
      const response = await fetch(`${config.apiUrl}/me`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - profile doesn't change often
    retry: 1, // Don't retry too much for auth
  });
}

/**
 * Hook for getting a specific user profile
 */
export function useUserProfile(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.user.profile(userId || ''),
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');
      
      const response = await fetch(`${config.apiUrl}/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }
      
      return response.json();
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ==================== Project Hooks ====================

/**
 * Hook for getting projects with infinite scroll
 */
export function useProjects(filters?: Record<string, any>) {
  return useInfiniteQuery({
    queryKey: queryKeys.projects.list(filters),
    queryFn: async ({ pageParam }: { pageParam: string | undefined }) => {
      const params = new URLSearchParams({
        ...filters,
        cursor: pageParam || '',
      });
      
      const response = await fetch(`${config.apiUrl}/projects?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      
      return response.json();
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : undefined,
  });
}

// ==================== Event Hooks ====================

/**
 * Hook for getting events with infinite scroll
 */
export function useEvents(filters?: Record<string, any>) {
  return useInfiniteQuery({
    queryKey: queryKeys.events.list(filters),
    queryFn: async ({ pageParam }: { pageParam: string | undefined }) => {
      const params = new URLSearchParams({
        ...filters,
        cursor: pageParam || '',
      });
      
      const response = await fetch(`${config.apiUrl}/events?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      
      return response.json();
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : undefined,
  });
}
