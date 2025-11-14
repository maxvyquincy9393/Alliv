import { motion } from 'framer-motion';
import { ReactNode, useState } from 'react';

interface UltraModernCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: string;
  animated?: boolean;
  hoverable?: boolean;
  glassmorphism?: boolean;
}

export const UltraModernCard = ({
  children,
  className = '',
  glowColor = 'cyan',
  animated = true,
  hoverable = true,
  glassmorphism = true,
}: UltraModernCardProps) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const glowColors = {
    cyan: 'rgba(53, 245, 255, 0.4)',
    purple: 'rgba(139, 92, 246, 0.4)',
    pink: 'rgba(236, 72, 153, 0.4)',
    yellow: 'rgba(255, 236, 61, 0.4)',
    green: 'rgba(16, 185, 129, 0.4)',
  };

  const glowStyle = glowColors[glowColor as keyof typeof glowColors] || glowColors.cyan;

  return (
    <motion.div
      initial={animated ? { opacity: 0, y: 20 } : {}}
      animate={animated ? { opacity: 1, y: 0 } : {}}
      whileHover={hoverable ? { scale: 1.02, y: -5 } : {}}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative overflow-hidden rounded-2xl p-6
        ${glassmorphism ? 'glass-card' : 'bg-dark-card'}
        border border-dark-border
        transition-all duration-300
        ${hoverable ? 'cursor-pointer' : ''}
        ${className}
      `}
      style={{
        boxShadow: isHovered
          ? `0 20px 60px ${glowStyle}, 0 0 30px ${glowStyle}`
          : '0 10px 30px rgba(0,0,0,0.3)',
      }}
    >
      {/* Animated gradient overlay */}
      <motion.div
        className="absolute inset-0 opacity-0 pointer-events-none"
        animate={{
          opacity: isHovered ? 0.15 : 0,
        }}
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, ${glowStyle}, transparent 60%)`,
        }}
      />

      {/* Shimmer effect */}
      {isHovered && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
          }}
        />
      )}

      {/* Border glow */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${glowStyle}, transparent)`,
          opacity: isHovered ? 0.3 : 0,
          transition: 'opacity 0.3s',
        }}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>

      {/* Corner accent */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-10 pointer-events-none">
        <div
          className="w-full h-full rounded-full blur-3xl"
          style={{ background: glowStyle }}
        />
      </div>
    </motion.div>
  );
};
