import { motion } from 'framer-motion';
import { User } from '../types/user';

interface ProfileCardProps {
  user: User;
}

export const ProfileCard = ({ user }: ProfileCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-dark-card rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
    >
      {/* Header Image */}
      <div className="relative h-64">
        <img
          src={user.avatar}
          alt={user.name}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-card to-transparent" />
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {user.name}, {user.age}
            </h2>
            {user.location && (
              <p className="text-gray-400 text-sm flex items-center mt-1">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                    clipRule="evenodd"
                  />
                </svg>
                {typeof user.location === 'string' ? user.location : user.location?.city || 'Unknown location'}
              </p>
            )}
          </div>

          {/* Badges */}
          {user.badges && user.badges.length > 0 && (
            <div className="flex gap-2">
              {user.badges.map((badge, index) => (
                <span
                  key={index}
                  className="text-2xl"
                  title={badge}
                >
                  {badge}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Bio */}
        <p className="text-gray-300 mb-6">{user.bio}</p>

        {/* Skills */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">
            Skills
          </h3>
          <div className="flex flex-wrap gap-2">
            {user.skills.map((skill, index) => (
              <span
                key={index}
                className="px-4 py-2 rounded-xl text-sm text-white bg-white/5 shadow-[0_4px_16px_rgba(0,0,0,0.2)] hover:bg-white/10 hover:shadow-[0_6px_24px_rgba(102,126,234,0.3)] transition-all"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Interests */}
        {user.interests && user.interests.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">
              Interests
            </h3>
            <div className="flex flex-wrap gap-2">
              {user.interests.map((interest, index) => (
                <span
                  key={index}
                  className="px-4 py-2 rounded-xl text-sm text-accent-peach bg-gradient-to-r from-accent-orange/20 to-accent-peach/15 shadow-[0_3px_12px_rgba(255,95,143,0.35)]"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Social Links */}
        <div className="flex gap-3">
          {user.instagram && (
            <a
              href={`https://instagram.com/${user.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-center text-white font-medium hover:shadow-lg hover:shadow-purple-500/50 transition-all"
            >
              Instagram
            </a>
          )}
          {user.telegram && (
            <a
              href={`https://t.me/${user.telegram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 px-4 bg-blue-500 rounded-xl text-center text-white font-medium hover:shadow-lg hover:shadow-blue-500/50 transition-all"
            >
              Telegram
            </a>
          )}
          {user.whatsapp && (
            <a
              href={`https://wa.me/${user.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 px-4 bg-green-500 rounded-xl text-center text-white font-medium hover:shadow-lg hover:shadow-green-500/50 transition-all"
            >
              WhatsApp
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
};
