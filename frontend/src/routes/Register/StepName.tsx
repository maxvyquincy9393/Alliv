import { useState, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { useRegistrationStore } from '../../store/registration';
import { GlassButton } from '../../components/GlassButton';

export const StepName = () => {
  const { data, setData, nextStep } = useRegistrationStore();
  const [name, setName] = useState(data.name || '');
  const [age, setAge] = useState(data.age?.toString() || '');
  const [city, setCity] = useState(data.city || '');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    setData({
      name,
      age: parseInt(age),
      city,
    });
    
    nextStep();
  };

  const isValid = name.trim().length >= 2 && 
                  parseInt(age) >= 18 && 
                  parseInt(age) <= 100 &&
                  city.trim().length >= 2;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-3">Welcome to Alliv</h1>
        <p className="text-white/50">Let's start with the basics</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">
            Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            className="w-full px-4 py-3 glass rounded-xl text-white placeholder-white/30 focus:ring-2 focus:ring-accent-blue/50 transition-all"
            required
            minLength={2}
          />
        </div>

        {/* Age */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">
            Age
          </label>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="25"
            min={18}
            max={100}
            className="w-full px-4 py-3 glass rounded-xl text-white placeholder-white/30 focus:ring-2 focus:ring-accent-blue/50 transition-all"
            required
          />
        </div>

        {/* City */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">
            City
          </label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="San Francisco"
            className="w-full px-4 py-3 glass rounded-xl text-white placeholder-white/30 focus:ring-2 focus:ring-accent-blue/50 transition-all"
            required
            minLength={2}
          />
        </div>

        <GlassButton
          type="submit"
          variant="primary"
          fullWidth
          disabled={!isValid}
        >
          Continue
        </GlassButton>
      </form>

      {/* Progress indicator */}
      <div className="mt-12 flex justify-center gap-2">
        {[0, 1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={`h-1 rounded-full transition-all ${
              step === 0 ? 'w-8 bg-accent-blue' : 'w-1 bg-white/20'
            }`}
          />
        ))}
      </div>
    </motion.div>
  );
};
