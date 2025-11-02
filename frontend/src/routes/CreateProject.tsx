import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Upload, X, MapPin, Users, Calendar, ArrowLeft } from 'lucide-react';
import { Layout } from '../components/Layout';
import { GlassButton } from '../components/GlassButton';
import { fadeInUp, stagger } from '../lib/motion';
import { useAuth } from '../hooks/useAuth';

const categories = [
  'Technology', 'Design', 'Media', 'Music', 'Art', 
  'Business', 'Education', 'Health', 'Social', 'Other'
];

const skillsOptions = [
  'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python',
  'UI/UX Design', 'Figma', 'Photography', 'Video Editing',
  'Music Production', 'Content Writing', 'Marketing'
];

export const CreateProject = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    rolesNeeded: [] as string[],
    location: '',
    isRemote: false,
    skills: [] as string[],
    deadline: '',
    budget: '',
    image: null as File | null
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.size <= 5 * 1024 * 1024) { // 5MB limit
      setFormData({ ...formData, image: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setErrors({ ...errors, image: 'Image must be less than 5MB' });
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

  const addRole = () => {
    const role = prompt('Enter role needed (e.g., "Frontend Developer"):');
    if (role && role.trim()) {
      setFormData(prev => ({
        ...prev,
        rolesNeeded: [...prev.rolesNeeded, role.trim()]
      }));
    }
  };

  const removeRole = (index: number) => {
    setFormData(prev => ({
      ...prev,
      rolesNeeded: prev.rolesNeeded.filter((_, i) => i !== index)
    }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (formData.rolesNeeded.length === 0) newErrors.rolesNeeded = 'At least one role is required';
    if (formData.skills.length < 3) newErrors.skills = 'Select at least 3 required skills';
    if (!formData.isRemote && !formData.location.trim()) newErrors.location = 'Location is required for non-remote projects';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setLoading(true);
    
    try {
      // Create form data for upload
      const projectData = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'skills' || key === 'rolesNeeded') {
          projectData.append(key, JSON.stringify(value));
        } else if (value !== null) {
          projectData.append(key, value as string | Blob);
        }
      });

      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Success - navigate to projects page
      navigate('/projects');
    } catch (error) {
      console.error('Failed to create project:', error);
      setErrors({ submit: 'Failed to create project. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <motion.div
          variants={stagger(0.1)}
          initial="hidden"
          animate="show"
        >
          {/* Header */}
          <motion.div variants={fadeInUp} className="mb-8">
            <button
              onClick={() => navigate('/projects')}
              className="flex items-center gap-2 text-white/60 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Projects
            </button>
            <h1 className="text-3xl font-bold text-white mb-2">Create New Project</h1>
            <p className="text-white/60">Describe what you're building and who you need</p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <motion.div variants={fadeInUp} className="glass-card rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Basic Information</h2>
              
              {/* Title */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Project Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-surface border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-accent-blue transition-colors"
                  placeholder="e.g., AI-Powered Social App"
                />
                {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title}</p>}
              </div>

              {/* Description */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-surface border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-accent-blue transition-colors resize-none"
                  placeholder="Describe your project, its goals, and what makes it exciting..."
                  rows={4}
                />
                {errors.description && <p className="text-red-400 text-sm mt-1">{errors.description}</p>}
              </div>

              {/* Category */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-surface border border-white/10 rounded-xl text-white focus:outline-none focus:border-accent-blue transition-colors"
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                {errors.category && <p className="text-red-400 text-sm mt-1">{errors.category}</p>}
              </div>

              {/* Project Image */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Project Image (Optional)
                </label>
                <div className="flex items-center gap-4">
                  {imagePreview ? (
                    <div className="relative">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-32 h-32 object-cover rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview('');
                          setFormData({ ...formData, image: null });
                        }}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ) : (
                    <label className="w-32 h-32 flex flex-col items-center justify-center border-2 border-dashed border-white/20 rounded-xl hover:border-white/40 cursor-pointer transition-colors">
                      <Upload className="w-8 h-8 text-white/40 mb-2" />
                      <span className="text-xs text-white/40">Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                {errors.image && <p className="text-red-400 text-sm mt-1">{errors.image}</p>}
              </div>
            </motion.div>

            {/* Team Requirements */}
            <motion.div variants={fadeInUp} className="glass-card rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Team Requirements</h2>
              
              {/* Roles Needed */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Roles Needed *
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.rolesNeeded.map((role, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-accent-blue/20 text-accent-blue rounded-full text-sm flex items-center gap-2"
                    >
                      {role}
                      <button
                        type="button"
                        onClick={() => removeRole(index)}
                        className="hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addRole}
                  className="px-4 py-2 glass rounded-lg text-sm text-white/60 hover:text-white transition-colors"
                >
                  + Add Role
                </button>
                {errors.rolesNeeded && <p className="text-red-400 text-sm mt-1">{errors.rolesNeeded}</p>}
              </div>

              {/* Required Skills */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Required Skills * (Select at least 3)
                </label>
                <div className="flex flex-wrap gap-2">
                  {skillsOptions.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`px-3 py-1 rounded-full text-sm transition-all ${
                        formData.skills.includes(skill)
                          ? 'bg-accent-blue text-white'
                          : 'glass text-white/70 hover:text-white'
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
                {errors.skills && <p className="text-red-400 text-sm mt-1">{errors.skills}</p>}
              </div>
            </motion.div>

            {/* Location & Timeline */}
            <motion.div variants={fadeInUp} className="glass-card rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Location & Timeline</h2>
              
              {/* Remote Toggle */}
              <div className="mb-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isRemote}
                    onChange={(e) => setFormData({ ...formData, isRemote: e.target.checked })}
                    className="w-5 h-5 rounded"
                  />
                  <span className="text-white/80">This is a remote project</span>
                </label>
              </div>

              {/* Location */}
              {!formData.isRemote && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    <MapPin className="inline w-4 h-4 mr-1" />
                    Location *
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-surface border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-accent-blue transition-colors"
                    placeholder="City, Country"
                  />
                  {errors.location && <p className="text-red-400 text-sm mt-1">{errors.location}</p>}
                </div>
              )}

              {/* Deadline */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-white/80 mb-2">
                  <Calendar className="inline w-4 h-4 mr-1" />
                  Estimated Deadline (Optional)
                </label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-surface border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-accent-blue transition-colors"
                />
              </div>

              {/* Budget */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Budget (Optional)
                </label>
                <input
                  type="text"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-surface border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-accent-blue transition-colors"
                  placeholder="e.g., Equity-based, $5000, Volunteer"
                />
              </div>
            </motion.div>

            {/* Error Message */}
            {errors.submit && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 bg-red-500/10 border border-red-500 rounded-xl text-red-500"
              >
                {errors.submit}
              </motion.div>
            )}

            {/* Submit Buttons */}
            <motion.div variants={fadeInUp} className="flex gap-4">
              <GlassButton
                variant="secondary"
                onClick={() => navigate('/projects')}
                fullWidth
                type="button"
              >
                Cancel
              </GlassButton>
              <GlassButton
                variant="primary"
                type="submit"
                fullWidth
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Project'}
              </GlassButton>
            </motion.div>
          </form>
        </motion.div>
      </div>
    </Layout>
  );
};
