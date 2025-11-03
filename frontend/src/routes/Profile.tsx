import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

interface UserProfile {
  name: string;
  age: number;
  bio: string;
  skills: string[];
  interests: string[];
  goals?: string;
  photos: string[];
  email: string;
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
      const token = api.getToken();
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:8000/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load profile');
      }

      const data = await response.json();
      setProfile(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-black"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-black mb-2">
            {error || 'Profile not found'}
          </h2>
          <button
            onClick={() => navigate('/setup-profile')}
            className="mt-4 px-6 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
          >
            Complete Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-black">Alliv</h1>
          <div className="flex gap-4">
            <button
              onClick={() => navigate('/discover')}
              className="px-4 py-2 text-gray-600 hover:text-black transition-colors"
            >
              Discover
            </button>
            <button
              onClick={() => navigate('/setup-profile')}
              className="px-4 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
            >
              Edit Profile
            </button>
          </div>
        </div>
      </header>

      {/* Profile Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl overflow-hidden shadow-sm"
        >
          {/* Photos Gallery */}
          {profile.photos && profile.photos.length > 0 && (
            <div className="grid grid-cols-3 gap-1">
              {profile.photos.map((photo, index) => (
                <div
                  key={index}
                  className="aspect-square bg-gray-100 overflow-hidden"
                >
                  <img
                    src={photo}
                    alt={`${profile.name} - Photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Profile Info */}
          <div className="p-8">
            {/* Name & Age */}
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-black mb-1">
                {profile.name}
                {profile.age && (
                  <span className="text-gray-500 font-normal ml-2">
                    {profile.age}
                  </span>
                )}
              </h2>
              <p className="text-gray-600">{profile.email}</p>
            </div>

            {/* Bio */}
            {profile.bio && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-black mb-2">About</h3>
                <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
              </div>
            )}

            {/* Skills */}
            {profile.skills && profile.skills.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-black mb-3">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-4 py-2 bg-black text-white rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Interests */}
            {profile.interests && profile.interests.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-black mb-3">Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest) => (
                    <span
                      key={interest}
                      className="px-4 py-2 bg-gray-100 text-black rounded-full text-sm"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Goals */}
            {profile.goals && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-black mb-2">Goals</h3>
                <p className="text-gray-700 leading-relaxed">{profile.goals}</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Actions */}
        <div className="mt-6 flex gap-4 justify-center">
          <button
            onClick={() => navigate('/discover')}
            className="px-8 py-3 bg-black text-white font-semibold rounded-full hover:bg-gray-800 transition-colors"
          >
            Start Discovering
          </button>
        </div>
      </div>
    </div>
  );
};
