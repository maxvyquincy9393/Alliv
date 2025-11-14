import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Layout } from '../components/Layout';

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
      <Layout>
        <div className="shell-content flex min-h-screen items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/20 border-t-white" />
        </div>
      </Layout>
    );
  }

  if (error || !profile) {
    return (
      <Layout>
        <div className="shell-content min-h-screen flex items-center justify-center">
          <div className="panel p-6 text-center space-y-3">
            <p className="text-white font-semibold text-lg">{error || 'Profile not found'}</p>
            <button
              onClick={() => navigate('/setup-profile')}
              className="rounded-full bg-white text-black px-5 py-2 text-sm font-semibold"
            >
              Complete profile
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const photos = profile.photos || [];
  const mainPhoto = photos[0];
  const secondaryPhotos = photos.slice(1);

  return (
    <Layout>
      <div className="shell-content space-y-8 pb-16">
        <section className="panel p-6 sm:p-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Profile</p>
            <h1 className="text-3xl font-semibold text-white">
              {profile.name}
              {profile.age ? <span className="text-white/60 font-normal ml-2">{profile.age}</span> : null}
            </h1>
            <p className="text-white/60 text-sm">{profile.email}</p>
            {profile.bio && <p className="text-white/70 text-sm leading-relaxed">{profile.bio}</p>}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate('/discover')}
                className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/80 hover:text-white"
              >
                Browse collaborators
              </button>
              <button
                onClick={() => navigate('/setup-profile')}
                className="rounded-full bg-white text-black px-4 py-2 text-sm font-semibold"
              >
                Edit profile
              </button>
            </div>
          </div>
          {mainPhoto && (
            <div className="w-full md:w-1/2 rounded-[32px] overflow-hidden border border-white/10 shadow-[0_25px_45px_rgba(2,6,23,0.45)]">
              <img src={mainPhoto} alt={profile.name} className="w-full h-full object-cover" />
            </div>
          )}
        </section>

        {secondaryPhotos.length > 0 && (
          <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {secondaryPhotos.map((photo, index) => (
              <div
                key={photo + index}
                className="aspect-[4/5] rounded-[28px] overflow-hidden border border-white/10 bg-white/5"
              >
                <img src={photo} alt={`${profile.name} photo ${index + 2}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </section>
        )}

        <section className="grid gap-6 md:grid-cols-2">
          {profile.skills?.length ? (
            <InfoBlock title="Skills">
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/80"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </InfoBlock>
          ) : null}

          {profile.interests?.length ? (
            <InfoBlock title="Interests">
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((interest) => (
                  <span key={interest} className="rounded-full bg-white text-black px-4 py-2 text-sm font-semibold">
                    {interest}
                  </span>
                ))}
              </div>
            </InfoBlock>
          ) : null}

          {profile.goals ? (
            <InfoBlock title="Goals">
              <p className="text-white/70 text-sm leading-relaxed">{profile.goals}</p>
            </InfoBlock>
          ) : null}
        </section>
      </div>
    </Layout>
  );
};

interface InfoBlockProps {
  title: string;
  children: React.ReactNode;
}

const InfoBlock = ({ title, children }: InfoBlockProps) => (
  <div className="panel p-6 space-y-3">
    <p className="text-xs uppercase tracking-[0.3em] text-white/50">{title}</p>
    {children}
  </div>
);
