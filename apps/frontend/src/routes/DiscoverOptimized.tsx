/**
 * Optimized Discover Page with Caching & Pagination
 * 
 * Features:
 * ✅ React Query for automatic caching
 * ✅ Infinite scroll pagination
 * ✅ Skeleton loaders for images
 * ✅ Lazy loading
 * ✅ Background refetching
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { SwipeCard } from '../components/SwipeCard';
import { MatchModal } from '../components/MatchModal';
import MapsView from '../components/MapsView';
import { GridSkeleton } from '../components/ProgressiveImage';
import { MapPin, LayoutGrid, Map, Filter, Loader2 } from 'lucide-react';
import { useGeolocation } from '../hooks/useGeolocation';
import { useAuth } from '../hooks/useAuth';
import { useDiscoverOnline, useDiscoverNearby, useSwipe } from '../hooks/useQuery';
import type { User } from '../types/user';
import { useInView } from 'react-intersection-observer';

interface ExtendedUser extends User {
  _id?: string; // MongoDB ID
  distance?: number;
  lat?: number;
  lng?: number;
  isOnline?: boolean;
  matchScore?: number;
  field?: string;
  photos?: string[];
}

export const DiscoverOptimized = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMatch, setShowMatch] = useState(false);
  const [matchedUser, setMatchedUser] = useState<ExtendedUser | null>(null);
  const [mode, setMode] = useState<'online' | 'nearby'>(
    (searchParams.get('mode') as 'online' | 'nearby') || 'online'
  );
  const [viewMode, setViewMode] = useState<'cards' | 'map'>(
    (searchParams.get('view') as 'cards' | 'map') || 'cards'
  );
  const [radiusKm, setRadiusKm] = useState(Number(searchParams.get('radius')) || 10);
  const [filterOpen, setFilterOpen] = useState(false);
  const [field, setField] = useState<string | null>(searchParams.get('field'));
  
  const { location } = useGeolocation();
  const userLocation = location ? { lat: location.latitude, lon: location.longitude } : null;

  // Infinite scroll ref
  const { ref: loadMoreRef, inView } = useInView();

  // React Query hooks for caching & pagination
  const onlineQuery = useDiscoverOnline(
    mode === 'online' 
      ? { field: field || undefined, limit: 20 }
      : undefined
  );

  const nearbyQuery = useDiscoverNearby(
    mode === 'nearby' && userLocation
      ? { ...userLocation, radiusKm, field: field || undefined, limit: 20 }
      : undefined
  );

  const swipeMutation = useSwipe();

  // Select active query based on mode
  const activeQuery = mode === 'online' ? onlineQuery : nearbyQuery;
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = activeQuery;

  // Flatten paginated users
  const users: ExtendedUser[] = data?.pages.flatMap((page) =>
    page.users.map((user: any) => ({
      ...user,
      lat: user.location?.lat,
      lng: user.location?.lon,
      distance: user.distance,
      isOnline: user.isOnline || false,
      matchScore: user.compatibility || 0,
    }))
  ) || [];

  // Authentication check
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/discover', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Load more when scrolling to bottom
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage, isFetchingNextPage]);

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('mode', mode);
    params.set('view', viewMode);
    params.set('radius', radiusKm.toString());
    if (field) params.set('field', field);
    setSearchParams(params);
  }, [mode, viewMode, radiusKm, field, setSearchParams]);

  const handleSwipe = useCallback(async (direction: 'left' | 'right' | 'up') => {
    const currentUser = users[currentIndex];
    if (!currentUser) return;

    const userId = currentUser._id || currentUser.id;
    const action = direction === 'right' ? 'connect' : direction === 'up' ? 'save' : 'skip';

    // Optimistic update
    if (currentIndex < users.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }

    // Send swipe action
    try {
      await swipeMutation.mutateAsync({ targetId: userId, action });
      
      if (direction === 'right') {
        // Show match modal
        setMatchedUser(currentUser);
        setShowMatch(true);
      }
    } catch (err) {
      console.error('Failed to swipe:', err);
      // Revert on error
      if (currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      }
    }
  }, [users, currentIndex, swipeMutation]);

  // Loading state
  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">Discover</h1>
            <p className="text-gray-400">Finding collaborators...</p>
          </div>
          <GridSkeleton count={6} />
        </div>
      </Layout>
    );
  }

  // Error state
  if (isError) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-white mb-2">Oops!</h2>
            <p className="text-gray-400 mb-4">
              {error instanceof Error ? error.message : 'Failed to load users'}
            </p>
            <button 
              onClick={() => activeQuery.refetch()}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              Try Again
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // Empty state
  if (users.length === 0) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md">
            <div className="text-4xl mb-4">🔍</div>
            <h2 className="text-xl font-bold text-white mb-2">No users found</h2>
            <p className="text-gray-400 mb-4">
              Try adjusting your filters or check back later
            </p>
            <button 
              onClick={() => {
                setField(null);
                setRadiusKm(50);
              }}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Discover</h1>
            <p className="text-gray-400">
              {users.length} collaborator{users.length !== 1 ? 's' : ''} available
              {hasNextPage && ' (loading more...)'}
            </p>
          </div>

          {/* View Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setMode(mode === 'online' ? 'nearby' : 'online')}
              className={`px-4 py-2 rounded-lg transition ${
                mode === 'nearby'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400'
              }`}
            >
              <MapPin className="w-5 h-5 inline mr-2" />
              {mode === 'nearby' ? 'Nearby' : 'Online'}
            </button>

            <button
              onClick={() => setViewMode(viewMode === 'cards' ? 'map' : 'cards')}
              className="px-4 py-2 bg-gray-800 text-gray-400 rounded-lg hover:bg-gray-700 transition"
            >
              {viewMode === 'cards' ? (
                <Map className="w-5 h-5" />
              ) : (
                <LayoutGrid className="w-5 h-5" />
              )}
            </button>

            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="px-4 py-2 bg-gray-800 text-gray-400 rounded-lg hover:bg-gray-700 transition"
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <AnimatePresence>
          {filterOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-6 overflow-hidden"
            >
              <div className="bg-gray-800 rounded-lg p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Field
                  </label>
                  <select
                    value={field || ''}
                    onChange={(e) => setField(e.target.value || null)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  >
                    <option value="">All Fields</option>
                    <option value="tech">Technology</option>
                    <option value="design">Design</option>
                    <option value="business">Business</option>
                    <option value="marketing">Marketing</option>
                  </select>
                </div>

                {mode === 'nearby' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Radius: {radiusKm}km
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={radiusKm}
                      onChange={(e) => setRadiusKm(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        {viewMode === 'cards' ? (
          <div className="relative">
            <div className="max-w-md mx-auto h-[600px] relative">
              <AnimatePresence>
                {users.slice(currentIndex, currentIndex + 3).map((user) => (
                  <SwipeCard
                    key={user._id || user.id}
                    user={user as User}
                    onSwipe={handleSwipe}
                  />
                ))}
              </AnimatePresence>

              {currentIndex >= users.length - 5 && hasNextPage && (
                <div className="absolute -bottom-16 left-0 right-0 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-purple-500 mx-auto" />
                  <p className="text-sm text-gray-400 mt-2">Loading more...</p>
                </div>
              )}
            </div>

            {/* Hidden trigger for infinite scroll */}
            <div ref={loadMoreRef} className="h-1" />
          </div>
        ) : (
          <MapsView users={users as any} />
        )}

        {/* Match Modal */}
        {showMatch && matchedUser && (
          <MatchModal
            user={matchedUser as User}
            onClose={() => {
              setShowMatch(false);
              setMatchedUser(null);
            }}
            onSendMessage={() => {
              navigate(`/chat?user=${matchedUser._id || matchedUser.id}`);
            }}
          />
        )}
      </div>
    </Layout>
  );
};

export default DiscoverOptimized;
