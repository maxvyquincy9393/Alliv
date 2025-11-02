import { motion } from 'framer-motion';
import { fadeInUp, stagger } from '../lib/motion';

interface AIIcebreakersProps {
  userName: string;
  userField?: string;
  onSelect: (message: string) => void;
}

export const AIIcebreakers = ({ userName, userField, onSelect }: AIIcebreakersProps) => {
  const icebreakers = [
    `Hey ${userName}! I saw you're into ${userField || 'creative work'}. What project are you most excited about right now?`,
    `Hi! Your profile caught my eye. Would love to collaborate on something. What kind of projects are you looking for?`,
    `${userName}, I think we could create something cool together. What's your go-to creative process?`,
  ];

  return (
    <motion.div
      variants={stagger(0.1)}
      initial="hidden"
      animate="show"
      className="glass-card rounded-2xl p-4 space-y-3"
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 bg-accent-blue rounded-full animate-pulse" />
        <span className="text-xs font-medium text-white/70 uppercase tracking-wide">
          AI Suggested Openers
        </span>
      </div>

      {icebreakers.map((message, index) => (
        <motion.button
          key={index}
          variants={fadeInUp}
          onClick={() => onSelect(message)}
          className="w-full text-left px-4 py-3 glass rounded-xl text-sm text-white/80 hover:text-white hover:shadow-glow-blue transition-all"
          whileHover={{ scale: 1.02, x: 4 }}
          whileTap={{ scale: 0.98 }}
        >
          {message}
        </motion.button>
      ))}
    </motion.div>
  );
};
