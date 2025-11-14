import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { GlassButton } from '../../components/GlassButton';
import { Loader } from '../../components/Loader';
import { fadeInUp, stagger } from '../../lib/motion';
import { useRegistrationStore } from '../../store/registration';
import { getUserLocation } from '../../lib/geo';
import type { UserLocation } from '../../types/profile';

export const Location = () => {
  const navigate = useNavigate();
  const { data, setData } = useRegistrationStore();
  const [location, setLocation] = useState<UserLocation | null>(data.location || null);
  const [hideExact, setHideExact] = useState(data.location?.hideExact || false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [manualCity, setManualCity] = useState(data.location?.city || '');
  const [manualCountry, setManualCountry] = useState(data.location?.country || '');
  const [useManual, setUseManual] = useState(false);

  const handleGetLocation = async () => {
    setLoading(true);
    setError('');
    try {
      const userLocation = await getUserLocation();
      setLocation(userLocation);
      setManualCity(userLocation.city);
      setManualCountry(userLocation.country);
      setUseManual(false);
    } catch (err) {
      setError('Failed to get location. Please enter manually.');
      setUseManual(true);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    const finalLocation: UserLocation = useManual
      ? {
          city: manualCity,
          country: manualCountry,
          lat: 0,
          lon: 0,
          hideExact: true,
        }
      : {
          ...location!,
          hideExact,
        };

    setData({ location: finalLocation });
    navigate('/register/summary');
  };

  const isValid = () => {
    if (useManual) {
      return manualCity.trim() && manualCountry.trim();
    }
    return location !== null;
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <motion.div
        variants={stagger(0.1)}
        initial="hidden"
        animate="show"
        className="max-w-2xl w-full"
      >
        {/* Header */}
        <motion.div variants={fadeInUp} className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-3">Your Location</h1>
          <p className="text-white/60">
            Help others find collaborators nearby
          </p>
        </motion.div>

        {/* Content */}
        <motion.div variants={fadeInUp} className="glass-card rounded-2xl p-8 space-y-6">
          {!location && !useManual ? (
            // Initial state
            <div className="text-center space-y-6">
              <div className="w-20 h-20 mx-auto rounded-full glass-strong flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-accent-blue"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Share Your Location
                </h3>
                <p className="text-white/60 text-sm">
                  We'll use this to show you collaborators nearby and calculate
                  distances. You can hide exact coordinates later.
                </p>
              </div>

              {error && (
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/50 rounded-xl px-4 py-2">
                  {error}
                </p>
              )}

              <div className="space-y-3">
                <GlassButton
                  variant="primary"
                  fullWidth
                  onClick={handleGetLocation}
                  loading={loading}
                >
                  {loading ? <Loader /> : 'Allow Location Access'}
                </GlassButton>

                <button
                  onClick={() => setUseManual(true)}
                  className="w-full text-accent-blue hover:text-accent-blue-light text-sm font-medium transition-colors"
                >
                  Enter location manually
                </button>
              </div>
            </div>
          ) : useManual ? (
            // Manual input
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  value={manualCity}
                  onChange={(e) => setManualCity(e.target.value)}
                  className="w-full px-4 py-3 glass rounded-xl text-white placeholder-white/30 focus:ring-2 focus:ring-accent-blue/50 transition-all"
                  placeholder="e.g., San Francisco"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Country *
                </label>
                <input
                  type="text"
                  value={manualCountry}
                  onChange={(e) => setManualCountry(e.target.value)}
                  className="w-full px-4 py-3 glass rounded-xl text-white placeholder-white/30 focus:ring-2 focus:ring-accent-blue/50 transition-all"
                  placeholder="e.g., United States"
                />
              </div>

              <button
                onClick={() => {
                  setUseManual(false);
                  setError('');
                }}
                className="text-accent-blue hover:text-accent-blue-light text-sm font-medium transition-colors"
              >
                ← Use automatic location instead
              </button>
            </div>
          ) : (
            // Location confirmed
            <div className="space-y-6">
              <div className="flex items-start gap-4 p-4 glass rounded-xl">
                <div className="w-12 h-12 rounded-full bg-accent-blue/10 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-accent-blue"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-white mb-1">
                    {location?.city}, {location?.country}
                  </h4>
                  <p className="text-sm text-white/60">
                    Lat: {location?.lat.toFixed(4)}, Lon: {location?.lon.toFixed(4)}
                  </p>
                </div>
                <button
                  onClick={handleGetLocation}
                  className="text-accent-blue hover:text-accent-blue-light text-sm font-medium transition-colors"
                >
                  Change
                </button>
              </div>

              {/* Privacy Options */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-white/70">
                  Privacy Settings
                </h4>

                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={hideExact}
                    onChange={(e) => setHideExact(e.target.checked)}
                    className="mt-1 w-5 h-5 rounded border-2 border-white/20 bg-transparent checked:bg-accent-blue checked:border-accent-blue focus:ring-2 focus:ring-accent-blue/50 cursor-pointer"
                  />
                  <div>
                    <p className="text-white/80 group-hover:text-white transition-colors">
                      Hide exact location
                    </p>
                    <p className="text-xs text-white/50 mt-1">
                      Only show city and country. Exact coordinates won't be
                      visible to others.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}
        </motion.div>

        {/* Navigation */}
        <motion.div variants={fadeInUp} className="mt-6 flex gap-4">
          <GlassButton
            variant="secondary"
            onClick={() => navigate('/register/interests')}
            fullWidth
          >
            Back
          </GlassButton>
          <GlassButton
            variant="primary"
            onClick={handleContinue}
            disabled={!isValid()}
            fullWidth
          >
            Continue
          </GlassButton>
        </motion.div>
      </motion.div>
    </div>
  );
};
