import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { SwipeCard } from '../components/SwipeCard';
import { MatchModal } from '../components/MatchModal';
import MapsView from '../components/MapsView';
import { MapPin, LayoutGrid, Map, Filter, Navigation } from 'lucide-react';
import { useGeolocation } from '../hooks/useGeolocation';
import { useAuth } from '../hooks/useAuth';
import { discoveryAPI } from '../services/api';
import type { User } from '../types/user';

interface ExtendedUser extends User {
  distance?: number;
  lat?: number;
  lng?: number;
  isOnline?: boolean;
  matchScore?: number;
}

// No mock data - using real API

export const Discover = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State
  const [users, setUsers] = useState<ExtendedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMatch, setShowMatch] = useState(false);
  const [matchedUser, setMatchedUser] = useState<ExtendedUser | null>(null);
  const [mode, setMode] = useState<'online' | 'nearby'>('online');
  const [viewMode, setViewMode] = useState<'cards' | 'map'>('cards');
  const [radius, setRadius] = useState(Number(searchParams.get('radius')) || 10);
  const [filterOpen, setFilterOpen] = useState(false);
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [field] = useState<string | null>(null); // Field filter not yet implemented
  
  const { location, loading: locationLoading } = useGeolocation();
  const userLocation = location ? { lat: location.latitude, lon: location.longitude } : null;

  // Authentication check
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/discover', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Fetch users from API with cancellation support
  useEffect(() => {
    const abortController = new AbortController();
    
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let response;
        if (mode === 'nearby' && userLocation) {
          response = await discoveryAPI.discoverNearby({
            lat: userLocation.lat,
            lon: userLocation.lon,
            radiusKm: radius,
            field: field || undefined,
            limit: 20
          }, abortController.signal);
        } else {
          response = await discoveryAPI.discoverOnline({
            field: field || undefined,
            limit: 20
          }, abortController.signal);
        }
        
        // Check if request was cancelled
        if (response.error === 'Request cancelled') {
          console.log('User discovery request was cancelled');
          return;
        }
        
        if (response.error) {
          throw new Error(response.error);
        }
        
        const fetchedUsers = response.data?.users || [];
        setUsers(fetchedUsers.map((user: any) => ({
          ...user,
          lat: user.location?.lat,
          lng: user.location?.lon,
          distance: user.distance,
          isOnline: user.isOnline || false,
          matchScore: user.compatibility || 0
        })));
      } catch (err: any) {
        // Don't set error state if request was aborted
        if (err.name !== 'AbortError' && err.message !== 'Request cancelled') {
          console.error('Failed to fetch users:', err);
          setError(err instanceof Error ? err.message : 'Failed to load users');
        }
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchUsers();
    }
    
    // Cleanup function - cancel request on unmount or dependency change
    return () => {
      abortController.abort();
    };
  }, [mode, userLocation, radius, field, isAuthenticated]);


  // Update URL when view mode or radius changes
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('mode', viewMode);
    params.set('radius', radius.toString());
    setSearchParams(params);
  }, [viewMode, radius, setSearchParams]);

  const handleSwipe = (direction: 'left' | 'right' | 'up') => {
    const currentUser = users[currentIndex];
    
    if (direction === 'right') {
      // It's a match!
      setMatchedUser(currentUser);
      setShowMatch(true);
    }
    
    // Move to next user
    if (currentIndex < users.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };


  const filteredUsers = onlineOnly 
    ? users.filter(u => u.isOnline)
    : users;

  const nearbyUsers = radius < 50
    ? filteredUsers.filter(u => u.distance && u.distance <= radius)
    : filteredUsers;

  // Loading state
  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Finding collaborators...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Error state
  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-white mb-2">Oops!</h2>
            <p className="text-gray-400 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              Try Again
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
        <div className="glass-strong rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">Discover</h1>
              <span className="px-3 py-1 rounded-full bg-accent-blue/20 text-accent-blue text-sm">
                {viewMode === 'map' ? `${nearbyUsers.length} nearby` : `${filteredUsers.length} online`}
              </span>
            </div>

            {/* Mode Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMode('online')}
                className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                  mode === 'online'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-105'
                    : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700'
                }`}
              >
                Online
              </button>
              <button
                onClick={() => setMode('nearby')}
                className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                  mode === 'nearby'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-105'
                    : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700'
                }`}
              >
                <MapPin className="w-4 h-4" />
                Nearby
              </button>
              
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                className="p-2 glass rounded-lg hover:bg-white/10 transition-colors ml-2"
              >
                <Filter className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Filter Panel */}
          <AnimatePresence>
            {filterOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-4 pt-4 border-t border-white/10 overflow-hidden"
              >
                <div className="flex flex-wrap items-center gap-6">
                  {/* Radius Slider */}
                  {viewMode === 'map' && (
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-white/60" />
                      <span className="text-white/60 text-sm">Radius:</span>
                      <input
                        type="range"
                        min="1"
                        max="50"
                        value={radius}
                        onChange={(e) => setRadius(Number(e.target.value))}
                        className="w-32"
                      />
                      <span className="text-white font-medium">
                        {radius === 50 ? 'Online' : `${radius} km`}
                      </span>
                    </div>
                  )}

                  {/* Online Only */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={onlineOnly}
                      onChange={(e) => setOnlineOnly(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-white/60 text-sm">Online only</span>
                  </label>

                  {/* Skills Filter */}
                  <div className="flex items-center gap-3">
                    <span className="text-white/60 text-sm">Skills:</span>
                    <select className="bg-dark-surface border border-white/10 rounded-lg px-3 py-1 text-white text-sm">
                      <option value="">All Skills</option>
                      <option value="developer">Developer</option>
                      <option value="designer">Designer</option>
                      <option value="photographer">Photographer</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* View Mode Toggle for Nearby Mode */}
        {mode === 'nearby' && (
          <div className="flex gap-2 mb-4 justify-center">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                viewMode === 'cards' 
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-105' 
                  : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700'
              }`}
            >
              <LayoutGrid className="inline mr-2" size={18} />
              Cards View
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                viewMode === 'map' 
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-105' 
                  : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700'
              }`}
            >
              <Map className="inline mr-2" size={18} />
              Map View
            </button>
          </div>
        )}

        {/* Main Content */}
        {mode === 'nearby' && viewMode === 'map' ? (
          /* Map View for Nearby Mode */
          <div className="h-[600px] relative rounded-xl overflow-hidden">
            {/* Map View */}
            {location ? (
                <MapsView
                  users={nearbyUsers.map(user => ({
                    id: user.id,
                    name: user.name,
                    age: user.age,
                    field: user.interests?.[0] || 'General',
                    photos: [user.avatar],
                    location: {
                      lat: user.lat || -6.2088,
                      lon: user.lng || 106.8456,
                      city: typeof user.location === 'string' ? user.location : (user.location?.city || 'Jakarta, Indonesia')
                    },
                    distance: user.distance,
                    compatibility: user.matchScore
                  }))}
                  center={{ 
                    lat: location.latitude, 
                    lng: location.longitude 
                  }}
                  radius={radius}
                  onUserClick={(user) => {
                    // Navigate directly to user profile
                    navigate(`/profiles/${user.id}`);
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full glass">
                  <div className="text-center">
                    <Navigation className="w-12 h-12 text-accent-blue mx-auto mb-4 animate-pulse" />
                    <p className="text-white/60">
                      {locationLoading ? 'Getting your location...' : 'Location required for map view'}
                    </p>
                  </div>
                </div>
              )}
          </div>
        ) : (
          /* Cards View */
          <div className="flex justify-center items-center min-h-[600px]">
            {/* Test card visibility */}
            <div className="absolute top-20 right-4 glass rounded-lg p-3 text-xs text-white/60 z-50">
              Card {currentIndex + 1} of {filteredUsers.length}
            </div>

            <AnimatePresence mode="wait">
              {currentIndex < filteredUsers.length ? (
                <motion.div
                  key={filteredUsers[currentIndex].id}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className="relative"
                >
                  {/* Debug card info */}
                  <div className="absolute top-0 left-0 z-50 glass rounded-lg p-2 text-xs text-white">
                    {filteredUsers[currentIndex].name}
                  </div>

                  <SwipeCard
                    user={filteredUsers[currentIndex]}
                    onSwipe={handleSwipe}
                  />
                  
                  {/* Stack preview */}
                  {currentIndex + 1 < filteredUsers.length && (
                    <div className="absolute top-4 left-4 -z-10 w-full h-full glass rounded-3xl opacity-50 transform rotate-3" />
                  )}
                  {currentIndex + 2 < filteredUsers.length && (
                    <div className="absolute top-8 left-8 -z-20 w-full h-full glass rounded-3xl opacity-30 transform rotate-6" />
                  )}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-20"
                >
                  <div className="text-6xl mb-4">🎯</div>
                  <h3 className="text-2xl font-bold text-white mb-2">No more profiles!</h3>
                  <p className="text-white/60 mb-6">Check back later for new matches</p>
                  <button
                    onClick={() => setCurrentIndex(0)}
                    className="px-6 py-3 bg-accent-blue text-white rounded-lg hover:bg-accent-blue/80 transition-colors"
                  >
                    Start Over
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Match Modal */}
      {showMatch && (
        <MatchModal
          onClose={() => setShowMatch(false)}
          user={matchedUser}
          onSendMessage={() => {
            setShowMatch(false);
            navigate('/messages');
          }}
        />
      )}
    </Layout>
  );
};
