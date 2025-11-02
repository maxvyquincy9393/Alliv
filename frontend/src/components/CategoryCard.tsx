import { motion } from 'framer-motion';

interface CategoryCardProps {
  name: string;
  thumbnail?: string;
  selected?: boolean;
  onClick?: () => void;
}

export const CategoryCard = ({ name, thumbnail, selected = false, onClick }: CategoryCardProps) => {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-2xl
        transition-all duration-300
        ${selected 
          ? 'ring-2 ring-accent-blue shadow-glow-lg' 
          : 'ring-1 ring-white/10 hover:ring-white/20'
        }
      `}
    >
      {/* Image */}
      <div className="aspect-square w-full bg-dark-card overflow-hidden">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={name}
            className={`w-full h-full object-cover transition-all duration-300 ${
              selected ? 'scale-110 brightness-110' : 'brightness-75 hover:brightness-90'
            }`}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-accent-blue/20 to-accent-blue/5" />
        )}
      </div>

      {/* Overlay */}
      <div className={`
        absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent
        flex items-end p-3
      `}>
        <span className="text-sm font-medium text-white">{name}</span>
      </div>

      {/* Selection indicator */}
      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-3 right-3 w-6 h-6 bg-accent-blue rounded-full flex items-center justify-center shadow-glow"
        >
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>
      )}
    </motion.button>
  );
};
