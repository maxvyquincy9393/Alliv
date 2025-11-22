import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, Users, Filter, X } from 'lucide-react';
import { FullScreenLayout } from '../components/FullScreenLayout';
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
            color: '#3B82F6',
            fillColor: '#3B82F6',
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
    <FullScreenLayout>
      <div className="pt-20 pb-8 px-4 max-w-7xl mx-auto">
        {/* Header */}
        <div className="glass-panel rounded-2xl p-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <MapPin className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Nearby Collaborators</h1>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs border border-blue-500/30">
                  {nearbyUsers.length} nearby
                </span>
              </div>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setMapView('map')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                mapView === 'map' 
                  ? 'bg-white/10 text-white shadow-sm' 
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              Map View
            </button>
            <button
              onClick={() => setMapView('list')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                mapView === 'list' 
                  ? 'bg-white/10 text-white shadow-sm' 
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              List View
            </button>
            
            <div className="w-px h-6 bg-white/10 mx-1" />
            
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className={`p-2 rounded-lg transition-colors ${filterOpen ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        <AnimatePresence>
          {filterOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0, marginBottom: 0 }}
              animate={{ height: 'auto', opacity: 1, marginBottom: 24 }}
              exit={{ height: 0, opacity: 0, marginBottom: 0 }}
              className="overflow-hidden"
            >
              <div className="glass-panel rounded-2xl p-6">
                <div className="flex flex-wrap items-center gap-6">
                  {/* Search Radius */}
                  <div className="flex items-center gap-3">
                    <span className="text-white/60 text-sm">Radius:</span>
                    <input
                      type="range"
                      min="1"
                      max="50"
                      value={searchRadius}
                      onChange={(e) => setSearchRadius(Number(e.target.value))}
                      className="w-32 accent-blue-500"
                    />
                    <span className="text-white font-medium">{searchRadius} km</span>
                  </div>

                  {/* Skills Filter */}
                  <div className="flex items-center gap-3">
                    <span className="text-white/60 text-sm">Skills:</span>
                    <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500 [&>option]:bg-slate-900">
                      <option value="">All Skills</option>
                      <option value="developer">Developer</option>
                      <option value="designer">Designer</option>
                      <option value="photographer">Photographer</option>
                    </select>
                  </div>

                  {/* Online Only */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500" />
                    <span className="text-white/60 text-sm">Online only</span>
                  </label>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div>
          {mapView === 'map' ? (
            <div className="relative">
              {/* Map Container */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative h-[600px] rounded-3xl overflow-hidden glass-panel border border-white/10"
              >
                <div ref={mapRef} className="w-full h-full" />
                
                {/* Map Loading State */}
                {locationLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="text-white flex items-center gap-3">
                      <Navigation className="w-5 h-5 animate-pulse text-blue-400" />
                      <span>Getting your location...</span>
                    </div>
                  </div>
                )}

                {/* Selected User Card */}
                <AnimatePresence>
                  {selectedUser && (
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: -20, opacity: 0 }}
                      className="absolute left-4 top-4 w-80 glass-panel rounded-2xl p-4 shadow-2xl border border-white/20"
                    >
                      <button
                        onClick={() => setSelectedUser(null)}
                        className="absolute right-2 top-2 p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4 text-white/60" />
                      </button>
                      
                      <div className="flex items-start gap-3">
                        <img 
                          src={selectedUser.avatar} 
                          alt={selectedUser.name}
                          className="w-14 h-14 rounded-xl object-cover border border-white/10"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-bold truncate">{selectedUser.name}</h3>
                          <p className="text-white/60 text-xs truncate">{selectedUser.profession}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <MapPin className="w-3 h-3 text-blue-400" />
                            <span className="text-xs text-white/40">{selectedUser.distance} km away</span>
                            {selectedUser.isOnline && (
                              <span className="w-2 h-2 rounded-full bg-green-500" />
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {selectedUser.skills.slice(0, 3).map(skill => (
                          <span key={skill} className="px-2 py-0.5 bg-white/5 border border-white/10 text-white/70 text-[10px] rounded-full">
                            {skill}
                          </span>
                        ))}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        <button className="btn-primary py-2 text-xs">
                          Connect
                        </button>
                        <button className="btn-secondary py-2 text-xs">
                          Profile
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Location Permission Error */}
                {locationError && (
                  <div className="absolute bottom-4 left-4 right-4 glass-panel rounded-xl p-4 border border-red-500/30 bg-red-500/10">
                    <p className="text-red-400 text-sm flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
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
                  className="glass-panel rounded-2xl p-4 text-center"
                >
                  <Users className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">{nearbyUsers.length}</p>
                  <p className="text-white/40 text-xs uppercase tracking-wider">Nearby</p>
                </motion.div>
                
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="glass-panel rounded-2xl p-4 text-center"
                >
                  <Navigation className="w-6 h-6 text-green-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">{nearbyUsers.filter(u => u.isOnline).length}</p>
                  <p className="text-white/40 text-xs uppercase tracking-wider">Online</p>
                </motion.div>
                
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="glass-panel rounded-2xl p-4 text-center"
                >
                  <MapPin className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">{searchRadius}</p>
                  <p className="text-white/40 text-xs uppercase tracking-wider">km Radius</p>
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
                  className="glass-panel rounded-2xl p-5 hover:border-blue-500/30 transition-all cursor-pointer group"
                  onClick={() => setSelectedUser(user)}
                >
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <img 
                        src={user.avatar} 
                        alt={user.name}
                        className="w-14 h-14 rounded-xl object-cover border border-white/10 group-hover:border-blue-500/30 transition-colors"
                      />
                      {user.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[#0F172A]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-bold truncate group-hover:text-blue-400 transition-colors">{user.name}</h3>
                      <p className="text-white/60 text-sm truncate">{user.profession}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <MapPin className="w-3 h-3 text-blue-400" />
                        <span className="text-xs text-white/40">{user.distance} km</span>
                        <span className="text-xs text-white/20">•</span>
                        <span className="text-xs text-green-400">{user.matchScore}% match</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {user.skills.slice(0, 3).map(skill => (
                      <span key={skill} className="px-2.5 py-1 bg-white/5 border border-white/10 text-white/70 text-xs rounded-full">
                        {skill}
                      </span>
                    ))}
                    {user.skills.length > 3 && (
                      <span className="px-2 py-1 text-white/40 text-xs">+{user.skills.length - 3}</span>
                    )}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <button className="btn-primary w-full py-2.5 text-sm">
                      Connect
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
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
          background: #3B82F6;
          border-radius: 50%;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.8);
        }
        
        .pulse-dot::before {
          content: '';
          position: absolute;
          width: 100%;
          height: 100%;
          background: #3B82F6;
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
          background: rgba(15, 23, 42, 0.95);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          border-radius: 12px;
          padding: 0;
        }
        
        .leaflet-popup-tip {
          background: rgba(15, 23, 42, 0.95);
        }

        .leaflet-container {
          background: #0F172A;
          font-family: inherit;
        }
      `}</style>

      {/* Load Leaflet Script */}
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" async></script>
    </FullScreenLayout>
  );
};
