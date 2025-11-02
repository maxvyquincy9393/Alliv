import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Github, Twitter, Globe, Settings } from 'lucide-react';
import { Layout } from '../components/Layout';
import { ProfileCard } from '../components/ProfileCard';
import { ProfileEditModal } from '../components/ProfileEditModal';
import { useAuth } from '../hooks/useAuth';
import { User } from '../types/user';

export const Profile = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Mock profile data
    setProfileData({
      id: 'current-user',
      name: user?.name || 'Your Name',
      age: user?.age || 27,
      bio: user?.bio || 'Software Developer passionate about building amazing products',
      avatar: user?.avatar || 'https://i.pravatar.cc/400?img=33',
      skills: user?.skills || ['TypeScript', 'React', 'Node.js', 'Python'],
      badges: ['🎨', '💻', '🚀'],
      interests: ['Coding', 'Design', 'Startups'],
      location: 'San Francisco, CA',
      githubUrl: user?.githubUrl || '',
      xHandle: user?.xHandle || '',
      portfolio: user?.portfolio || '',
    });
  }, [isAuthenticated, navigate, user]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (!profileData) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[70vh]">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border-4 border-accent-orange border-t-transparent rounded-full"
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto py-8">
        {/* Header Actions */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">My Profile</h1>
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowEditModal(true)}
              className="px-6 py-2 bg-dark-card text-white font-medium rounded-xl border border-dark-border hover:border-accent-blue transition-all"
            >
              Edit Profile
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="px-6 py-2 bg-red-500/20 text-red-400 font-medium rounded-xl border border-red-500/50 hover:bg-red-500/30 transition-all"
            >
              Logout
            </motion.button>
          </div>
        </div>

        {/* Profile Card */}
        <ProfileCard user={profileData} />

        {/* Social Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-6 flex items-center gap-4"
        >
          {profileData.githubUrl && (
            <a
              href={profileData.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 glass rounded-lg hover:bg-white/10 transition-colors"
            >
              <Github className="w-5 h-5 text-white/80" />
              <span className="text-sm text-white/60">GitHub</span>
            </a>
          )}
          {profileData.xHandle && (
            <a
              href={`https://x.com/${profileData.xHandle.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 glass rounded-lg hover:bg-white/10 transition-colors"
            >
              <Twitter className="w-5 h-5 text-white/80" />
              <span className="text-sm text-white/60">X</span>
            </a>
          )}
          {profileData.portfolio && (
            <a
              href={profileData.portfolio}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 glass rounded-lg hover:bg-white/10 transition-colors"
            >
              <Globe className="w-5 h-5 text-white/80" />
              <span className="text-sm text-white/60">Portfolio</span>
            </a>
          )}
          {!profileData.githubUrl && !profileData.xHandle && !profileData.portfolio && (
            <div className="text-white/40 text-sm flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span>Connect social accounts in Settings</span>
            </div>
          )}
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-3 gap-4 mt-6"
        >
          <StatCard title="Matches" value="12" icon="❤️" />
          <StatCard title="Messages" value="48" icon="💬" />
          <StatCard title="Swipes" value="156" icon="👆" />
        </motion.div>

        {/* Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 bg-dark-card rounded-2xl p-6 border border-dark-border"
        >
          <h3 className="text-xl font-semibold text-white mb-4">Preferences</h3>
          <div className="space-y-4">
            <SettingToggle
              label="Show me on Alliv"
              description="Control your profile visibility"
              defaultChecked={true}
            />
            <SettingToggle
              label="Notifications"
              description="Get notified about new matches"
              defaultChecked={true}
            />
            <SettingToggle
              label="Show distance"
              description="Display distance in profiles"
              defaultChecked={false}
            />
          </div>
        </motion.div>
      </div>

      {/* Edit Profile Modal */}
      <ProfileEditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        profile={profileData}
        onSave={(updatedProfile) => {
          setProfileData(updatedProfile);
          setShowEditModal(false);
        }}
      />
    </Layout>
  );
};

interface StatCardProps {
  title: string;
  value: string;
  icon: string;
}

const StatCard = ({ title, value, icon }: StatCardProps) => {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-dark-card rounded-xl p-4 text-center border border-dark-border"
    >
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-gray-400">{title}</div>
    </motion.div>
  );
};

interface SettingToggleProps {
  label: string;
  description: string;
  defaultChecked: boolean;
}

const SettingToggle = ({ label, description, defaultChecked }: SettingToggleProps) => {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <div className="flex items-center justify-between">
      <div>
        <h4 className="text-white font-medium">{label}</h4>
        <p className="text-gray-400 text-sm">{description}</p>
      </div>
      <button
        onClick={() => setChecked(!checked)}
        className={`relative w-14 h-7 rounded-full transition-colors ${
          checked ? 'bg-gradient-to-r from-accent-orange to-accent-peach' : 'bg-dark-surface'
        }`}
      >
        <motion.div
          animate={{ x: checked ? 28 : 2 }}
          className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg"
        />
      </button>
    </div>
  );
};
