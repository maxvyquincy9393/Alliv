import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useRegistrationStore } from '../../store/registration';
import { GlassButton } from '../../components/GlassButton';
import { api } from '../../lib/api';

export const StepSummary = () => {
  const navigate = useNavigate();
  const { data, reset } = useRegistrationStore();
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    setCreating(true);
    
    try {
      // Register with API
      await api.register({
        name: data.name!,
        email: `${data.name!.toLowerCase().replace(/\s/g, '')}@alliv.app`,
        password: 'temporary123',
      });

      // Reset registration state
      reset();

      // Navigate to home
      navigate('/home');
    } catch (error) {
      console.error('Registration failed:', error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-3">Looking Good!</h1>
        <p className="text-white/50">Review your profile before continuing</p>
      </div>

      <div className="glass-card rounded-2xl p-8 mb-8">
        {/* Photo and basic info */}
        <div className="flex flex-col items-center mb-8">
          {data.photos && data.photos.length > 0 && (
            <img
              src={data.photos[0]}
              alt={data.name || 'Profile'}
              className="w-32 h-32 rounded-full object-cover ring-2 ring-accent-blue/50 shadow-glow mb-4"
            />
          )}
          <h2 className="text-2xl font-bold text-white">{data.name}</h2>
          <p className="text-white/50">{data.city}</p>
          {data.bio && <p className="text-sm text-white/60 mt-2 text-center max-w-md">{data.bio}</p>}
        </div>

        {/* Field */}
        {data.field && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-2">
              Field
            </h3>
            <div className="px-4 py-2 glass rounded-lg text-sm text-white/90 inline-block">
              {data.field}
            </div>
          </div>
        )}

        {/* Skills */}
        {data.skills && data.skills.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-3">
              Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {data.skills.map((skill, index) => (
                <div
                  key={index}
                  className="px-4 py-2 glass rounded-lg text-sm text-white/90"
                >
                  {skill}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Interests */}
        {data.interests && data.interests.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-3">
              Interests
            </h3>
            <div className="flex flex-wrap gap-2">
              {data.interests.map((interest, index) => (
                <div
                  key={index}
                  className="px-4 py-2 glass rounded-lg text-sm text-white/90"
                >
                  {interest}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <GlassButton
          variant="primary"
          fullWidth
          onClick={handleCreate}
          loading={creating}
        >
          Create Profile
        </GlassButton>

        <GlassButton
          variant="ghost"
          fullWidth
          onClick={() => navigate('/register/location')}
          disabled={creating}
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
              step === 4 ? 'w-8 bg-accent-blue' : 'w-1 bg-accent-blue/50'
            }`}
          />
        ))}
      </div>
    </motion.div>
  );
};
