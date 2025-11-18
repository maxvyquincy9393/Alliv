import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Briefcase, GraduationCap, Target, Edit3, Globe } from 'lucide-react';
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
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl">
            <p className="mb-6 text-lg font-medium text-white">{error || 'Profile not found'}</p>
            <button
              onClick={() => navigate('/setup-profile')}
              className="rounded-full bg-white px-6 py-3 text-sm font-bold text-black transition hover:bg-gray-200"
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
      <div className="container-width pb-24 pt-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header Section */}
          <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#0b0b0f]/80 p-6 shadow-2xl backdrop-blur-xl md:p-10">
            <div className="flex flex-col gap-8 md:flex-row md:items-start">
              {/* Main Photo */}
              <div className="relative shrink-0">
                <div className="h-40 w-40 overflow-hidden rounded-[24px] border-2 border-white/10 shadow-2xl md:h-52 md:w-52">
                  <img src={mainPhoto} alt={profile.name} className="h-full w-full object-cover" />
                </div>
                <button
                  onClick={() => navigate('/setup-profile')}
                  className="absolute -bottom-3 -right-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-black shadow-lg transition hover:scale-110"
                >
                  <Edit3 size={18} />
                </button>
              </div>

              {/* Info */}
              <div className="flex-1 space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-white md:text-5xl">
                      {profile.name}
                      {profile.age && <span className="ml-3 text-2xl font-normal text-white/40">{profile.age}</span>}
                    </h1>
                  </div>
                  <p className="mt-2 text-lg text-white/60">{profile.role || 'Member'} {profile.company && `at ${profile.company}`}</p>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-white/50">
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
                  <p className="max-w-2xl text-base leading-relaxed text-white/80">
                    {profile.bio}
                  </p>
                )}

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    onClick={() => navigate('/discover')}
                    className="rounded-full border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
                  >
                    Find Collaborators
                  </button>
                  <button
                    onClick={() => navigate('/connections')}
                    className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg transition hover:shadow-blue-500/25"
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
                  className="aspect-[3/4] overflow-hidden rounded-[24px] border border-white/10 bg-white/5"
                >
                  <img src={photo} alt={`Gallery ${index}`} className="h-full w-full object-cover transition duration-500 hover:scale-110" />
                </motion.div>
              ))}
            </section>
          )}

          {/* Details Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Skills & Interests */}
            <section className="space-y-6 rounded-[32px] border border-white/10 bg-[#0b0b0f]/60 p-8 backdrop-blur-md">
              {profile.skills && profile.skills.length > 0 && (
                <div>
                  <div className="mb-4 flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-white/40">
                    <Briefcase size={14} />
                    <span>Expertise</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill) => (
                      <span key={skill} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/90 transition hover:bg-white/10">
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
                      <span key={interest} className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20">
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Goals */}
            {profile.goals && (
              <section className="rounded-[32px] border border-white/10 bg-[#0b0b0f]/60 p-8 backdrop-blur-md">
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
