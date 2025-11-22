/**
 * Nearby Creators Demo Page
 * Showcases the new Leaflet.js map implementation
 */

import { useState } from 'react';
import LeafletMap from '../components/LeafletMap';
import { FullScreenLayout } from '../components/FullScreenLayout';
import { MessageCircle, User as UserIcon, X, MapPin, Zap, Briefcase } from 'lucide-react';

interface User {
  id: string;
  name: string;
  age: number;
  field?: string;
  skill?: string;
  photos?: string[];
  lat?: number;
  lng?: number;
  distance?: number;
  compatibility?: number;
}

export default function NearbyCreators() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [radius, setRadius] = useState(10);

  const handleUserClick = (user: User) => {
    setSelectedUser(user);
  };

  return (
    <FullScreenLayout>
      <div className="min-h-screen py-8 px-4 pt-24 pb-24">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left space-y-2">
              <h1 className="text-4xl md:text-5xl font-bold text-white font-display">
                Nearby Creators
              </h1>
              <p className="text-white/60 text-lg">
                Discover talented creators near you using OpenStreetMap
              </p>
            </div>

            {/* Radius Control */}
            <div className="glass-panel p-6 rounded-2xl min-w-[300px] space-y-4">
              <label htmlFor="radius-slider" className="flex justify-between items-center text-sm font-medium text-white/80">
                <span>Search Radius</span>
                <span className="text-purple-400 font-bold">{radius} km</span>
              </label>
              <input
                id="radius-slider"
                type="range"
                min="1"
                max="50"
                value={radius}
                onChange={(e) => setRadius(parseInt(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>
          </div>

          {/* Map Container */}
          <div className="glass-panel rounded-2xl overflow-hidden border border-white/10 h-[600px] relative shadow-2xl shadow-black/50">
            <LeafletMap
              onUserClick={handleUserClick}
              radius={radius}
              enableGeolocation={true}
              enableRealTimeUpdates={false}
            />
          </div>

          {/* Selected User Card (Modal) */}
          {selectedUser && (
            <div 
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
              onClick={() => setSelectedUser(null)}
            >
              <div 
                className="glass-panel w-full max-w-md rounded-2xl overflow-hidden relative animate-in zoom-in-95 duration-200 shadow-2xl shadow-purple-500/20 border border-purple-500/30"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                  onClick={() => setSelectedUser(null)}
                  aria-label="Close"
                >
                  <X size={20} />
                </button>

                <div className="p-8 flex flex-col items-center gap-6">
                  {/* Avatar */}
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-purple-500 shadow-lg shadow-purple-500/30">
                    {selectedUser.photos?.[0] ? (
                      <img 
                        src={selectedUser.photos[0]} 
                        alt={selectedUser.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 text-white text-4xl font-bold">
                        {selectedUser.name.charAt(0)}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="text-center space-y-2">
                    <h2 className="text-3xl font-bold text-white">
                      {selectedUser.name}, {selectedUser.age}
                    </h2>
                    {selectedUser.skill && (
                      <p className="text-purple-400 font-medium text-lg">{selectedUser.skill}</p>
                    )}
                    {selectedUser.field && (
                      <p className="text-white/60 flex items-center justify-center gap-2">
                        <Briefcase size={16} />
                        {selectedUser.field}
                      </p>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 w-full bg-purple-500/10 rounded-xl p-4 border border-purple-500/20">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                        <MapPin size={24} />
                      </div>
                      <div>
                        <p className="text-xs text-white/60 uppercase tracking-wider font-semibold">Distance</p>
                        <p className="text-lg font-bold text-white">{selectedUser.distance} km</p>
                      </div>
                    </div>
                    {selectedUser.compatibility && (
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-pink-500/20 rounded-lg text-pink-400">
                          <Zap size={24} />
                        </div>
                        <div>
                          <p className="text-xs text-white/60 uppercase tracking-wider font-semibold">Match</p>
                          <p className="text-lg font-bold text-white">{selectedUser.compatibility}%</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 w-full">
                    <button className="btn-secondary flex-1 flex items-center justify-center gap-2 py-3">
                      <MessageCircle size={20} />
                      <span>Message</span>
                    </button>
                    <button className="btn-primary flex-1 flex items-center justify-center gap-2 py-3">
                      <UserIcon size={20} />
                      <span>View Profile</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </FullScreenLayout>
  );
}
