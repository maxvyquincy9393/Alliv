import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRegistrationStore } from '../../store/registration';
import { GlassButton } from '../../components/GlassButton';
import { CategoryCard } from '../../components/CategoryCard';
import { MOCK_INTERESTS } from '../../types/skill';

export const StepInterests = () => {
  const { data, setData, nextStep, prevStep } = useRegistrationStore();
  const [selectedInterests, setSelectedInterests] = useState<string[]>(data.interests || []);

  const toggleInterest = (interestId: string) => {
    setSelectedInterests(prev =>
      prev.includes(interestId)
        ? prev.filter(id => id !== interestId)
        : [...prev, interestId]
    );
  };

  const handleContinue = () => {
    setData({ interests: selectedInterests });
    nextStep();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-3xl mx-auto"
    >
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-3">What Interests You?</h1>
        <p className="text-white/50">Pick at least 3 things you're passionate about</p>
      </div>

      {/* Interests grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-12">
        {MOCK_INTERESTS.map((interest) => (
          <CategoryCard
            key={interest.id}
            name={interest.name}
            thumbnail={interest.thumbnail}
            selected={selectedInterests.includes(interest.id)}
            onClick={() => toggleInterest(interest.id)}
          />
        ))}
      </div>

      <div className="space-y-3">
        <GlassButton
          variant="primary"
          fullWidth
          onClick={handleContinue}
          disabled={selectedInterests.length < 3}
        >
          Continue ({selectedInterests.length}/3 minimum)
        </GlassButton>

        <GlassButton
          variant="ghost"
          fullWidth
          onClick={prevStep}
        >
          Back
        </GlassButton>
      </div>

      {/* Progress indicator */}
      <div className="mt-12 flex justify-center gap-2">
        {[0, 1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={`h-1 rounded-full transition-all ${
              step === 3 ? 'w-8 bg-accent-blue' : step < 3 ? 'w-1 bg-accent-blue/50' : 'w-1 bg-white/20'
            }`}
          />
        ))}
      </div>
    </motion.div>
  );
};
