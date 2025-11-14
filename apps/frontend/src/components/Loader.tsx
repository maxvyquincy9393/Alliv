import { motion } from 'framer-motion';

export const Loader = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center"
      >
        {/* Alliv shimmer text */}
        <h1 className="text-4xl font-bold mb-8 text-gradient shimmer">
          Alliv
        </h1>
        
        {/* Pulse line */}
        <div className="w-64 h-0.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-transparent via-accent-blue to-transparent"
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        </div>
      </motion.div>
    </div>
  );
};
