import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Briefcase, GraduationCap, Target, Edit3, Globe, ShieldCheck } from 'lucide-react';
import api from '../services/api';
import { FullScreenLayout } from '../components/FullScreenLayout';

interface UserProfile {
  name: string;
  age?: number;
  bio?: string;
  skills?: string[];
  interests?: string[];
  goals?: string;
  photos?: string[];
  email?: string;
  location?: { city: string; country: string };
  role?: string;
  company?: string;
  avatar?: string;
  trustScore?: number;
}

export const Profile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await api.profile.getMe();

      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data) {
        setProfile(response.data);
      }
    } catch (err: any) {
      console.error('Profile load error:', err);
      setError(err.message || 'Failed to load profile');
      if (err.message?.includes('401')) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <FullScreenLayout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-blue-500" />
        </div>
      </FullScreenLayout>
    );
  }

  if (error || !profile) {
    return (
      <FullScreenLayout>
        <div className="flex min-h-screen items-center justify-center p-6">
          <div className="glass-panel w-full max-w-md rounded-3xl p-8 text-center">
            <p className="mb-6 text-lg font-medium text-white">{error || 'Profile not found'}</p>
            <button
              onClick={() => navigate('/setup-profile')}
              className="btn-primary"
            >
              Complete Profile
            </button>
          </div>
        </div>
      </FullScreenLayout>
    );
  }

  const photos = profile.photos || [];
  const mainPhoto = photos[0] || profile.avatar || 'https://via.placeholder.com/400';
  const secondaryPhotos = photos.slice(1);

  return (
    <FullScreenLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header Section */}
          <section className="glass-panel rounded-3xl p-6 md:p-10 relative overflow-hidden">
            <div className="flex flex-col gap-8 md:flex-row md:items-start relative z-10">
              {/* Main Photo */}
              <div className="relative shrink-0 mx-auto md:mx-0">
                <div className="h-40 w-40 overflow-hidden rounded-3xl border-2 border-white/10 shadow-2xl md:h-52 md:w-52">
                  <img src={mainPhoto} alt={profile.name} className="h-full w-full object-cover" />
                </div>
                <button
                  onClick={() => navigate('/setup-profile')}
                  className="absolute -bottom-3 -right-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-black shadow-lg transition hover:scale-110 hover:bg-blue-50"
                >
                  <Edit3 size={18} />
                </button>
              </div>

              {/* Info */}
              <div className="flex-1 space-y-5 text-center md:text-left">
                <div>
                  <div className="flex flex-col md:flex-row items-center md:justify-between gap-2">
                    <h1 className="text-3xl font-bold text-white md:text-5xl font-display tracking-tight">
                      {profile.name}
                      {profile.age && <span className="ml-3 text-2xl font-normal text-white/40">{profile.age}</span>}
                    </h1>
                    
                    {/* Trust Score Badge */}
                    {profile.trustScore !== undefined && (
                      <div className="flex items-center gap-3 bg-white/5 rounded-full px-4 py-1.5 border border-white/10">
                        <ShieldCheck size={16} className="text-green-400" />
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-bold text-white">{profile.trustScore}</span>
                          <span className="text-xs text-white/40">/100</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-lg text-white/60">{profile.role || 'Member'} {profile.company && `at ${profile.company}`}</p>
                </div>

                <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-white/50">
                  {profile.location && (
                    <div className="flex items-center gap-1.5">
                      <MapPin size={14} />
                      <span>{profile.location.city}, {profile.location.country}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Globe size={14} />
                    <span>{profile.email}</span>
                  </div>
                </div>

                {profile.bio && (
                  <p className="max-w-2xl text-base leading-relaxed text-white/80 mx-auto md:mx-0">
                    {profile.bio}
                  </p>
                )}

                <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-2">
                  <button
                    onClick={() => navigate('/discover')}
                    className="btn-secondary px-6"
                  >
                    Find Collaborators
                  </button>
                  <button
                    onClick={() => navigate('/connections')}
                    className="btn-primary px-6 shadow-lg shadow-blue-500/20"
                  >
                    View Connections
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Photos Grid */}
          {secondaryPhotos.length > 0 && (
            <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {secondaryPhotos.map((photo, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="aspect-[3/4] overflow-hidden rounded-3xl border border-white/10 bg-white/5 group"
                >
                  <img src={photo} alt={`Gallery ${index}`} className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
                </motion.div>
              ))}
            </section>
          )}

          {/* Details Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Skills & Interests */}
            <section className="glass-panel rounded-3xl p-8 space-y-8">
              {profile.skills && profile.skills.length > 0 && (
                <div>
                  <div className="mb-4 flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-white/40">
                    <Briefcase size={14} />
                    <span>Expertise</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill) => (
                      <span key={skill} className="chip">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profile.interests && profile.interests.length > 0 && (
                <div>
                  <div className="mb-4 flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-white/40">
                    <Target size={14} />
                    <span>Interests</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profile.interests.map((interest) => (
                      <span key={interest} className="chip bg-white/10 border-transparent hover:bg-white/20">
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Goals */}
            {profile.goals && (
              <section className="glass-panel rounded-3xl p-8">
                <div className="mb-4 flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-white/40">
                  <GraduationCap size={14} />
                  <span>Current Goals</span>
                </div>
                <p className="text-lg leading-relaxed text-white/80">
                  {profile.goals}
                </p>
              </section>
            )}
          </div>
        </motion.div>
      </div>
    </FullScreenLayout>
  );
};
