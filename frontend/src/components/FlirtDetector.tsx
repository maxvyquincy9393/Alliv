import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

interface FlirtDetectorProps {
  messages: string[];
}

export const FlirtDetector = ({ messages }: FlirtDetectorProps) => {
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    // Simple flirt detection (mock - would use AI in production)
    const flirtKeywords = ['beautiful', 'gorgeous', 'sexy', 'hot', 'cute', 'date', 'romance'];
    const recentMessages = messages.slice(-5);
    
    const hasFlirtyContent = recentMessages.some(msg =>
      flirtKeywords.some(keyword => msg.toLowerCase().includes(keyword))
    );

    setShowWarning(hasFlirtyContent);
  }, [messages]);

  return (
    <AnimatePresence>
      {showWarning && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="glass-card rounded-xl p-3 mb-4 border border-yellow-500/20"
        >
          <div className="flex items-start gap-3">
            <div className="text-yellow-400 text-xl">⚠️</div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-yellow-200 mb-1">
                Gentle Reminder
              </h4>
              <p className="text-xs text-white/60 leading-relaxed">
                This platform is for platonic collaboration. Let's keep things professional and focused on creating together! 🤝
              </p>
            </div>
            <button
              onClick={() => setShowWarning(false)}
              className="text-white/40 hover:text-white/60 transition-colors"
            >
              ✕
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
