import { motion } from 'framer-motion';
import { User } from '../types/user';

interface MatchModalProps {
  user: User;
  onClose: () => void;
  onSendMessage: () => void;
}

export const MatchModal = ({ user, onClose, onSendMessage }: MatchModalProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', duration: 0.5 }}
        className="glass-card rounded-3xl p-8 max-w-md w-full text-center shadow-glow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Match Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="mb-6"
        >
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full glass-strong shadow-glow-blue">
            <svg
              className="w-12 h-12 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </motion.div>

        {/* Text */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-4xl font-bold text-white mb-2"
        >
          It's a Match!
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-white/60 mb-8"
        >
          You and <span className="text-accent-blue font-semibold">{user.name}</span> liked each other
        </motion.p>

        {/* User Avatar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <img
            src={user.avatar}
            alt={user.name}
            className="w-32 h-32 rounded-full mx-auto object-cover border-2 border-white/10 shadow-glow-blue"
          />
        </motion.div>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex gap-4"
        >
          <button
            onClick={onSendMessage}
            className="flex-1 py-4 px-6 glass-strong text-white font-medium rounded-xl shadow-glow-blue hover:shadow-glow-lg transition-all hover:scale-105"
          >
            Send Message
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-4 px-6 glass text-white/70 font-medium rounded-xl border border-white/10 hover:border-white/20 transition-all hover:scale-105"
          >
            Keep Swiping
          </button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};
