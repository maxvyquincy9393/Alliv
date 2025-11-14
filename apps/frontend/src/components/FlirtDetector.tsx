import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

interface FlirtDetectorProps {
  messages: string[];
}

export const FlirtDetector = ({ messages }: FlirtDetectorProps) => {
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const flirtKeywords = ['beautiful', 'gorgeous', 'sexy', 'hot', 'cute', 'date', 'romance'];
    const recentMessages = messages.slice(-5);

    const hasFlirtyContent = recentMessages.some((msg) =>
      flirtKeywords.some((keyword) => msg.toLowerCase().includes(keyword))
    );
    setShowWarning(hasFlirtyContent);
  }, [messages]);

  if (!showWarning) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-4"
      >
        <div className="flex items-start gap-3 text-sm text-yellow-100">
          <AlertTriangle className="w-5 h-5" />
          <div className="flex-1">
            <p className="font-semibold text-yellow-200">Gentle Reminder</p>
            <p className="text-xs text-white/70 mt-1">
              Alliv is focused on collaborative work. Keep conversations respectful and steer away from
              romantic or suggestive language so everyone feels safe.
            </p>
          </div>
          <button
            onClick={() => setShowWarning(false)}
            className="text-yellow-200 hover:text-yellow-50 text-xs"
          >
            Dismiss
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
