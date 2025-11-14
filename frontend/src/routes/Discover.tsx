import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MapPin, Map, LayoutGrid, Filter, Compass } from 'lucide-react';
import { Layout } from '../components/Layout';
import { MatchModal } from '../components/MatchModal';
import MapsView from '../components/MapsView';
import { useGeolocation } from '../hooks/useGeolocation';
import { useAuth } from '../hooks/useAuth';
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

  const [users, setUsers] = useState<ExtendedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMatch, setShowMatch] = useState(false);
  const [matchedUser, setMatchedUser] = useState<ExtendedUser | null>(null);
  const [mode, setMode] = useState<'online' | 'nearby'>('online');
  const [viewMode, setViewMode] = useState<'cards' | 'map'>(
    (searchParams.get('mode') as 'cards' | 'map') || 'cards'
  );
  const [radius, setRadius] = useState(Number(searchParams.get('radius')) || 10);
  const [onlineOnly, setOnlineOnly] = useState(false);

  const { location, loading: locationLoading } = useGeolocation();
  const userLocation = useMemo(
    () => (location ? { lat: location.latitude, lon: location.longitude } : null),
    [location?.latitude, location?.longitude]
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
        setCurrentIndex(0);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Failed to load users');
        }
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchUsers();
    }

    return () => abortController.abort();
  }, [mode, userLocation, radius, isAuthenticated]);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set('mode', viewMode);
    params.set('radius', radius.toString());
    setSearchParams(params);
  }, [viewMode, radius, setSearchParams]);

  const filteredUsers = useMemo(
    () => (onlineOnly ? users.filter((user) => user.isOnline) : users),
    [users, onlineOnly]
  );

  const mapFriendlyUsers = useMemo(
    () =>
      filteredUsers
        .filter((user) => typeof user.lat === 'number' && typeof user.lng === 'number')
        .map((user) => ({
          ...user,
          location:
            typeof user.location === 'string'
              ? {
                  lat: user.lat ?? 0,
                  lon: user.lng ?? 0,
                  city: user.location,
                }
              : user.location ?? { lat: user.lat ?? 0, lon: user.lng ?? 0 },
        })),
    [filteredUsers]
  );

  const handleSwipe = (decision: 'pass' | 'save') => {
    const currentUser = filteredUsers[currentIndex];
    if (!currentUser) return;

    if (decision === 'save') {
      setMatchedUser(currentUser);
      setShowMatch(true);
    }

    setCurrentIndex((prev) => prev + 1);
  };

  const nearbyLabel = userLocation
    ? `${radius} km | ${locationLoading ? 'Locating...' : 'Location updated'}`
    : 'Enable location for nearby mode';

  const radiusOptions = [5, 10, 25, 50];

  const authIssue = error?.toLowerCase().includes('credential');

  return (
    <Layout>
      <div className="shell-content space-y-8 pb-16">
        <section className="panel p-6 sm:p-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">Discover</p>
              <h1 className="text-3xl font-semibold text-white">Find collaborators by context</h1>
              <p className="text-white/60 text-sm mt-2">
                Switch between live results and nearby matches. Everything syncs with your swipe deck.
              </p>
            </div>
            <div className="glass rounded-full p-1 flex gap-1">
              {(['online', 'nearby'] as const).map((value) => (
                <button
                  key={value}
                  onClick={() => setMode(value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium capitalize ${
                    mode === value ? 'bg-white text-black' : 'text-white/60'
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setViewMode('cards')}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm ${
                viewMode === 'cards'
                  ? 'bg-white text-black'
                  : 'bg-white/5 text-white/70 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              Cards
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm ${
                viewMode === 'map'
                  ? 'bg-white text-black'
                  : 'bg-white/5 text-white/70 hover:text-white'
              }`}
            >
              <Map className="w-4 h-4" />
              Map
            </button>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[320px,minmax(0,1fr)]">
          <aside className="panel p-6 space-y-6">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/40 mb-3">Location</p>
              <div className="flex items-center gap-2 text-sm text-white/70">
                <MapPin className="w-4 h-4" />
                <span>{nearbyLabel}</span>
              </div>
              <div className="mt-4">
                <input
                  type="range"
                  min={5}
                  max={50}
                  step={5}
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="w-full accent-white"
                  disabled={mode !== 'nearby'}
                />
                <div className="flex justify-between text-xs text-white/50 mt-2">
                  {radiusOptions.map((value) => (
                    <button
                      key={value}
                      className={`px-2 py-1 rounded ${
                        radius === value ? 'bg-white/20 text-white' : 'text-white/50'
                      }`}
                      onClick={() => setRadius(value)}
                      disabled={mode !== 'nearby'}
                    >
                      {value}km
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 pt-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/80">Show online only</span>
                <button
                  onClick={() => setOnlineOnly((prev) => !prev)}
                  className={`w-12 h-6 rounded-full p-1 ${
                    onlineOnly ? 'bg-white' : 'bg-white/20'
                  }`}
                >
                  <span
                    className={`block h-4 w-4 rounded-full bg-black transition-transform ${
                      onlineOnly ? 'translate-x-6' : ''
                    }`}
                  />
                </button>
              </div>
              <p className="text-xs text-white/50">
                Filtering only changes what you see. Others can still find you.
              </p>
            </div>

            <div className="border-t border-white/10 pt-6 space-y-2">
              <p className="text-xs uppercase tracking-[0.3em] text-white/40">Queue info</p>
              <p className="text-2xl font-semibold text-white">
                {Math.max(filteredUsers.length - currentIndex, 0)} profiles
              </p>
              <p className="text-sm text-white/60">
                Boost discover to add curated people to your swipe queue.
              </p>
            </div>

            <button
              onClick={() => navigate('/projects')}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 py-3 text-sm text-white hover:bg-white/20"
            >
              <Compass className="w-4 h-4" />
              Explore briefs
            </button>
          </aside>

          <section className="panel p-0 min-h-[520px] overflow-hidden">
            {loading ? (
              <div className="flex h-[520px] items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
                  className="w-14 h-14 border-4 border-white/10 border-t-white rounded-full"
                />
              </div>
            ) : error ? (
              <div className="flex h-[520px] flex-col items-center justify-center text-center px-6 space-y-3">
                <Filter className="w-6 h-6 text-white/50" />
                <p className="text-white font-semibold">Unable to load discover</p>
                <p className="text-white/60 text-sm">{error}</p>
                {authIssue ? (
                  <>
                    <p className="text-xs text-white/50">
                      Your session might have expired. Log back in to refresh your credentials.
                    </p>
                    <button
                      onClick={() => navigate('/login?redirect=/discover')}
                      className="px-5 py-2 text-sm rounded-full bg-white text-black"
                    >
                      Re-authenticate
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setMode((prev) => (prev === 'online' ? 'nearby' : 'online'))}
                    className="px-5 py-2 text-sm rounded-full bg-white text-black"
                  >
                    Try again
                  </button>
                )}
              </div>
            ) : viewMode === 'map' ? (
              <div className="relative h-[520px]">
                <MapsView
                  users={mapFriendlyUsers as any}
                  center={
                    userLocation
                      ? { lat: userLocation.lat, lng: userLocation.lon }
                      : { lat: -6.2088, lng: 106.8456 }
                  }
                  radius={radius}
                  onUserClick={(user) => {
                    const idx = filteredUsers.findIndex((u) => u.id === user.id);
                    if (idx >= 0) {
                      setCurrentIndex(idx);
                      setViewMode('cards');
                    }
                  }}
                />
                {filteredUsers.length === 0 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                    <p className="text-white font-semibold mb-2">No collaborators plotted</p>
                    <p className="text-white/60 text-sm mb-4">
                      Relax your filters or increase the radius to start seeing folks on the map.
                    </p>
                    <button
                      onClick={() => {
                        setOnlineOnly(false);
                        setRadius(25);
                      }}
                      className="px-5 py-2 text-sm rounded-full bg-white text-black"
                    >
                      Reset filters
                    </button>
                  </div>
                )}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex h-[520px] flex-col items-center justify-center text-center px-6">
                <p className="text-white font-semibold mb-2">No collaborators found</p>
                <p className="text-white/60 text-sm mb-4">
                  Relax your filters or increase the radius to see more people.
                </p>
                <button
                  onClick={() => {
                    setOnlineOnly(false);
                    setRadius(25);
                  }}
                  className="px-5 py-2 text-sm rounded-full bg-white text-black"
                >
                  Reset filters
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4 p-6">
                {filteredUsers.slice(currentIndex, currentIndex + 6).map((user) => (
                  <DiscoverCard
                    key={user.id}
                    user={user}
                    onSave={() => handleSwipe('save')}
                    onSkip={() => handleSwipe('pass')}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {showMatch && matchedUser && (
        <MatchModal
          user={matchedUser}
          onClose={() => setShowMatch(false)}
          onSendMessage={() => navigate('/chat')}
        />
      )}
    </Layout>
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
    <div className="panel p-4 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <img
          src={user.avatar}
          alt={user.name}
          className="w-12 h-12 rounded-full object-cover border border-white/10"
        />
        <div className="flex-1">
          <p className="text-white font-semibold">{user.name}</p>
          <p className="text-xs text-white/60">
            {locationLabel} | {user.matchScore ? `${user.matchScore}% match` : 'New'}
          </p>
        </div>
        {user.isOnline && (
          <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-300">
            Online
          </span>
        )}
      </div>
      <p className="text-sm text-white/70 line-clamp-2">{user.bio}</p>
      <div className="flex flex-wrap gap-2 text-xs text-white/70">
        {user.skills.slice(0, 4).map((skill) => (
          <span key={skill} className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
            {skill}
          </span>
        ))}
      </div>
      <div className="flex gap-3 pt-2 text-sm">
        <button
          onClick={onSkip}
          className="flex-1 rounded-full border border-white/15 py-2 text-white/70 hover:text-white"
        >
          Pass
        </button>
        <button onClick={onSave} className="flex-1 rounded-full bg-white text-black py-2 font-medium">
          Save
        </button>
      </div>
    </div>
  );
};
