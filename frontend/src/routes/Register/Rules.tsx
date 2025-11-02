import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { GlassButton } from '../../components/GlassButton';
import { fadeInUp, stagger } from '../../lib/motion';

const HOUSE_RULES = [
  {
    id: 1,
    icon: '📸',
    title: 'Be Real',
    description: 'Pakai foto asli & skill jujur. No catfish, no fake portfolio.',
  },
  {
    id: 2,
    icon: '🤝',
    title: 'Platonic Only',
    description: 'Ini platform kolaborasi profesional. Keep it professional, fokus ke project.',
  },
  {
    id: 3,
    icon: '🔒',
    title: 'Respect Privacy',
    description: 'Jaga data pribadi orang lain. No doxxing, no harassment, no stalking.',
  },
  {
    id: 4,
    icon: '🚨',
    title: 'Report Fast',
    description: 'Lihat yang aneh? Langsung report. Bantu jaga komunitas tetap aman.',
  },
];

export const Rules = () => {
  const [accepted, setAccepted] = useState(false);
  const navigate = useNavigate();

  const handleContinue = () => {
    if (accepted) {
      navigate('/register/auth');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <motion.div
        variants={stagger(0.1)}
        initial="hidden"
        animate="show"
        className="max-w-2xl w-full"
      >
        {/* Header */}
        <motion.div variants={fadeInUp} className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-3">House Rules</h1>
          <p className="text-white/60">
            Mari bikin komunitas kolaborasi yang aman dan autentik
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="h-1 w-8 bg-accent-blue rounded-full" />
            <div className="h-1 w-4 bg-accent-blue/60 rounded-full" />
            <div className="h-1 w-2 bg-accent-blue/30 rounded-full" />
          </div>
        </motion.div>

        {/* Rules Cards */}
        <motion.div variants={stagger(0.08)} className="space-y-4 mb-8">
          {HOUSE_RULES.map((rule) => (
            <motion.div
              key={rule.id}
              variants={fadeInUp}
              whileHover={{ x: 4, scale: 1.02 }}
              className="glass-card rounded-2xl p-6 border border-white/10 hover:border-accent-blue/30 transition-all"
            >
              <div className="flex items-start gap-4">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.3 + rule.id * 0.1, type: 'spring' }}
                  className="relative"
                >
                  <span className="text-3xl">{rule.icon}</span>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5 + rule.id * 0.1, type: 'spring' }}
                    className="absolute -right-1 -bottom-1 bg-green-500 rounded-full p-0.5"
                  >
                    <Check className="w-3 h-3 text-white" />
                  </motion.div>
                </motion.div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-1">
                    {rule.title}
                  </h3>
                  <p className="text-sm text-white/60 leading-relaxed">
                    {rule.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Acceptance */}
        <motion.div variants={fadeInUp} className="space-y-6">
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="peer sr-only"
              />
              <div className="mt-1 w-6 h-6 border-2 border-white/20 rounded-md peer-checked:bg-accent-blue peer-checked:border-accent-blue transition-all">
                {accepted && (
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
              Saya setuju dengan House Rules Alliv dan paham ini platform kolaborasi
              profesional.
            </span>
          </label>

          <GlassButton
            variant="primary"
            fullWidth
            onClick={handleContinue}
            disabled={!accepted}
            className={`${
              accepted 
                ? 'bg-gradient-to-r from-accent-blue to-accent-purple hover:shadow-glow-blue' 
                : 'opacity-50 cursor-not-allowed'
            }`}
          >
            Setuju & Lanjut
          </GlassButton>
        </motion.div>
      </motion.div>
    </div>
  );
};
