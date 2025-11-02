import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { SwipeCard } from '../components/SwipeCard';
import { MatchModal } from '../components/MatchModal';
import { RadiusSlider } from '../components/RadiusSlider';
import { MapPin, LayoutGrid, Map as MapIcon, Filter, Users, Navigation, X } from 'lucide-react';
import { GlassButton } from '../components/GlassButton';
import { fadeInUp, stagger } from '../lib/motion';
import { useGeolocation } from '../hooks/useGeolocation';
import { useAuth } from '../hooks/useAuth';
import type { User } from '../types/user';

interface ExtendedUser extends User {
  distance?: number;
  lat?: number;
  lng?: number;
  isOnline?: boolean;
  matchScore?: number;
}

const mockUsers: ExtendedUser[] = [
  {
    id: '1',
    name: 'Andi Pratama',
    age: 28,
    bio: 'Full Stack Developer passionate about AI and startups',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=andi',
    skills: ['React', 'Node.js', 'TypeScript', 'Python'],
    interests: ['Tech', 'Design', 'Startups'],
    location: 'Jakarta, Indonesia',
    distance: 0.8,
    lat: -6.2088,
    lng: 106.8456,
    isOnline: true,
    matchScore: 92
  },
  {
    id: '2',
    name: 'Sarah Kim',
    age: 26,
    bio: 'UI/UX Designer who loves minimalism',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
    skills: ['Figma', 'Adobe XD', 'Prototyping'],
    interests: ['Design', 'Art', 'Music'],
    location: 'Jakarta, Indonesia',
    distance: 1.2,
    lat: -6.2108,
    lng: 106.8476,
    isOnline: true,
    matchScore: 85
  }
];

export const Discover = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State
  const [users, setUsers] = useState<ExtendedUser[]>(mockUsers);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMatch, setShowMatch] = useState(false);
  const [matchedUser, setMatchedUser] = useState<ExtendedUser | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'map'>(
    (searchParams.get('mode') as 'cards' | 'map') || 'cards'
  );
  const [radius, setRadius] = useState(Number(searchParams.get('radius')) || 10);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ExtendedUser | null>(null);
  const [onlineOnly, setOnlineOnly] = useState(false);
  
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const { location, error: locationError, loading: locationLoading } = useGeolocation();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Update URL when view mode or radius changes
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('mode', viewMode);
    params.set('radius', radius.toString());
    setSearchParams(params);
  }, [viewMode, radius, setSearchParams]);

  // Initialize map when in map mode
  useEffect(() => {
    if (viewMode === 'map' && typeof window !== 'undefined' && mapRef.current && !mapInstanceRef.current) {
      const L = (window as any).L;
      if (L) {
        const mapCenter = location 
          ? [location.latitude, location.longitude] 
          : [-6.2088, 106.8456]; // Default to Jakarta
          
        const map = L.map(mapRef.current).setView(mapCenter, 13);
        
        // Dark tile layer for dark theme
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '© OpenStreetMap contributors, © CARTO'
        }).addTo(map);

        // User location marker
        if (location) {
          const userMarker = L.marker([location.latitude, location.longitude], {
            icon: L.divIcon({
              className: 'user-location-marker',
              html: '<div class="pulse-marker"><div class="pulse-dot"></div></div>',
              iconSize: [30, 30]
            })
          }).addTo(map);
          userMarker.bindPopup('Your Location');
        }

        // Add markers for users
        const filteredUsers = onlineOnly ? users.filter(u => u.isOnline) : users;
        filteredUsers.forEach(user => {
          if (user.lat && user.lng && (!radius || (user.distance && user.distance <= radius))) {
            const marker = L.marker([user.lat, user.lng], {
              icon: L.divIcon({
                className: 'user-marker',
                html: `
                  <div class="relative cursor-pointer">
                    <img src="${user.avatar}" class="w-12 h-12 rounded-full border-2 ${user.isOnline ? 'border-green-500' : 'border-gray-500'} shadow-lg" />
                    ${user.isOnline ? '<div class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-dark-surface"></div>' : ''}
                  </div>
                `,
                iconSize: [48, 48]
              })
            }).addTo(map);
            
            marker.on('click', () => setSelectedUser(user));
          }
        });

        // Add radius circle
        if (location && radius < 50) {
          L.circle([location.latitude, location.longitude], {
            radius: radius * 1000,
            color: '#6E9EFF',
            fillColor: '#6E9EFF',
            fillOpacity: 0.1,
            weight: 2,
            dashArray: '5, 10'
          }).addTo(map);
        }

        mapInstanceRef.current = map;
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [viewMode, location, users, radius, onlineOnly]);

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

  const handleConnect = (user: ExtendedUser) => {
    setMatchedUser(user);
    setShowMatch(true);
  };

  const filteredUsers = onlineOnly 
    ? users.filter(u => u.isOnline)
    : users;

  const nearbyUsers = radius < 50
    ? filteredUsers.filter(u => u.distance && u.distance <= radius)
    : filteredUsers;

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

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                  viewMode === 'cards'
                    ? 'bg-accent-blue text-white'
                    : 'glass text-white/60 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                Cards
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                  viewMode === 'map'
                    ? 'bg-accent-blue text-white'
                    : 'glass text-white/60 hover:text-white'
                }`}
              >
                <MapIcon className="w-4 h-4" />
                Map
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

        {/* Main Content */}
        {viewMode === 'cards' ? (
          /* Cards View */
          <div className="flex justify-center items-center min-h-[600px]">
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
                  <GlassButton variant="primary" onClick={() => setCurrentIndex(0)}>
                    Start Over
                  </GlassButton>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          /* Map View */
          <div className="relative">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative h-[600px] rounded-2xl overflow-hidden glass"
            >
              <div ref={mapRef} className="w-full h-full" />
              
              {/* Loading State */}
              {locationLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="text-white flex items-center gap-3">
                    <Navigation className="w-5 h-5 animate-pulse" />
                    <span>Getting your location...</span>
                  </div>
                </div>
              )}

              {/* Selected User Sidebar */}
              <AnimatePresence>
                {selectedUser && (
                  <motion.div
                    initial={{ x: 400, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 400, opacity: 0 }}
                    className="absolute right-0 top-0 bottom-0 w-96 glass-strong shadow-2xl overflow-y-auto"
                  >
                    <div className="p-6">
                      <button
                        onClick={() => setSelectedUser(null)}
                        className="absolute right-4 top-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5 text-white/60" />
                      </button>
                      
                      <div className="mb-6">
                        <img 
                          src={selectedUser.avatar} 
                          alt={selectedUser.name}
                          className="w-32 h-32 rounded-2xl mx-auto mb-4"
                        />
                        <h3 className="text-2xl font-bold text-white text-center">
                          {selectedUser.name}, {selectedUser.age}
                        </h3>
                        <div className="flex items-center justify-center gap-2 mt-2">
                          <MapPin className="w-4 h-4 text-accent-blue" />
                          <span className="text-white/60">{selectedUser.distance} km away</span>
                          {selectedUser.isOnline && (
                            <span className="px-2 py-0.5 bg-green-500/20 text-green-500 text-xs rounded-full">
                              Online
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-white/80 mb-4">{selectedUser.bio}</p>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-white/60 mb-2">Skills</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedUser.skills.map(skill => (
                            <span key={skill} className="px-3 py-1 bg-accent-blue/20 text-accent-blue text-sm rounded-lg">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="mb-6">
                        <h4 className="text-sm font-medium text-white/60 mb-2">Interests</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedUser.interests.map(interest => (
                            <span key={interest} className="px-3 py-1 bg-accent-purple/20 text-accent-purple text-sm rounded-lg">
                              {interest}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <GlassButton
                        variant="primary"
                        fullWidth
                        onClick={() => handleConnect(selectedUser)}
                      >
                        Connect
                      </GlassButton>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Empty State */}
              {nearbyUsers.length === 0 && !locationLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                      className="w-24 h-24 mx-auto mb-4 rounded-full border-4 border-accent-blue/20 border-t-accent-blue"
                    />
                    <h3 className="text-xl font-bold text-white mb-2">No one nearby yet</h3>
                    <p className="text-white/60 mb-4">Try increasing your search radius or switch to Online mode</p>
                    <div className="flex gap-3 justify-center">
                      <GlassButton
                        variant="secondary"
                        onClick={() => setRadius(Math.min(50, radius + 10))}
                      >
                        Increase Radius
                      </GlassButton>
                      <GlassButton
                        variant="primary"
                        onClick={() => setRadius(50)}
                      >
                        Go Online
                      </GlassButton>
                    </div>
                  </div>
                </div>
              )}

              {/* Location Error */}
              {locationError && (
                <div className="absolute bottom-4 left-4 right-4 glass-strong rounded-lg p-4 border border-orange-500/30">
                  <p className="text-orange-400 text-sm">
                    {locationError}. Showing online users instead.
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </div>

      {/* Match Modal */}
      <MatchModal
        isOpen={showMatch}
        onClose={() => setShowMatch(false)}
        user={matchedUser}
      />

      {/* Map Styles */}
      <style>{`
        @import url('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
        
        .user-location-marker {
          background: transparent;
        }
        
        .pulse-marker {
          position: relative;
          width: 30px;
          height: 30px;
        }
        
        .pulse-dot {
          position: absolute;
          width: 12px;
          height: 12px;
          background: #6E9EFF;
          border-radius: 50%;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          box-shadow: 0 0 10px rgba(110, 158, 255, 0.8);
        }
        
        .pulse-dot::before {
          content: '';
          position: absolute;
          width: 100%;
          height: 100%;
          background: #6E9EFF;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(3);
            opacity: 0;
          }
        }
        
        .leaflet-container {
          background: #0B0B0B;
        }
        
        .leaflet-popup-content-wrapper {
          background: rgba(15, 19, 34, 0.95);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          border-radius: 12px;
        }
        
        .leaflet-popup-tip {
          background: rgba(15, 19, 34, 0.95);
        }
        
        .user-marker {
          background: transparent;
          border: none;
        }
      `}</style>

      {/* Load Leaflet */}
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" async></script>
    </Layout>
  );
};
