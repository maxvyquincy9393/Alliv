import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  User,
  Briefcase,
  Target,
  Globe,
  Sparkles,
  Plus,
  X,
  Zap
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { theme } from '../styles/theme';

interface OnboardingData {
  // Step 1: Basic Info
  name: string;
  role: string;
  field: string;
  experience_level: string;
  
  // Step 2: Skills & Expertise
  skills: string[];
  tools: string[];
  certifications: string[];
  
  // Step 3: Collaboration Preferences
  looking_for: string[];
  collaboration_type: string[];
  project_interests: string[];
  
  // Step 4: Availability & Location
  location_city: string;
  location_country: string;
  timezone: string;
  remote_only: boolean;
  availability_hours_per_week: number;
  
  // Step 5: Personality & Work Style
  personality_traits: string[];
  work_style: string[];
  values: string[];
  
  // Step 6: Goals & Preferences
  bio: string;
  languages: string[];
  ai_matching_preferences: {
    use_ai_matching: boolean;
    priority_weights: Record<string, number>;
  };
}

interface OnboardingWizardProps {
  isOpen: boolean;
  onComplete: (data: OnboardingData) => void;
  onClose: () => void;
}

const FIELD_OPTIONS = [
  'Software Development',
  'AI/Machine Learning',
  'Data Science',
  'Graphic Design',
  'Video/Animation',
  'Music Production',
  'Marketing',
  'Sales',
  'Business Management',
  'Entrepreneurship',
  'Research',
  'Teaching',
  'Medicine',
  'Law',
  'Finance'
];

const EXPERIENCE_LEVELS = [
  'Student',
  'Junior (0-2 years)',
  'Mid-level (2-5 years)',
  'Senior (5-10 years)',
  'Expert (10+ years)',
  'Mentor/Advisor'
];

const COLLABORATION_TYPES = [
  'Co-founder',
  'Project Partner',
  'Freelance Collaboration',
  'Learning Partner',
  'Mentorship',
  'Investment/Funding',
  'Advisory',
  'Volunteer Work',
  'Research Partner'
];

const PERSONALITY_TRAITS = [
  'Collaborative',
  'Analytical',
  'Creative',
  'Detail-oriented',
  'Innovative',
  'Leadership',
  'Adaptable',
  'Communicative',
  'Problem-solver',
  'Mentoring'
];

const WORK_STYLES = [
  'Remote-first',
  'Flexible hours',
  'Structured',
  'Agile',
  'Independent',
  'Team-oriented',
  'Fast-paced',
  'Quality-focused'
];

const VALUES = [
  'Innovation',
  'Quality',
  'Collaboration',
  'Learning',
  'Impact',
  'Sustainability',
  'Diversity',
  'Transparency',
  'Growth'
];

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  isOpen,
  onComplete,
  onClose
}) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    name: user?.name || '',
    role: '',
    field: '',
    experience_level: '',
    skills: [],
    tools: [],
    certifications: [],
    looking_for: [],
    collaboration_type: [],
    project_interests: [],
    location_city: '',
    location_country: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    remote_only: false,
    availability_hours_per_week: 20,
    personality_traits: [],
    work_style: [],
    values: [],
    bio: '',
    languages: ['English'],
    ai_matching_preferences: {
      use_ai_matching: true,
      priority_weights: {
        skills: 0.2,
        experience: 0.15,
        location: 0.1,
        availability: 0.15,
        personality: 0.2,
        values: 0.2
      }
    }
  });

  const [customSkill, setCustomSkill] = useState('');
  const [customTool, setCustomTool] = useState('');
  const [customInterest, setCustomInterest] = useState('');

  const totalSteps = 6;

  const updateData = (field: keyof OnboardingData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const addToArray = (field: keyof OnboardingData, value: string) => {
    const currentArray = data[field] as string[];
    if (!currentArray.includes(value)) {
      updateData(field, [...currentArray, value]);
    }
  };

  const removeFromArray = (field: keyof OnboardingData, value: string) => {
    const currentArray = data[field] as string[];
    updateData(field, currentArray.filter(item => item !== value));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(data);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return data.name && data.role && data.field && data.experience_level;
      case 2:
        return data.skills.length >= 3;
      case 3:
        return data.looking_for.length >= 1 && data.collaboration_type.length >= 1;
      case 4:
        return data.location_city && data.location_country;
      case 5:
        return data.personality_traits.length >= 2 && data.work_style.length >= 1;
      case 6:
        return data.bio.length >= 50;
      default:
        return true;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <User className="h-12 w-12 mx-auto mb-4" style={{ color: theme.colors.primary.blue }} />
              <h2 className="text-2xl font-bold text-white mb-2">Tell us about yourself</h2>
              <p className="text-white/60">Let's start with the basics</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Full Name</label>
                <input
                  type="text"
                  value={data.name}
                  onChange={(e) => updateData('name', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:border-[#35F5FF]/50 focus:outline-none"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Current Role</label>
                <input
                  type="text"
                  value={data.role}
                  onChange={(e) => updateData('role', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:border-[#35F5FF]/50 focus:outline-none"
                  placeholder="e.g., Senior Developer, Product Designer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Professional Field</label>
                <select
                  value={data.field}
                  onChange={(e) => updateData('field', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-[#35F5FF]/50 focus:outline-none"
                >
                  <option value="">Select your field</option>
                  {FIELD_OPTIONS.map(field => (
                    <option key={field} value={field}>{field}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Experience Level</label>
                <select
                  value={data.experience_level}
                  onChange={(e) => updateData('experience_level', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-[#35F5FF]/50 focus:outline-none"
                >
                  <option value="">Select your experience level</option>
                  {EXPERIENCE_LEVELS.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Briefcase className="h-12 w-12 mx-auto mb-4" style={{ color: theme.colors.primary.purple }} />
              <h2 className="text-2xl font-bold text-white mb-2">Your Skills & Expertise</h2>
              <p className="text-white/60">What are you good at? (Select at least 3)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-3">Skills</label>
              <div className="flex flex-wrap gap-2 mb-4">
                {data.skills.map(skill => (
                  <span
                    key={skill}
                    className="flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-[#35F5FF]/20 to-[#7F6CFF]/20 text-white border border-white/20"
                  >
                    {skill}
                    <button
                      onClick={() => removeFromArray('skills', skill)}
                      className="hover:text-red-300"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && customSkill.trim()) {
                      addToArray('skills', customSkill.trim());
                      setCustomSkill('');
                    }
                  }}
                  className="flex-1 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:border-[#35F5FF]/50 focus:outline-none"
                  placeholder="Add a skill (press Enter)"
                />
                <button
                  onClick={() => {
                    if (customSkill.trim()) {
                      addToArray('skills', customSkill.trim());
                      setCustomSkill('');
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-3">Tools & Technologies</label>
              <div className="flex flex-wrap gap-2 mb-4">
                {data.tools.map(tool => (
                  <span
                    key={tool}
                    className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/80"
                  >
                    {tool}
                    <button
                      onClick={() => removeFromArray('tools', tool)}
                      className="hover:text-red-300"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customTool}
                  onChange={(e) => setCustomTool(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && customTool.trim()) {
                      addToArray('tools', customTool.trim());
                      setCustomTool('');
                    }
                  }}
                  className="flex-1 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:border-[#35F5FF]/50 focus:outline-none"
                  placeholder="Add a tool (press Enter)"
                />
                <button
                  onClick={() => {
                    if (customTool.trim()) {
                      addToArray('tools', customTool.trim());
                      setCustomTool('');
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Target className="h-12 w-12 mx-auto mb-4" style={{ color: theme.colors.primary.yellow }} />
              <h2 className="text-2xl font-bold text-white mb-2">Collaboration Preferences</h2>
              <p className="text-white/60">What kind of collaborations are you looking for?</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-3">Looking to collaborate with</label>
              <div className="grid grid-cols-2 gap-2">
                {FIELD_OPTIONS.map(field => (
                  <button
                    key={field}
                    onClick={() => {
                      if (data.looking_for.includes(field)) {
                        removeFromArray('looking_for', field);
                      } else {
                        addToArray('looking_for', field);
                      }
                    }}
                    className={`p-3 rounded-lg text-sm transition-all ${
                      data.looking_for.includes(field)
                        ? 'bg-gradient-to-r from-[#35F5FF]/20 to-[#7F6CFF]/20 border-[#35F5FF]/50 text-white'
                        : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10'
                    } border`}
                  >
                    {field}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-3">Collaboration Types</label>
              <div className="grid grid-cols-1 gap-2">
                {COLLABORATION_TYPES.map(type => (
                  <button
                    key={type}
                    onClick={() => {
                      if (data.collaboration_type.includes(type)) {
                        removeFromArray('collaboration_type', type);
                      } else {
                        addToArray('collaboration_type', type);
                      }
                    }}
                    className={`p-3 rounded-lg text-sm text-left transition-all ${
                      data.collaboration_type.includes(type)
                        ? 'bg-gradient-to-r from-[#35F5FF]/20 to-[#7F6CFF]/20 border-[#35F5FF]/50 text-white'
                        : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10'
                    } border`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-3">Project Interests</label>
              <div className="flex flex-wrap gap-2 mb-4">
                {data.project_interests.map(interest => (
                  <span
                    key={interest}
                    className="flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-[#35F5FF]/20 to-[#7F6CFF]/20 text-white border border-white/20"
                  >
                    {interest}
                    <button
                      onClick={() => removeFromArray('project_interests', interest)}
                      className="hover:text-red-300"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customInterest}
                  onChange={(e) => setCustomInterest(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && customInterest.trim()) {
                      addToArray('project_interests', customInterest.trim());
                      setCustomInterest('');
                    }
                  }}
                  className="flex-1 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:border-[#35F5FF]/50 focus:outline-none"
                  placeholder="Add project interest (press Enter)"
                />
                <button
                  onClick={() => {
                    if (customInterest.trim()) {
                      addToArray('project_interests', customInterest.trim());
                      setCustomInterest('');
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Globe className="h-12 w-12 mx-auto mb-4" style={{ color: theme.colors.primary.blue }} />
              <h2 className="text-2xl font-bold text-white mb-2">Location & Availability</h2>
              <p className="text-white/60">Help others know when and where you can collaborate</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">City</label>
                <input
                  type="text"
                  value={data.location_city}
                  onChange={(e) => updateData('location_city', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:border-[#35F5FF]/50 focus:outline-none"
                  placeholder="San Francisco"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Country</label>
                <input
                  type="text"
                  value={data.location_country}
                  onChange={(e) => updateData('location_country', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:border-[#35F5FF]/50 focus:outline-none"
                  placeholder="United States"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Timezone</label>
              <input
                type="text"
                value={data.timezone}
                onChange={(e) => updateData('timezone', e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:border-[#35F5FF]/50 focus:outline-none"
                placeholder="America/Los_Angeles"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="remote_only"
                checked={data.remote_only}
                onChange={(e) => updateData('remote_only', e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-white/10 text-[#35F5FF] focus:ring-[#35F5FF]/50"
              />
              <label htmlFor="remote_only" className="text-white/80">
                I prefer remote-only collaborations
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Available hours per week: {data.availability_hours_per_week}
              </label>
              <input
                type="range"
                min="5"
                max="60"
                value={data.availability_hours_per_week}
                onChange={(e) => updateData('availability_hours_per_week', parseInt(e.target.value))}
                className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${theme.colors.primary.blue} 0%, ${theme.colors.primary.blue} ${(data.availability_hours_per_week / 60) * 100}%, rgba(255,255,255,0.2) ${(data.availability_hours_per_week / 60) * 100}%, rgba(255,255,255,0.2) 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-white/60 mt-1">
                <span>5 hours</span>
                <span>60 hours</span>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Zap className="h-12 w-12 mx-auto mb-4" style={{ color: theme.colors.primary.yellow }} />
              <h2 className="text-2xl font-bold text-white mb-2">Work Style & Values</h2>
              <p className="text-white/60">Help us match you with compatible collaborators</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-3">Personality Traits (Select at least 2)</label>
              <div className="grid grid-cols-2 gap-2">
                {PERSONALITY_TRAITS.map(trait => (
                  <button
                    key={trait}
                    onClick={() => {
                      if (data.personality_traits.includes(trait)) {
                        removeFromArray('personality_traits', trait);
                      } else {
                        addToArray('personality_traits', trait);
                      }
                    }}
                    className={`p-3 rounded-lg text-sm transition-all ${
                      data.personality_traits.includes(trait)
                        ? 'bg-gradient-to-r from-[#35F5FF]/20 to-[#7F6CFF]/20 border-[#35F5FF]/50 text-white'
                        : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10'
                    } border`}
                  >
                    {trait}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-3">Work Style</label>
              <div className="grid grid-cols-2 gap-2">
                {WORK_STYLES.map(style => (
                  <button
                    key={style}
                    onClick={() => {
                      if (data.work_style.includes(style)) {
                        removeFromArray('work_style', style);
                      } else {
                        addToArray('work_style', style);
                      }
                    }}
                    className={`p-3 rounded-lg text-sm transition-all ${
                      data.work_style.includes(style)
                        ? 'bg-gradient-to-r from-[#35F5FF]/20 to-[#7F6CFF]/20 border-[#35F5FF]/50 text-white'
                        : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10'
                    } border`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-3">Values</label>
              <div className="grid grid-cols-3 gap-2">
                {VALUES.map(value => (
                  <button
                    key={value}
                    onClick={() => {
                      if (data.values.includes(value)) {
                        removeFromArray('values', value);
                      } else {
                        addToArray('values', value);
                      }
                    }}
                    className={`p-3 rounded-lg text-sm transition-all ${
                      data.values.includes(value)
                        ? 'bg-gradient-to-r from-[#35F5FF]/20 to-[#7F6CFF]/20 border-[#35F5FF]/50 text-white'
                        : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10'
                    } border`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Sparkles className="h-12 w-12 mx-auto mb-4" style={{ color: theme.colors.primary.purple }} />
              <h2 className="text-2xl font-bold text-white mb-2">Final Touches</h2>
              <p className="text-white/60">Tell us about yourself and set your preferences</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Bio (minimum 50 characters)
              </label>
              <textarea
                value={data.bio}
                onChange={(e) => updateData('bio', e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:border-[#35F5FF]/50 focus:outline-none resize-none"
                placeholder="Tell potential collaborators about yourself, your experience, and what you're passionate about..."
              />
              <div className="text-xs text-white/60 mt-1">
                {data.bio.length}/50 characters minimum
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-3">Languages</label>
              <div className="flex flex-wrap gap-2">
                {data.languages.map(language => (
                  <span
                    key={language}
                    className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/80"
                  >
                    {language}
                    {language !== 'English' && (
                      <button
                        onClick={() => removeFromArray('languages', language)}
                        className="hover:text-red-300"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-center gap-3 mb-3">
                <input
                  type="checkbox"
                  id="ai_matching"
                  checked={data.ai_matching_preferences.use_ai_matching}
                  onChange={(e) => updateData('ai_matching_preferences', {
                    ...data.ai_matching_preferences,
                    use_ai_matching: e.target.checked
                  })}
                  className="w-4 h-4 rounded border-white/20 bg-white/10 text-[#35F5FF] focus:ring-[#35F5FF]/50"
                />
                <label htmlFor="ai_matching" className="text-white/80 font-medium">
                  Enable AI-powered matching
                </label>
              </div>
              <p className="text-xs text-white/60">
                Our AI will analyze your profile and preferences to suggest the most compatible collaborators.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gradient-to-br from-[#0A0F1C] to-[#1A1F3A] rounded-2xl border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold text-white">Welcome to ALLIV</h1>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5 text-white/60" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-white/10 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
                  transition={{ duration: 0.3 }}
                  className="h-2 rounded-full bg-gradient-to-r from-[#35F5FF] to-[#7F6CFF]"
                />
              </div>
              <span className="text-sm text-white/60">
                {currentStep} of {totalSteps}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/10 flex items-center justify-between">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-white/80 hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft size={16} />
              Previous
            </button>

            <button
              onClick={nextStep}
              disabled={!isStepValid()}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#35F5FF] to-[#7F6CFF] text-black font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentStep === totalSteps ? (
                <>
                  <Check size={16} />
                  Complete Setup
                </>
              ) : (
                <>
                  Next
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};




