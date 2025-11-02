import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRegistrationStore } from '../../store/registration';
import { GlassButton } from '../../components/GlassButton';
import { SkillTag } from '../../components/SkillTag';
import { MOCK_SKILLS } from '../../types/skill';

export const StepSkills = () => {
  const { data, setData, nextStep, prevStep } = useRegistrationStore();
  const [selectedSkills, setSelectedSkills] = useState<string[]>(data.skills || []);

  const toggleSkill = (skillId: string) => {
    setSelectedSkills(prev =>
      prev.includes(skillId)
        ? prev.filter(id => id !== skillId)
        : [...prev, skillId]
    );
  };

  const handleContinue = () => {
    setData({ skills: selectedSkills });
    nextStep();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-3">Select Your Skills</h1>
        <p className="text-white/50">Choose at least 3 skills you're good at</p>
      </div>

      {/* Skills grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-12">
        {MOCK_SKILLS.map((skill) => (
          <SkillTag
            key={skill.id}
            name={skill.name}
            icon={skill.icon}
            selected={selectedSkills.includes(skill.id)}
            onClick={() => toggleSkill(skill.id)}
          />
        ))}
      </div>

      <div className="space-y-3">
        <GlassButton
          variant="primary"
          fullWidth
          onClick={handleContinue}
          disabled={selectedSkills.length < 3}
        >
          Continue ({selectedSkills.length}/3 minimum)
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
              step === 2 ? 'w-8 bg-accent-blue' : step < 2 ? 'w-1 bg-accent-blue/50' : 'w-1 bg-white/20'
            }`}
          />
        ))}
      </div>
    </motion.div>
  );
};
