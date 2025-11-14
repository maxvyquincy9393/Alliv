import { motion } from 'framer-motion';

interface MapPreviewProps {
  city: string;
  radiusKm: number;
}

export const MapPreview = ({ city, radiusKm }: MapPreviewProps) => {
  return (
    <div className="glass relative h-44 rounded-2xl overflow-hidden shadow-glass">
      {/* Placeholder dark map background */}
      <div className="absolute inset-0 bg-gradient-to-br from-dark-bg via-[#0f1322] to-dark-bg" />
      
      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(110, 158, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(110, 158, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
        }}
      />
      
      {/* Radius circle with breathing animation */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.3, 0.4, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="w-28 h-28 rounded-full border border-accent-blue/40"
          style={{
            boxShadow: '0 0 40px rgba(110, 158, 255, 0.25), inset 0 0 20px rgba(110, 158, 255, 0.1)',
          }}
        />
        
        {/* Center pulse */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.6, 0.8, 0.6],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute w-3 h-3 rounded-full bg-accent-blue shadow-glow-blue"
        />
      </div>
      
      {/* Info label */}
      <div className="absolute left-3 bottom-3 glass px-3 py-1.5 rounded-lg">
        <p className="text-xs text-white/80 font-medium">
          {city} · ~{radiusKm} km radius
        </p>
      </div>
    </div>
  );
};
