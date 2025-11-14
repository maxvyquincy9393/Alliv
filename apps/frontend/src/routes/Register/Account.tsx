import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { GlassButton } from '../../components/GlassButton';
import { fadeInUp, stagger } from '../../lib/motion';
import { useRegistrationStore } from '../../store/registration';
import type { Gender } from '../../types/profile';

export const Account = () => {
  const navigate = useNavigate();
  const { data, setData } = useRegistrationStore();

  const [formData, setFormData] = useState({
    name: data.name || '',
    email: data.email || '',
    birthday: data.birthday || '',
    gender: data.gender || ('' as Gender),
    city: data.city || '',
    bio: data.bio || '',
    goals: data.goals || '',
  });

  const handleChange = (
    field: keyof typeof formData,
    value: string | Gender
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleContinue = () => {
    setData(formData);
    navigate('/register/photos');
  };

  const isValid = () => {
    return (
      formData.name.trim() &&
      formData.email.trim() &&
      formData.birthday.length === 10 &&
      formData.gender &&
      formData.city.trim() &&
      formData.bio.trim() &&
      formData.goals.trim()
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <motion.div
        variants={stagger(0.08)}
        initial="hidden"
        animate="show"
        className="max-w-2xl w-full"
      >
        {/* Header */}
        <motion.div variants={fadeInUp} className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-3">About You</h1>
          <p className="text-white/60">Let's get to know you better</p>
        </motion.div>

        {/* Form */}
        <motion.div variants={fadeInUp} className="glass-card rounded-2xl p-8 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full px-4 py-3 glass rounded-xl text-white placeholder-white/30 focus:ring-2 focus:ring-accent-blue/50 transition-all"
              placeholder="Your name"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full px-4 py-3 glass rounded-xl text-white placeholder-white/30 focus:ring-2 focus:ring-accent-blue/50 transition-all"
              placeholder="you@example.com"
            />
          </div>

          {/* Birthday & Gender */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Birthday (DD/MM/YYYY) *
              </label>
              <input
                type="text"
                maxLength={10}
                value={formData.birthday}
                onChange={(e) => {
                  let value = e.target.value.replace(/\D/g, '');
                  if (value.length >= 2) value = value.slice(0, 2) + '/' + value.slice(2);
                  if (value.length >= 5) value = value.slice(0, 5) + '/' + value.slice(5);
                  handleChange('birthday', value.slice(0, 10));
                }}
                className="w-full px-4 py-3 glass rounded-xl text-white placeholder-white/30 focus:ring-2 focus:ring-accent-blue/50 transition-all"
                placeholder="DD/MM/YYYY"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Gender *
              </label>
              <select
                value={formData.gender}
                onChange={(e) => handleChange('gender', e.target.value as Gender)}
                className="w-full px-4 py-3 glass rounded-xl text-white focus:ring-2 focus:ring-accent-blue/50 transition-all appearance-none cursor-pointer"
              >
                <option value="" disabled>
                  Select gender
                </option>
                <option value="man">Man</option>
                <option value="woman">Woman</option>
                <option value="other">Other</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
              </select>
            </div>
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              City *
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => handleChange('city', e.target.value)}
              className="w-full px-4 py-3 glass rounded-xl text-white placeholder-white/30 focus:ring-2 focus:ring-accent-blue/50 transition-all"
              placeholder="Where are you based?"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Short Bio *
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => handleChange('bio', e.target.value)}
              rows={3}
              className="w-full px-4 py-3 glass rounded-xl text-white placeholder-white/30 focus:ring-2 focus:ring-accent-blue/50 transition-all resize-none"
              placeholder="Tell us about yourself..."
              maxLength={200}
            />
            <p className="text-xs text-white/40 mt-1">
              {formData.bio.length}/200 characters
            </p>
          </div>

          {/* Goals */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              What do you want to collaborate on? *
            </label>
            <textarea
              value={formData.goals}
              onChange={(e) => handleChange('goals', e.target.value)}
              rows={3}
              className="w-full px-4 py-3 glass rounded-xl text-white placeholder-white/30 focus:ring-2 focus:ring-accent-blue/50 transition-all resize-none"
              placeholder="Projects, creative ideas, professional goals..."
              maxLength={300}
            />
            <p className="text-xs text-white/40 mt-1">
              {formData.goals.length}/300 characters
            </p>
          </div>
        </motion.div>

        {/* Navigation */}
        <motion.div variants={fadeInUp} className="mt-6 flex gap-4">
          <GlassButton
            variant="secondary"
            onClick={() => navigate('/register/auth')}
            fullWidth
          >
            Back
          </GlassButton>
          <GlassButton
            variant="primary"
            onClick={handleContinue}
            disabled={!isValid()}
            fullWidth
          >
            Continue
          </GlassButton>
        </motion.div>
      </motion.div>
    </div>
  );
};
