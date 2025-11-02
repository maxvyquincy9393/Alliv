import { motion, useMotionValue, useTransform } from 'framer-motion';
import { User } from '../types/user';

interface SwipeCardProps {
  user: User;
  onSwipe: (direction: 'left' | 'right' | 'up') => void;
  style?: React.CSSProperties;
}

export const SwipeCard = ({ user, onSwipe, style }: SwipeCardProps) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-30, 30]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  const handleDragEnd = (_event: unknown, info: { offset: { x: number; y: number } }) => {
    if (info.offset.x > 100) {
      onSwipe('right');
    } else if (info.offset.x < -100) {
      onSwipe('left');
    } else if (info.offset.y < -100) {
      onSwipe('up');
    }
  };

  return (
    <motion.div
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={handleDragEnd}
      style={{ x, rotate, opacity, ...style }}
      className="absolute w-full max-w-sm h-[600px] cursor-grab active:cursor-grabbing"
      whileHover={{ scale: 1.02 }}
    >
      <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-glass glass-card">
        {/* Image */}
        <img
          src={user.avatar}
          alt={user.name}
          className="w-full h-full object-cover"
          draggable={false}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <h2 className="text-3xl font-bold mb-1">
            {user.name}, {user.age}
          </h2>
          {user.location && (
            <p className="text-sm text-white/60 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                  clipRule="evenodd"
                />
              </svg>
              {user.location}
            </p>
          )}
          <p className="text-sm text-white/70 mb-4 line-clamp-2">{user.bio}</p>

          {/* Skills */}
          <div className="flex flex-wrap gap-2">
            {user.skills.slice(0, 4).map((skill, index) => (
              <span
                key={index}
                className="px-3 py-1 glass rounded-full text-xs font-medium border border-white/10"
              >
                {skill}
              </span>
            ))}
            {user.skills.length > 4 && (
              <span className="px-3 py-1 glass rounded-full text-xs font-medium border border-white/10">
                +{user.skills.length - 4}
              </span>
            )}
          </div>
        </div>

        {/* Swipe Indicators */}
        <motion.div
          style={{ opacity: useTransform(x, [0, 100], [0, 1]) }}
          className="absolute top-8 right-8 bg-accent-blue/90 backdrop-blur-sm text-white px-6 py-3 rounded-xl font-bold text-2xl rotate-12 border-2 border-white/20 shadow-glow-blue"
        >
          LIKE
        </motion.div>
        <motion.div
          style={{ opacity: useTransform(x, [-100, 0], [1, 0]) }}
          className="absolute top-8 left-8 bg-white/10 backdrop-blur-sm text-white px-6 py-3 rounded-xl font-bold text-2xl -rotate-12 border-2 border-white/20"
        >
          SKIP
        </motion.div>
      </div>
    </motion.div>
  );
};
