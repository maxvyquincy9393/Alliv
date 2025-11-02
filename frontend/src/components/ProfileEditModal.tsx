import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Code, Link, Camera, ChevronLeft, ChevronRight, Save } from 'lucide-react';
import { GlassButton } from './GlassButton';
import { PhotoUploader } from './PhotoUploader';
import { SkillTag } from './SkillTag';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: any; // TODO: Type this properly
  onSave: (updatedProfile: any) => void;
}

type EditStep = 'basic' | 'skills' | 'links' | 'photos';

const steps: EditStep[] = ['basic', 'skills', 'links', 'photos'];

const stepTitles = {
  basic: 'Basic Information',
  skills: 'Skills & Interests',
  links: 'Social Links',
  photos: 'Profile Photos'
};

const skillOptions = [
  'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 
  'UI/UX Design', 'Figma', 'Photography', 'Video Editing',
  'Music Production', 'Content Writing', 'Marketing'
];

const interestOptions = [
  'Technology', 'Design', 'Art', 'Music', 'Photography',
  'Film', 'Gaming', 'Travel', 'Fitness', 'Food',
  'Fashion', 'Business', 'Education'
];

export const ProfileEditModal = ({ isOpen, onClose, profile, onSave }: ProfileEditModalProps) => {
  const [currentStep, setCurrentStep] = useState<EditStep>('basic');
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    bio: profile?.bio || '',
    location: profile?.location || '',
    category: profile?.category || '',
    skills: profile?.skills || [],
    interests: profile?.interests || [],
    goals: profile?.goals || '',
    githubUrl: profile?.githubUrl || '',
    xHandle: profile?.xHandle || '',
    portfolio: profile?.portfolio || '',
    photos: profile?.photos || []
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const currentStepIndex = steps.indexOf(currentStep);

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    switch (currentStep) {
      case 'basic':
        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (formData.name.length < 2) newErrors.name = 'Name must be at least 2 characters';
        if (formData.bio && formData.bio.length > 500) newErrors.bio = 'Bio must be less than 500 characters';
        break;
      case 'skills':
        if (formData.skills.length < 3) newErrors.skills = 'Select at least 3 skills';
        if (formData.interests.length < 3) newErrors.interests = 'Select at least 3 interests';
        break;
      case 'photos':
        if (formData.photos.length < 2) newErrors.photos = 'Upload at least 2 photos';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep() && currentStepIndex < steps.length - 1) {
      setCurrentStep(steps[currentStepIndex + 1]);
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1]);
    }
  };

  const handleSave = async () => {
    if (!validateStep()) return;

    setSaving(true);
    try {
      // API call to update profile
      const response = await fetch('/api/profile/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        onSave(updatedProfile);
        onClose();
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrors({ general: 'Failed to update profile. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const toggleSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const toggleInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="glass-strong max-w-2xl w-full rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="px-6 py-4 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white">Edit Profile</h2>
                    <p className="text-sm text-white/60 mt-1">{stepTitles[currentStep]}</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-white/60" />
                  </button>
                </div>

                {/* Progress */}
                <div className="flex items-center gap-2 mt-4">
                  {steps.map((step, index) => (
                    <div
                      key={step}
                      className={`flex-1 h-1 rounded-full transition-colors ${
                        index <= currentStepIndex
                          ? 'bg-accent-blue'
                          : 'bg-white/10'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-white/40 mt-2">
                  Step {currentStepIndex + 1} of {steps.length}
                </p>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 py-6">
                <AnimatePresence mode="wait">
                  {/* Basic Information */}
                  {currentStep === 'basic' && (
                    <motion.div
                      key="basic"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div>
                        <label className="block text-sm font-medium text-white/80 mb-2">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-4 py-3 bg-dark-surface border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-accent-blue transition-colors"
                          placeholder="Your full name"
                        />
                        {errors.name && (
                          <p className="text-red-400 text-sm mt-1">{errors.name}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white/80 mb-2">
                          Bio
                        </label>
                        <textarea
                          value={formData.bio}
                          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                          className="w-full px-4 py-3 bg-dark-surface border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-accent-blue transition-colors resize-none"
                          placeholder="Tell us about yourself..."
                          rows={4}
                        />
                        <p className="text-xs text-white/40 mt-1">
                          {formData.bio.length}/500 characters
                        </p>
                        {errors.bio && (
                          <p className="text-red-400 text-sm mt-1">{errors.bio}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white/80 mb-2">
                          Location
                        </label>
                        <input
                          type="text"
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          className="w-full px-4 py-3 bg-dark-surface border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-accent-blue transition-colors"
                          placeholder="City, Country"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white/80 mb-2">
                          Category
                        </label>
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          className="w-full px-4 py-3 bg-dark-surface border border-white/10 rounded-xl text-white focus:outline-none focus:border-accent-blue transition-colors"
                        >
                          <option value="">Select a category</option>
                          <option value="developer">Developer</option>
                          <option value="designer">Designer</option>
                          <option value="photographer">Photographer</option>
                          <option value="musician">Musician</option>
                          <option value="videographer">Videographer</option>
                          <option value="writer">Writer</option>
                          <option value="marketer">Marketer</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </motion.div>
                  )}

                  {/* Skills & Interests */}
                  {currentStep === 'skills' && (
                    <motion.div
                      key="skills"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div>
                        <label className="block text-sm font-medium text-white/80 mb-2">
                          Skills * (Select at least 3)
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {skillOptions.map((skill) => (
                            <button
                              key={skill}
                              onClick={() => toggleSkill(skill)}
                              className={`px-4 py-2 rounded-full text-sm transition-all ${
                                formData.skills.includes(skill)
                                  ? 'bg-accent-blue text-white'
                                  : 'glass text-white/70 hover:text-white'
                              }`}
                            >
                              {skill}
                            </button>
                          ))}
                        </div>
                        {errors.skills && (
                          <p className="text-red-400 text-sm mt-2">{errors.skills}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white/80 mb-2">
                          Interests * (Select at least 3)
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {interestOptions.map((interest) => (
                            <button
                              key={interest}
                              onClick={() => toggleInterest(interest)}
                              className={`px-4 py-2 rounded-full text-sm transition-all ${
                                formData.interests.includes(interest)
                                  ? 'bg-accent-purple text-white'
                                  : 'glass text-white/70 hover:text-white'
                              }`}
                            >
                              {interest}
                            </button>
                          ))}
                        </div>
                        {errors.interests && (
                          <p className="text-red-400 text-sm mt-2">{errors.interests}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white/80 mb-2">
                          Goals
                        </label>
                        <textarea
                          value={formData.goals}
                          onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                          className="w-full px-4 py-3 bg-dark-surface border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-accent-blue transition-colors resize-none"
                          placeholder="What are you looking to achieve through collaborations?"
                          rows={3}
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* Social Links */}
                  {currentStep === 'links' && (
                    <motion.div
                      key="links"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div>
                        <label className="block text-sm font-medium text-white/80 mb-2">
                          GitHub Profile
                        </label>
                        <input
                          type="url"
                          value={formData.githubUrl}
                          onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                          className="w-full px-4 py-3 bg-dark-surface border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-accent-blue transition-colors"
                          placeholder="https://github.com/username"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white/80 mb-2">
                          X (Twitter) Handle
                        </label>
                        <input
                          type="text"
                          value={formData.xHandle}
                          onChange={(e) => setFormData({ ...formData, xHandle: e.target.value })}
                          className="w-full px-4 py-3 bg-dark-surface border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-accent-blue transition-colors"
                          placeholder="@username"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white/80 mb-2">
                          Portfolio Website
                        </label>
                        <input
                          type="url"
                          value={formData.portfolio}
                          onChange={(e) => setFormData({ ...formData, portfolio: e.target.value })}
                          className="w-full px-4 py-3 bg-dark-surface border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-accent-blue transition-colors"
                          placeholder="https://yourportfolio.com"
                        />
                      </div>

                      <div className="p-4 glass rounded-xl">
                        <p className="text-sm text-white/60">
                          💡 <strong>Tip:</strong> Connect your GitHub or X account to automatically display them on your profile. 
                          Links will only be visible if connected.
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* Photos */}
                  {currentStep === 'photos' && (
                    <motion.div
                      key="photos"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div>
                        <label className="block text-sm font-medium text-white/80 mb-2">
                          Profile Photos * (2-6 photos required)
                        </label>
                        <PhotoUploader
                          photos={formData.photos}
                          onPhotosChange={(photos) => setFormData({ ...formData, photos })}
                          maxPhotos={6}
                          minPhotos={2}
                        />
                        {errors.photos && (
                          <p className="text-red-400 text-sm mt-2">{errors.photos}</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* General Error */}
                {errors.general && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-4 p-3 bg-red-500/10 border border-red-500 rounded-xl text-red-500 text-sm"
                  >
                    {errors.general}
                  </motion.div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <button
                    onClick={handlePrevious}
                    disabled={currentStepIndex === 0}
                    className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                      currentStepIndex === 0
                        ? 'text-white/30 cursor-not-allowed'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>

                  <div className="flex gap-3">
                    <GlassButton variant="secondary" onClick={onClose}>
                      Cancel
                    </GlassButton>
                    
                    {currentStepIndex < steps.length - 1 ? (
                      <GlassButton
                        variant="primary"
                        onClick={handleNext}
                      >
                        Next
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </GlassButton>
                    ) : (
                      <GlassButton
                        variant="primary"
                        onClick={handleSave}
                        disabled={saving}
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                        {!saving && <Save className="w-4 h-4 ml-1" />}
                      </GlassButton>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
