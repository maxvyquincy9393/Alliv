import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, Users, Filter, X } from 'lucide-react';
import { GlassButton } from '../components/GlassButton';
import { fadeInUp, stagger } from '../lib/motion';
import { useGeolocation } from '../hooks/useGeolocation';

interface NearbyUser {
  id: string;
  name: string;
  profession: string;
  skills: string[];
  avatar: string;
  distance: number;
  lat: number;
  lng: number;
  isOnline: boolean;
  matchScore: number;
}

// Mock data for nearby users
const mockNearbyUsers: NearbyUser[] = [
  {
    id: '1',
    name: 'Andi Pratama',
    profession: 'Full Stack Developer',
    skills: ['React', 'Node.js', 'TypeScript'],
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=andi',
    distance: 0.8,
    lat: -6.2088,
    lng: 106.8456,
    isOnline: true,
    matchScore: 92
  },
  {
    id: '2',
    name: 'Siti Nurhaliza',
    profession: 'UI/UX Designer',
    skills: ['Figma', 'Adobe XD', 'Prototyping'],
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=siti',
    distance: 1.2,
    lat: -6.2108,
    lng: 106.8476,
    isOnline: true,
    matchScore: 85
  },
  {
    id: '3',
    name: 'Budi Santoso',
    profession: 'Photographer',
    skills: ['Portrait', 'Product', 'Drone'],
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=budi',
    distance: 2.5,
    lat: -6.2148,
    lng: 106.8506,
    isOnline: false,
    matchScore: 78
  }
];

export const Nearby = () => {
  const [nearbyUsers] = useState<NearbyUser[]>(mockNearbyUsers);
  const [selectedUser, setSelectedUser] = useState<NearbyUser | null>(null);
  const [mapView, setMapView] = useState<'map' | 'list'>('map');
  const [searchRadius, setSearchRadius] = useState(5); // in km
  const [filterOpen, setFilterOpen] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const { location, error: locationError, loading: locationLoading } = useGeolocation();

  // Initialize map
  useEffect(() => {
    if (typeof window !== 'undefined' && mapRef.current && !mapInstanceRef.current) {
      // Check if Leaflet is available
      const L = (window as any).L;
      if (L) {
        // Initialize map centered on Jakarta
        const map = L.map(mapRef.current).setView([-6.2088, 106.8456], 13);
        
        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // Add user location marker if available
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

        // Add markers for nearby users
        nearbyUsers.forEach(user => {
          const marker = L.marker([user.lat, user.lng], {
            icon: L.divIcon({
              className: 'user-marker',
              html: `
                <div class="relative">
                  <img src="${user.avatar}" class="w-10 h-10 rounded-full border-2 ${user.isOnline ? 'border-green-500' : 'border-gray-500'}" />
                  ${user.isOnline ? '<div class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>' : ''}
                </div>
              `,
              iconSize: [40, 40]
            })
          }).addTo(map);
          
          marker.on('click', () => setSelectedUser(user));
          marker.bindPopup(`
            <div class="p-2">
              <strong>${user.name}</strong><br/>
              ${user.profession}<br/>
              <span class="text-sm text-gray-600">${user.distance} km away</span>
            </div>
          `);
        });

        // Add search radius circle
        if (location) {
          L.circle([location.latitude, location.longitude], {
            radius: searchRadius * 1000,
            color: '#6E9EFF',
            fillColor: '#6E9EFF',
            fillOpacity: 0.1,
            weight: 2
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
  }, [location, nearbyUsers, searchRadius]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg to-dark-surface">
      {/* Header */}
      <div className="sticky top-0 z-40 glass-strong border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MapPin className="w-6 h-6 text-accent-blue" />
              <h1 className="text-2xl font-bold text-white">Nearby Collaborators</h1>
              <span className="px-2 py-1 rounded-full bg-accent-blue/20 text-accent-blue text-sm">
                {nearbyUsers.length} nearby
              </span>
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMapView('map')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  mapView === 'map' 
                    ? 'bg-accent-blue text-white' 
                    : 'glass text-white/60 hover:text-white'
                }`}
              >
                Map View
              </button>
              <button
                onClick={() => setMapView('list')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  mapView === 'list' 
                    ? 'bg-accent-blue text-white' 
                    : 'glass text-white/60 hover:text-white'
                }`}
              >
                List View
              </button>
              
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                className="p-2 glass rounded-lg hover:bg-white/10 transition-colors"
              >
                <Filter className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {filterOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-white/10 glass overflow-hidden"
          >
            <div className="max-w-7xl mx-auto px-4 py-4">
              <div className="flex items-center gap-6">
                {/* Search Radius */}
                <div className="flex items-center gap-3">
                  <span className="text-white/60 text-sm">Radius:</span>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={searchRadius}
                    onChange={(e) => setSearchRadius(Number(e.target.value))}
                    className="w-32"
                  />
                  <span className="text-white font-medium">{searchRadius} km</span>
                </div>

                {/* Skills Filter */}
                <div className="flex items-center gap-3">
                  <span className="text-white/60 text-sm">Skills:</span>
                  <select className="bg-dark-surface border border-white/10 rounded-lg px-3 py-1 text-white">
                    <option value="">All Skills</option>
                    <option value="developer">Developer</option>
                    <option value="designer">Designer</option>
                    <option value="photographer">Photographer</option>
                  </select>
                </div>

                {/* Online Only */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded" />
                  <span className="text-white/60 text-sm">Online only</span>
                </label>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {mapView === 'map' ? (
          <div className="relative">
            {/* Map Container */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative h-[600px] rounded-2xl overflow-hidden glass"
            >
              <div ref={mapRef} className="w-full h-full" />
              
              {/* Map Loading State */}
              {locationLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="text-white flex items-center gap-3">
                    <Navigation className="w-5 h-5 animate-pulse" />
                    <span>Getting your location...</span>
                  </div>
                </div>
              )}

              {/* Selected User Card */}
              <AnimatePresence>
                {selectedUser && (
                  <motion.div
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -100, opacity: 0 }}
                    className="absolute left-4 top-4 w-80 glass-strong rounded-xl p-4 shadow-lg"
                  >
                    <button
                      onClick={() => setSelectedUser(null)}
                      className="absolute right-2 top-2 p-1 hover:bg-white/10 rounded-lg"
                    >
                      <X className="w-4 h-4 text-white/60" />
                    </button>
                    
                    <div className="flex items-start gap-3">
                      <img 
                        src={selectedUser.avatar} 
                        alt={selectedUser.name}
                        className="w-16 h-16 rounded-full"
                      />
                      <div className="flex-1">
                        <h3 className="text-white font-semibold">{selectedUser.name}</h3>
                        <p className="text-white/60 text-sm">{selectedUser.profession}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <MapPin className="w-3 h-3 text-accent-blue" />
                          <span className="text-xs text-white/40">{selectedUser.distance} km away</span>
                          {selectedUser.isOnline && (
                            <span className="px-2 py-0.5 bg-green-500/20 text-green-500 text-xs rounded-full">
                              Online
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      {selectedUser.skills.slice(0, 3).map(skill => (
                        <span key={skill} className="px-2 py-1 bg-accent-blue/20 text-accent-blue text-xs rounded-lg">
                          {skill}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <GlassButton variant="primary" fullWidth>
                        Connect
                      </GlassButton>
                      <GlassButton variant="secondary" fullWidth>
                        View Profile
                      </GlassButton>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Location Permission Error */}
              {locationError && (
                <div className="absolute bottom-4 left-4 right-4 glass-strong rounded-lg p-4 border border-red-500/30">
                  <p className="text-red-400 text-sm">
                    Location access denied. Enable location to see nearby collaborators.
                  </p>
                </div>
              )}
            </motion.div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass rounded-xl p-4 text-center"
              >
                <Users className="w-8 h-8 text-accent-blue mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{nearbyUsers.length}</p>
                <p className="text-white/60 text-sm">Nearby Users</p>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass rounded-xl p-4 text-center"
              >
                <Navigation className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{nearbyUsers.filter(u => u.isOnline).length}</p>
                <p className="text-white/60 text-sm">Online Now</p>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass rounded-xl p-4 text-center"
              >
                <MapPin className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{searchRadius}</p>
                <p className="text-white/60 text-sm">km Radius</p>
              </motion.div>
            </div>
          </div>
        ) : (
          /* List View */
          <motion.div
            variants={stagger(0.1)}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {nearbyUsers.map(user => (
              <motion.div
                key={user.id}
                variants={fadeInUp}
                whileHover={{ y: -4 }}
                className="glass rounded-xl p-4 hover:shadow-glow-blue transition-all cursor-pointer"
                onClick={() => setSelectedUser(user)}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <img 
                      src={user.avatar} 
                      alt={user.name}
                      className="w-16 h-16 rounded-full"
                    />
                    {user.isOnline && (
                      <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-dark-surface" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold">{user.name}</h3>
                    <p className="text-white/60 text-sm">{user.profession}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="w-3 h-3 text-accent-blue" />
                      <span className="text-xs text-white/40">{user.distance} km</span>
                      <span className="text-xs text-accent-blue">•</span>
                      <span className="text-xs text-accent-blue">{user.matchScore}% match</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-1 mt-3">
                  {user.skills.map(skill => (
                    <span key={skill} className="px-2 py-1 bg-white/5 text-white/60 text-xs rounded">
                      {skill}
                    </span>
                  ))}
                </div>
                
                <div className="flex gap-2 mt-4">
                  <GlassButton variant="primary" fullWidth>
                    Connect
                  </GlassButton>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Add Leaflet CSS */}
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
      `}</style>

      {/* Load Leaflet Script */}
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" async></script>
    </div>
  );
};
