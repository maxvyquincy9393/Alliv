import { motion } from 'framer-motion';

interface FloatingButtonsProps {
  onSkip: () => void;
  onLike: () => void;
  onSuperLike: () => void;
  disabled?: boolean;
}

export const FloatingButtons = ({
  onSkip,
  onLike,
  onSuperLike,
  disabled = false,
}: FloatingButtonsProps) => {
  return (
    <div className="flex items-center justify-center space-x-6 mt-8">
      {/* Skip Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onSkip}
        disabled={disabled}
        className="w-16 h-16 rounded-full glass border border-white/10 text-white/60 flex items-center justify-center shadow-glass hover:glow-blue transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </motion.button>

      {/* Super Like Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onSuperLike}
        disabled={disabled}
        className="w-14 h-14 rounded-full glass border border-accent-blue/50 text-accent-blue flex items-center justify-center shadow-glass hover:shadow-glow-blue transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      </motion.button>

      {/* Like Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onLike}
        disabled={disabled}
        className="w-16 h-16 rounded-full glass-strong border border-accent-blue/50 text-white flex items-center justify-center shadow-glow-blue hover:shadow-glow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
            clipRule="evenodd"
          />
        </svg>
      </motion.button>
    </div>
  );
};
