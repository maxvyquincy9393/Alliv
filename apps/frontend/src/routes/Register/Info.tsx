import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { GlassButton } from '../../components/GlassButton';
import { fadeInUp, stagger } from '../../lib/motion';
import { useRegistrationStore } from '../../store/registration';

const FIELDS = [
  { id: 'developer', name: 'Developer', icon: '💻', color: '#6E9EFF' },
  { id: 'designer', name: 'Designer', icon: '🎨', color: '#A78BFA' },
  { id: 'photographer', name: 'Photographer', icon: '📷', color: '#F472B6' },
  { id: 'musician', name: 'Musician', icon: '🎵', color: '#34D399' },
  { id: 'filmmaker', name: 'Filmmaker', icon: '🎬', color: '#FB923C' },
  { id: 'writer', name: 'Writer', icon: '✍️', color: '#60A5FA' },
  { id: 'health', name: 'Health & Wellness', icon: '🏃', color: '#10B981' },
  { id: 'education', name: 'Education', icon: '📚', color: '#8B5CF6' },
  { id: 'business', name: 'Business', icon: '💼', color: '#EF4444' },
  { id: 'marketing', name: 'Marketing', icon: '📊', color: '#F59E0B' },
  { id: 'product', name: 'Product', icon: '📦', color: '#06B6D4' },
  { id: 'data', name: 'Data Science', icon: '📈', color: '#3B82F6' },
];

export const Info = () => {
  const navigate = useNavigate();
  const { data, setData } = useRegistrationStore();
  const [selectedField, setSelectedField] = useState(data.field || '');

  const handleContinue = () => {
    setData({ field: selectedField });
    navigate('/register/skills');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <motion.div
        variants={stagger(0.05)}
        initial="hidden"
        animate="show"
        className="max-w-4xl w-full"
      >
        {/* Header */}
        <motion.div variants={fadeInUp} className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-3">
            What's Your Main Field?
          </h1>
          <p className="text-white/60">
            Choose the area that best describes your expertise
          </p>
        </motion.div>

        {/* Field Grid */}
        <motion.div
          variants={stagger(0.04)}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8"
        >
          {FIELDS.map((field) => (
            <motion.button
              key={field.id}
              variants={fadeInUp}
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedField(field.id)}
              className={`relative p-6 rounded-2xl transition-all ${
                selectedField === field.id
                  ? 'glass-strong shadow-glow-blue ring-2 ring-accent-blue/50'
                  : 'glass hover:shadow-glass'
              }`}
            >
              {/* Icon */}
              <div className="text-5xl mb-3">{field.icon}</div>

              {/* Name */}
              <h3 className="text-sm font-medium text-white text-center">
                {field.name}
              </h3>

              {/* Selection Indicator */}
              {selectedField === field.id && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-3 right-3 w-6 h-6 rounded-full bg-accent-blue flex items-center justify-center"
                >
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </motion.div>
              )}
            </motion.button>
          ))}
        </motion.div>

        {/* Navigation */}
        <motion.div variants={fadeInUp} className="flex gap-4">
          <GlassButton
            variant="secondary"
            onClick={() => navigate('/register/photos')}
            fullWidth
          >
            Back
          </GlassButton>
          <GlassButton
            variant="primary"
            onClick={handleContinue}
            disabled={!selectedField}
            fullWidth
          >
            Continue
          </GlassButton>
        </motion.div>
      </motion.div>
    </div>
  );
};
