import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { SwipeCard } from '../components/SwipeCard';
import { FloatingButtons } from '../components/FloatingButtons';
import { MatchModal } from '../components/MatchModal';
import { MapPreview } from '../components/MapPreview';
import MapsView from '../components/MapsView';
import { RadiusSlider } from '../components/RadiusSlider';
import { Loader } from '../components/Loader';
import { useSwipe } from '../hooks/useSwipe';
import { useAuth } from '../hooks/useAuth';
import { fadeInUp, stagger } from '../lib/motion';
import { getUserLocation, calculateDistance, isWithinRadius } from '../lib/geo';
import type { ModePreference, UserLocation } from '../types/profile';

export const Discover = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const {
    users,
    currentIndex,
    loading,
    matchedUser,
    showMatchModal,
    loadUsers,
    handleSwipe,
    closeMatchModal,
  } = useSwipe();

  const [mode, setMode] = useState<ModePreference>('online');
  const [viewMode, setViewMode] = useState<'cards' | 'map'>('cards'); // NEW: Cards/Maps toggle
  const [radiusKm, setRadiusKm] = useState(25);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    field: '',
    availability: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadUsers();
  }, [isAuthenticated, navigate, loadUsers]);

  const handleModeSwitch = async (newMode: ModePreference) => {
    setMode(newMode);
    if (newMode === 'nearby' && !userLocation) {
      setGettingLocation(true);
      try {
        const location = await getUserLocation();
        setUserLocation(location);
      } catch (error) {
        console.error('Failed to get location:', error);
        setMode('online'); // Fallback to online
      } finally {
        setGettingLocation(false);
      }
    }
  };

  // Filter users based on mode
  const filteredUsers = users.filter((user) => {
    if (mode === 'nearby' && userLocation) {
      // Check if user is within radius
      if (user.location && typeof user.location !== 'string') {
        return isWithinRadius(userLocation, user.location, radiusKm);
      }
      return false;
    }
    return true; // Online mode shows all
  });

  const currentUser = filteredUsers[currentIndex];
  const noMoreUsers = currentIndex >= filteredUsers.length;

  const handleSwipeAction = (direction: 'left' | 'right' | 'up') => {
    if (currentUser) {
      handleSwipe(direction, currentUser.id);
    }
  };

  const handleSendMessage = () => {
    closeMatchModal();
    navigate('/chat');
  };

  // Calculate compatibility score (mock)
  const getCompatibilityScore = (user: any): number => {
    // Mock calculation based on shared skills/interests
    const sharedSkills = user.skills?.filter((s: string) => 
      ['JavaScript', 'Python', 'React'].includes(s)
    ).length || 0;
    return Math.min(100, 60 + sharedSkills * 10);
  };

  if (loading || gettingLocation) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[70vh]">
          <Loader />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 pt-8">
        <motion.div
          variants={stagger(0.1)}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          {/* Header with Mode Toggle */}
          <motion.div variants={fadeInUp} className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-white">Discover</h1>
            
            {/* Mode Toggle */}
            <div className="glass rounded-xl p-1 flex gap-1">
              <button
                onClick={() => handleModeSwitch('online')}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  mode === 'online'
                    ? 'glass-strong text-white shadow-glow-blue'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <span className="mr-2">🌐</span>
                Online
              </button>
              <button
                onClick={() => handleModeSwitch('nearby')}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  mode === 'nearby'
                    ? 'glass-strong text-white shadow-glow-blue'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <span className="mr-2">📍</span>
                Nearby
              </button>
            </div>

            {/* Filters Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="glass px-4 py-2 rounded-xl text-white/80 hover:text-white transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </button>
          </motion.div>

          {/* Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="glass-card rounded-2xl p-6 space-y-4"
              >
                <h3 className="text-lg font-semibold text-white mb-4">Filters</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">Field</label>
                    <select
                      value={filters.field}
                      onChange={(e) => setFilters({ ...filters, field: e.target.value })}
                      className="w-full px-4 py-2 glass rounded-xl text-white"
                    >
                      <option value="">All Fields</option>
                      <option value="developer">Developer</option>
                      <option value="designer">Designer</option>
                      <option value="photographer">Photographer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">Availability</label>
                    <select
                      value={filters.availability}
                      onChange={(e) => setFilters({ ...filters, availability: e.target.value })}
                      className="w-full px-4 py-2 glass rounded-xl text-white"
                    >
                      <option value="">Any</option>
                      <option value="online">Online Now</option>
                      <option value="offline">Offline</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Nearby Mode Extras */}
          {mode === 'nearby' && userLocation && (
            <motion.div variants={fadeInUp} className="space-y-6">
              {/* View Mode Toggle */}
              <div className="flex items-center justify-center gap-3 glass-card rounded-xl p-3 w-fit mx-auto">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-6 py-2 rounded-lg font-medium transition-all ${
                    viewMode === 'cards'
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <span className="mr-2">🃏</span>
                  Cards
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-6 py-2 rounded-lg font-medium transition-all ${
                    viewMode === 'map'
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <span className="mr-2">🗺️</span>
                  Map
                </button>
              </div>

              {/* Map View or Radius Control */}
              {viewMode === 'map' ? (
                <div className="glass-card rounded-2xl p-6 h-[600px]">
                  <MapsView
                    users={filteredUsers
                      .filter(user => user.location && typeof user.location !== 'string')
                      .map(user => {
                        const loc = user.location as UserLocation;
                        return {
                          id: user.id,
                          name: user.name,
                          age: user.age,
                          field: user.city || 'Collaborator',
                          photos: [user.avatar],
                          location: {
                            lat: loc.lat,
                            lon: loc.lon,
                            city: loc.city,
                          },
                          distance: calculateDistance(userLocation, loc) || 0,
                          compatibility: getCompatibilityScore(user),
                        };
                      })}
                    center={{ lat: userLocation.lat, lng: userLocation.lon }}
                    onUserClick={(user) => navigate(`/profile/${user.id}`)}
                    radius={radiusKm}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Map Preview */}
                  <MapPreview city={userLocation.city} radiusKm={radiusKm} />
                  
                  {/* Radius Control */}
                  <div className="glass-card rounded-2xl p-6">
                    <RadiusSlider value={radiusKm} onChange={setRadiusKm} />
                    <p className="text-xs text-white/40 mt-4">
                      Showing collaborators within {radiusKm} km of {userLocation.city}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Main Content Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Swipe Deck */}
            <div className="lg:col-span-2">
              {noMoreUsers ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-20 glass-card rounded-2xl p-8"
                >
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {mode === 'nearby' ? "No one nearby" : "You've seen everyone"}
                  </h2>
                  <p className="text-white/40 mb-6">
                    {mode === 'nearby' 
                      ? "Try increasing your search radius or switch to Online mode"
                      : "Check back later for more matches"
                    }
                  </p>
                  {mode === 'nearby' && (
                    <button
                      onClick={() => setRadiusKm(50)}
                      className="glass px-6 py-3 rounded-xl text-white hover:shadow-glow-blue transition-all"
                    >
                      Increase Radius
                    </button>
                  )}
                </motion.div>
              ) : (
                <>
                  {/* Card Stack */}
                  <div className="relative h-[600px]">
                    <AnimatePresence>
                      {filteredUsers
                        .slice(currentIndex, currentIndex + 3)
                        .reverse()
                        .map((user, index) => (
                          <SwipeCard
                            key={user.id}
                            user={user}
                            onSwipe={handleSwipeAction}
                            style={{
                              zIndex: 3 - index,
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                            }}
                          />
                        ))}
                    </AnimatePresence>

                    {/* Distance Badge (Nearby Mode) */}
                    {mode === 'nearby' && currentUser?.location && 
                     typeof currentUser.location !== 'string' && userLocation && (
                      <div className="absolute top-4 left-4 glass px-4 py-2 rounded-xl z-10">
                        <p className="text-sm text-white font-medium">
                          📍 {calculateDistance(userLocation, currentUser.location)?.toFixed(1)} km away
                        </p>
                      </div>
                    )}

                    {/* Compatibility Badge */}
                    {currentUser && getCompatibilityScore(currentUser) >= 70 && (
                      <div className="absolute top-4 right-4 glass-strong px-4 py-2 rounded-xl z-10 shadow-glow-blue">
                        <p className="text-sm text-accent-blue font-bold">
                          ⭐ {getCompatibilityScore(currentUser)}% Match
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <FloatingButtons
                    onSkip={() => handleSwipeAction('left')}
                    onLike={() => handleSwipeAction('right')}
                    onSuperLike={() => handleSwipeAction('up')}
                    disabled={!currentUser}
                  />
                </>
              )}
            </div>

            {/* Sidebar Info */}
            <div className="space-y-4">
              {currentUser && (
                <motion.div
                  variants={fadeInUp}
                  className="glass-card rounded-2xl p-6 space-y-4"
                >
                  <h3 className="text-lg font-semibold text-white">About</h3>
                  <p className="text-sm text-white/60">{currentUser.bio}</p>
                  
                  <div>
                    <h4 className="text-sm font-medium text-white/70 mb-2">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {currentUser.skills.slice(0, 5).map((skill, i) => (
                        <span key={i} className="px-3 py-1 glass rounded-full text-xs text-white">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {currentUser.location && (
                    <div>
                      <h4 className="text-sm font-medium text-white/70 mb-1">Location</h4>
                      <p className="text-sm text-white/60">
                        {typeof currentUser.location === 'string' 
                          ? currentUser.location 
                          : `${currentUser.location.city}, ${currentUser.location.country}`
                        }
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Stats */}
              <motion.div variants={fadeInUp} className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Today's Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-white/60 text-sm">Profiles seen</span>
                    <span className="text-white font-bold">{currentIndex}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/60 text-sm">Available</span>
                    <span className="text-white font-bold">{filteredUsers.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/60 text-sm">Mode</span>
                    <span className="text-accent-blue font-bold capitalize">{mode}</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Match Modal */}
      <AnimatePresence>
        {showMatchModal && matchedUser && (
          <MatchModal
            user={matchedUser}
            onClose={closeMatchModal}
            onSendMessage={handleSendMessage}
          />
        )}
      </AnimatePresence>
    </Layout>
  );
};
