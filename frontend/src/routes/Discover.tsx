import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, Search } from 'lucide-react';
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
      <div className="shell-content space-y-5 pb-12">
        <section className="panel space-y-3 p-5">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-white/50">Discover</p>
              <h1 className="text-3xl font-semibold text-white">Minimal radar, max function</h1>
              <p className="text-sm text-white/60">
                Toggle between cards and map, set your radius, and focus on collaborators that fit.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(['cards', 'map'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  disabled={isMobile && option === 'map'}
                  onClick={() => {
                    if (isMobile && option === 'map') return;
                    setViewMode(option);
                  }}
                  title={isMobile && option === 'map' ? 'Map view works best on larger screens' : undefined}
                  className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                    viewMode === option ? 'bg-white text-black' : 'border-white/20 text-white/70'
                  } ${isMobile && option === 'map' ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  {option === 'cards' ? 'Card view' : 'Map view'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {(['online', 'nearby'] as const).map((option) => (
              <button
                key={option}
                onClick={() => setMode(option)}
                className={`rounded-full px-4 py-2 text-sm transition-all ${
                  mode === option ? 'bg-white text-black shadow-[0_4px_16px_rgba(255,255,255,0.3)]' : 'bg-white/8 text-white/70 hover:bg-white/12 shadow-[0_2px_8px_rgba(0,0,0,0.25)]'
                }`}
              >
                {option === 'online' ? 'Global online' : 'Nearby radius'}
              </button>
            ))}
            <label className="flex items-center gap-2 text-sm text-white/70">
              <input
                type="checkbox"
                checked={onlineOnly}
                onChange={(e) => setOnlineOnly(e.target.checked)}
                className="h-4 w-4 rounded border-white/30 bg-transparent"
              />
              Online only
            </label>
          </div>

          {mode === 'nearby' && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-white/60">
                <span>Radius</span>
                <span>{radius} km</span>
              </div>
              <input
                type="range"
                min={5}
                max={100}
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-full accent-white"
              />
            </div>
          )}

          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, skill, or city"
              className="w-full rounded-2xl bg-white/5 py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/50 shadow-[inset_0_1px_2px_rgba(255,255,255,0.05),0_4px_12px_rgba(0,0,0,0.25)] focus:shadow-[inset_0_1px_2px_rgba(255,255,255,0.08),0_6px_18px_rgba(0,0,0,0.35)] focus:outline-none transition-all"
            />
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm text-white/70">
            <div className="rounded-2xl bg-white/5 px-4 py-3 shadow-[inset_0_1px_2px_rgba(255,255,255,0.05),0_4px_12px_rgba(0,0,0,0.25)]">
              <p className="text-xs uppercase tracking-[0.3em] text-white/40">Results</p>
              <p className="text-2xl font-semibold text-white">{filteredUsers.length}</p>
            </div>
            <div className="rounded-2xl bg-white/5 px-4 py-3 shadow-[inset_0_1px_2px_rgba(255,255,255,0.05),0_4px_12px_rgba(0,0,0,0.25)]">
              <p className="text-xs uppercase tracking-[0.3em] text-white/40">Online now</p>
              <p className="text-2xl font-semibold text-white">{onlineCount}</p>
            </div>
          </div>
        </section>

        <section className="panel p-0">
          {loading || locationLoading ? (
            <div className="flex h-[360px] flex-col items-center justify-center gap-2.5 text-white/70">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="text-sm">Loading profiles...</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center text-sm text-red-200">{error}</div>
          ) : viewMode === 'map' ? (
            <div className={isMobile ? 'h-[340px]' : 'h-[460px]'}>
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
            <div className="flex h-[360px] flex-col items-center justify-center gap-3 text-center text-white/60">
              <p>No profiles match these filters yet.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setOnlineOnly(false);
                }}
                className="rounded-full bg-white/8 px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-white/12 shadow-[0_4px_12px_rgba(0,0,0,0.25)] transition-all"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
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
      : user.location?.city || (user.distance ? `${user.distance} km away` : 'Unknown');

  return (
    <div className="panel flex flex-col gap-4 p-4">
      <div className="flex items-center gap-3">
        <img
          src={user.avatar}
          alt={user.name}
          className="h-12 w-12 rounded-full object-cover shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
        />
        <div className="flex-1">
          <p className="font-semibold text-white">{user.name}</p>
          <p className="text-xs text-white/60">
            {locationLabel} | {user.matchScore ? `${user.matchScore}% match` : 'New'}
          </p>
        </div>
        {user.isOnline && (
          <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-white shadow-[0_2px_8px_rgba(0,0,0,0.25)]">Online</span>
        )}
      </div>
      <p className="text-sm text-white/70 line-clamp-2">{user.bio}</p>
      <div className="flex flex-wrap gap-2 text-xs text-white/70">
        {(user.skills || []).slice(0, 4).map((skill) => (
          <span key={skill} className="rounded-full bg-white/8 px-3 py-1 shadow-[0_2px_6px_rgba(0,0,0,0.2)]">
            {skill}
          </span>
        ))}
      </div>
      <div className="flex gap-3 pt-2 text-sm">
        <button
          onClick={onSkip}
          className="flex-1 rounded-full bg-white/8 py-2 text-white/70 hover:text-white hover:bg-white/12 shadow-[0_2px_8px_rgba(0,0,0,0.25)] transition-all"
        >
          Skip
        </button>
        <button
          onClick={onSave}
          className="flex-1 rounded-full bg-white py-2 font-medium text-black shadow-[0_4px_12px_rgba(255,255,255,0.3)] transition-transform hover:-translate-y-0.5"
        >
          Save
        </button>
      </div>
    </div>
  );
};
