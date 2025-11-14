import { motion } from 'framer-motion';

export const SkeletonCard = () => {
  return (
    <div className="glass-card rounded-2xl p-6 space-y-4">
      {/* Header skeleton */}
      <div className="flex items-center gap-3">
        <motion.div
          className="w-10 h-10 rounded-full bg-white/5"
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <div className="flex-1 space-y-2">
          <motion.div
            className="h-4 bg-white/5 rounded w-3/4"
            animate={{ opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.1 }}
          />
          <motion.div
            className="h-3 bg-white/5 rounded w-1/2"
            animate={{ opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
          />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="space-y-2">
        <motion.div
          className="h-4 bg-white/5 rounded w-full"
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
        />
        <motion.div
          className="h-4 bg-white/5 rounded w-5/6"
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
        />
        <motion.div
          className="h-4 bg-white/5 rounded w-4/6"
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
        />
      </div>

      {/* Tags skeleton */}
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="h-8 w-20 bg-white/5 rounded-full"
            animate={{ opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 + i * 0.1 }}
          />
        ))}
      </div>
    </div>
  );
};

export const SkeletonImage = ({ className = '' }: { className?: string }) => {
  return (
    <motion.div
      className={`bg-white/5 ${className}`}
      animate={{ opacity: [0.3, 0.5, 0.3] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    />
  );
};

export const SkeletonText = ({ lines = 3, className = '' }: { lines?: number; className?: string }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <motion.div
          key={i}
          className="h-4 bg-white/5 rounded"
          style={{ width: `${100 - i * 10}%` }}
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
        />
      ))}
    </div>
  );
};
