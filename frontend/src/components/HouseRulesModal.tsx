import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Check } from 'lucide-react';
import { GlassButton } from './GlassButton';

interface HouseRulesModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline?: () => void;
}

const rules = [
  {
    id: 1,
    title: 'Be Real',
    description: 'Pakai foto asli & skill jujur. No catfish, no fake portfolio.',
    icon: '📸'
  },
  {
    id: 2,
    title: 'Platonic Only',
    description: 'Ini platform kolaborasi profesional. Keep it professional.',
    icon: '🤝'
  },
  {
    id: 3,
    title: 'Respect Privacy',
    description: 'Jaga data pribadi orang lain. No doxxing, no harassment.',
    icon: '🔒'
  },
  {
    id: 4,
    title: 'Report Fast',
    description: 'Lihat yang aneh? Langsung report. Bantu jaga komunitas tetap aman.',
    icon: '🚨'
  }
];

export const HouseRulesModal = ({ isOpen, onAccept, onDecline }: HouseRulesModalProps) => {
  const [agreed, setAgreed] = useState(false);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-[20px] z-50"
            onClick={onDecline}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="glass max-w-lg w-full rounded-3xl p-8 shadow-glass">
              {/* Header */}
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="mb-8"
              >
                <h2 className="text-3xl font-bold text-white mb-2">House Rules</h2>
                <div className="h-1 w-20 bg-gradient-to-r from-accent-blue to-accent-purple rounded-full" />
              </motion.div>

              {/* Rules List */}
              <div className="space-y-4 mb-8">
                {rules.map((rule, index) => (
                  <motion.div
                    key={rule.id}
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="flex items-start gap-4"
                  >
                    {/* Icon with check animation */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.4 + index * 0.1, type: 'spring' }}
                      className="relative"
                    >
                      <span className="text-3xl">{rule.icon}</span>
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.6 + index * 0.1, type: 'spring' }}
                        className="absolute -right-1 -bottom-1 bg-green-500 rounded-full p-0.5"
                      >
                        <Check className="w-3 h-3 text-white" />
                      </motion.div>
                    </motion.div>

                    {/* Rule content */}
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-1">{rule.title}</h3>
                      <p className="text-white/60 text-sm">{rule.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Agreement Checkbox */}
              <motion.label
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="flex items-center gap-3 mb-6 cursor-pointer group"
              >
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="w-6 h-6 border-2 border-white/40 rounded-md peer-checked:bg-accent-blue peer-checked:border-accent-blue transition-all">
                    {agreed && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex items-center justify-center h-full"
                      >
                        <Check className="w-4 h-4 text-white" />
                      </motion.div>
                    )}
                  </div>
                </div>
                <span className="text-white/80 group-hover:text-white transition-colors">
                  Saya setuju dengan House Rules Alliv
                </span>
              </motion.label>

              {/* Action Buttons */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="flex gap-3"
              >
                <GlassButton
                  variant="secondary"
                  onClick={onDecline}
                  fullWidth
                >
                  Kembali
                </GlassButton>
                <GlassButton
                  variant="primary"
                  onClick={onAccept}
                  disabled={!agreed}
                  fullWidth
                  className={`${
                    agreed 
                      ? 'bg-gradient-to-r from-accent-blue to-accent-purple hover:shadow-glow-blue' 
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                >
                  Setuju & Lanjut
                </GlassButton>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
