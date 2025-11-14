import { motion } from 'framer-motion';

interface SkillTagProps {
  name: string;
  icon?: string;
  selected?: boolean;
  onClick?: () => void;
}

export const SkillTag = ({ name, icon, selected = false, onClick }: SkillTagProps) => {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-xl p-4
        transition-all duration-300
        ${selected 
          ? 'glass-strong ring-2 ring-accent-blue shadow-glow' 
          : 'glass hover:glass-strong'
        }
      `}
    >
      <div className="flex flex-col items-center gap-2">
        {/* Icon/Image */}
        <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center overflow-hidden">
          {icon ? (
            <img 
              src={icon} 
              alt={name} 
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-blue/30 to-accent-blue/10" />
          )}
        </div>

        {/* Name */}
        <span className={`text-xs font-medium ${selected ? 'text-white' : 'text-white/70'}`}>
          {name}
        </span>
      </div>

      {/* Selection checkmark */}
      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2 right-2 w-5 h-5 bg-accent-blue rounded-full flex items-center justify-center"
        >
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>
      )}
    </motion.button>
  );
};
