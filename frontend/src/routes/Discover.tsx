import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, Search, Map, LayoutGrid, Globe, Navigation } from 'lucide-react';
import { FullScreenLayout } from '../components/FullScreenLayout';
import { MatchModal } from '../components/MatchModal';
import MapsView from '../components/MapsView';
import { useGeolocation } from '../hooks/useGeolocation';
import { useAuth } from '../hooks/useAuth';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { discoveryAPI } from '../services/api';
import type { User as ProfileUser } from '../types/user';

interface ExtendedUser extends ProfileUser {
  distance?: number;
  lat?: number;
  lng?: number;
  isOnline?: boolean;
  matchScore?: number;
}

export const Discover = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isMobile } = useBreakpoint();
  const initialRadius = Number(searchParams.get('radius')) || 10;

  const [users, setUsers] = useState<ExtendedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'online' | 'nearby'>('online');
  const [viewMode, setViewMode] = useState<'cards' | 'map'>(
    (searchParams.get('mode') as 'cards' | 'map') || 'cards'
  );
  const [radius, setRadius] = useState(initialRadius);
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [matchedUser, setMatchedUser] = useState<ExtendedUser | null>(null);
  const [showMatch, setShowMatch] = useState(false);

  const { location, loading: locationLoading } = useGeolocation();
  const userLocation = useMemo(
    () => (location ? { lat: location.latitude, lon: location.longitude } : null),
    [location?.latitude, location?.longitude]
  );

  const mapCenter = useMemo(
    () =>
      userLocation
        ? { lat: userLocation.lat, lng: userLocation.lon }
        : { lat: -6.2088, lng: 106.8456 },
    [userLocation]
  );

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/discover', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const abortController = new AbortController();

    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);

        let response;
        if (mode === 'nearby' && userLocation) {
          response = await discoveryAPI.discoverNearby(
            { lat: userLocation.lat, lon: userLocation.lon, radiusKm: radius, limit: 20 },
            abortController.signal
          );
        } else {
          response = await discoveryAPI.discoverOnline({ limit: 20 }, abortController.signal);
        }

        if (response.error) {
          if (response.error !== 'Request cancelled') {
            throw new Error(response.error);
          }
          return;
        }

        const fetchedUsers = response.data?.users || [];
        setUsers(
          fetchedUsers.map((user: any) => ({
            ...user,
            lat: user.location?.lat,
            lng: user.location?.lon,
            distance: user.distance,
            isOnline: user.isOnline ?? false,
            matchScore: user.compatibility ?? 0,
          }))
        );
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Failed to load profiles');
        }
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchUsers();
    }

    return () => abortController.abort();
  }, [isAuthenticated, mode, radius, userLocation?.lat, userLocation?.lon]);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set('mode', viewMode);
    params.set('radius', radius.toString());
    setSearchParams(params);
  }, [viewMode, radius, setSearchParams]);

  useEffect(() => {
    if (isMobile && viewMode === 'map') {
      setViewMode('cards');
    }
  }, [isMobile, viewMode]);

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return users.filter((user) => {
      if (onlineOnly && !user.isOnline) return false;
      if (mode === 'nearby' && typeof user.distance === 'number' && user.distance > radius) {
        return false;
      }
      if (query) {
        const haystack = `${user.name ?? ''} ${user.bio ?? ''} ${(user.skills ?? []).join(' ')}`.toLowerCase();
        if (!haystack.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [users, onlineOnly, mode, radius, searchQuery]);

  const onlineCount = useMemo(
    () => filteredUsers.filter((user) => user.isOnline).length,
    [filteredUsers]
  );

  const mapFriendlyUsers = useMemo(() => {
    const offsetStep = 0.02;
    return filteredUsers.map((user, index) => {
      const fallbackLat = mapCenter.lat + Math.sin(index) * offsetStep;
      const fallbackLng = mapCenter.lng + Math.cos(index) * offsetStep;
      const lat =
        typeof user.lat === 'number'
          ? user.lat
          : typeof user.location === 'object' && typeof (user.location as any)?.lat === 'number'
          ? (user.location as any).lat
          : fallbackLat;
      const lng =
        typeof user.lng === 'number'
          ? user.lng
          : typeof user.location === 'object' && typeof (user.location as any)?.lon === 'number'
          ? (user.location as any).lon
          : fallbackLng;

      return {
        ...user,
        lat,
        lng,
        location:
          typeof user.location === 'string'
            ? { lat, lon: lng, city: user.location }
            : user.location ?? { lat, lon: lng },
      };
    });
  }, [filteredUsers, mapCenter]);

  const handleSaveUser = (user: ExtendedUser) => {
    setMatchedUser(user);
    setShowMatch(true);
  };

  const handleSkipUser = (id: string) => {
    setUsers((prev) => prev.filter((user) => user.id !== id));
  };

  return (
    <FullScreenLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-24 md:pb-8">
        <section className="glass-panel rounded-3xl p-6 md:p-8 space-y-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <p className="text-xs font-bold uppercase tracking-widest text-white/50">Discovery Radar</p>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white font-display">Find your co-founder</h1>
              <p className="text-white/60 max-w-xl">
                Connect with developers, designers, and visionaries who share your passion.
              </p>
            </div>
            
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  viewMode === 'cards' ? 'bg-white/10 text-white shadow-sm' : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                <LayoutGrid size={16} />
                Cards
              </button>
              <button
                onClick={() => !isMobile && setViewMode('map')}
                disabled={isMobile}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  viewMode === 'map' ? 'bg-white/10 text-white shadow-sm' : 'text-white/50 hover:text-white hover:bg-white/5'
                } ${isMobile ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Map size={16} />
                Map
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-t border-white/5 pt-6">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <button
                onClick={() => setMode('online')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                  mode === 'online' 
                    ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' 
                    : 'bg-transparent border-white/10 text-white/60 hover:border-white/30 hover:text-white'
                }`}
              >
                <Globe size={14} />
                Global Online
              </button>
              <button
                onClick={() => setMode('nearby')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                  mode === 'nearby'
                    ? 'bg-purple-500/10 border-purple-500/50 text-purple-400'
                    : 'bg-transparent border-white/10 text-white/60 hover:border-white/30 hover:text-white'
                }`}
              >
                <Navigation size={14} />
                Nearby
              </button>
              
              <div className="h-6 w-px bg-white/10 mx-2 hidden md:block" />
              
              <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer select-none hover:text-white transition-colors">
                <input
                  type="checkbox"
                  checked={onlineOnly}
                  onChange={(e) => setOnlineOnly(e.target.checked)}
                  className="rounded border-white/30 bg-white/5 text-blue-500 focus:ring-blue-500/50 focus:ring-offset-0"
                />
                Online only
              </label>
            </div>

            <div className="relative w-full md:w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, skill, city..."
                className="input-modern pl-10 py-2.5 text-sm"
              />
            </div>
          </div>

          {mode === 'nearby' && (
            <div className="bg-white/5 rounded-xl p-4 space-y-3 border border-white/5">
              <div className="flex justify-between text-sm">
                <span className="text-white/70">Search Radius</span>
                <span className="font-medium text-white">{radius} km</span>
              </div>
              <input
                type="range"
                min={5}
                max={100}
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-xs text-white/30">
                <span>5km</span>
                <span>100km</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
              <p className="text-xs uppercase tracking-wider text-white/40 mb-1">Matches Found</p>
              <p className="text-2xl font-bold text-white">{filteredUsers.length}</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
              <p className="text-xs uppercase tracking-wider text-white/40 mb-1">Online Now</p>
              <p className="text-2xl font-bold text-white">{onlineCount}</p>
            </div>
          </div>
        </section>

        <section>
          {loading || locationLoading ? (
            <div className="flex h-64 flex-col items-center justify-center gap-4 text-white/50">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <p className="text-sm font-medium">Scanning network...</p>
            </div>
          ) : error ? (
            <div className="glass-panel rounded-2xl p-8 text-center">
              <p className="text-red-400 mb-2">Unable to load profiles</p>
              <p className="text-sm text-white/40">{error}</p>
            </div>
          ) : viewMode === 'map' ? (
            <div className="glass-panel rounded-3xl overflow-hidden border border-white/10 h-[500px] md:h-[600px]">
              <MapsView
                users={mapFriendlyUsers}
                center={mapCenter}
                radius={radius}
                onUserClick={(user) => {
                  setMatchedUser(user as ExtendedUser);
                  setShowMatch(true);
                }}
              />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="glass-panel rounded-3xl p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto">
                <Search className="w-8 h-8 text-white/20" />
              </div>
              <h3 className="text-xl font-semibold text-white">No matches found</h3>
              <p className="text-white/50 max-w-md mx-auto">
                Try adjusting your filters or expanding your search radius to find more people.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setOnlineOnly(false);
                  setRadius(50);
                }}
                className="btn-secondary inline-flex"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredUsers.slice(0, 9).map((user) => (
                <DiscoverCard
                  key={user.id}
                  user={user}
                  onSave={() => handleSaveUser(user)}
                  onSkip={() => handleSkipUser(user.id)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {showMatch && matchedUser && (
        <MatchModal
          user={matchedUser}
          onClose={() => {
            setShowMatch(false);
            setMatchedUser(null);
          }}
          onSendMessage={() => navigate('/chat')}
        />
      )}
    </FullScreenLayout>
  );
};

interface DiscoverCardProps {
  user: ExtendedUser;
  onSave: () => void;
  onSkip: () => void;
}

const DiscoverCard = ({ user, onSave, onSkip }: DiscoverCardProps) => {
  const locationLabel =
    typeof user.location === 'string'
      ? user.location
      : user.location?.city || (user.distance ? `${Math.round(user.distance)} km away` : 'Unknown location');

  return (
    <div className="glass-panel rounded-3xl p-5 flex flex-col gap-5 group hover:border-white/20 transition-colors">
      <div className="flex items-start gap-4">
        <div className="relative">
          <img
            src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
            alt={user.name}
            className="h-14 w-14 rounded-2xl object-cover border border-white/10 shadow-lg"
          />
          {user.isOnline && (
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-[#0A0F1C]" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <h3 className="font-bold text-lg text-white truncate pr-2">{user.name}</h3>
            {user.matchScore && (
              <span className="text-xs font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded-full">
                {user.matchScore}%
              </span>
            )}
          </div>
          <p className="text-xs text-white/50 truncate flex items-center gap-1 mt-0.5">
            <Navigation size={10} /> {locationLabel}
          </p>
        </div>
      </div>
      
      <p className="text-sm text-white/70 line-clamp-2 leading-relaxed h-10">
        {user.bio || "No bio provided yet."}
      </p>
      
      <div className="flex flex-wrap gap-2">
        {(user.skills || []).slice(0, 3).map((skill) => (
          <span key={skill} className="chip text-xs py-1 px-2.5">
            {skill}
          </span>
        ))}
        {(user.skills?.length || 0) > 3 && (
          <span className="text-xs text-white/40 py-1 px-1">+{user.skills!.length - 3}</span>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-3 pt-2 mt-auto">
        <button
          onClick={onSkip}
          className="btn-secondary text-sm py-2.5"
        >
          Skip
        </button>
        <button
          onClick={onSave}
          className="btn-primary text-sm py-2.5"
        >
          Connect
        </button>
      </div>
    </div>
  );
};
