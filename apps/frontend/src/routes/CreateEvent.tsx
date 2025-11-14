import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Upload, X, MapPin, Users, Calendar, Clock, Link, ArrowLeft } from 'lucide-react';
import { Layout } from '../components/Layout';
import { GlassButton } from '../components/GlassButton';
import { fadeInUp, stagger } from '../lib/motion';
import { useAuth } from '../hooks/useAuth';

const eventTypes = [
  'Meetup', 'Workshop', 'Hackathon', 'Conference', 
  'Networking', 'Social', 'Training', 'Launch', 'Other'
];

export const CreateEvent = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: '',
    date: '',
    time: '',
    duration: '',
    isOnline: false,
    location: '',
    onlineLink: '',
    capacity: '',
    tags: [] as string[],
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

  const addTag = () => {
    const tag = prompt('Enter a tag for your event:');
    if (tag && tag.trim() && !formData.tags.includes(tag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag.trim()]
      }));
    }
  };

  const removeTag = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) newErrors.name = 'Event name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.type) newErrors.type = 'Event type is required';
    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.time) newErrors.time = 'Time is required';
    if (!formData.duration) newErrors.duration = 'Duration is required';
    
    if (formData.isOnline) {
      if (!formData.onlineLink.trim()) newErrors.onlineLink = 'Online meeting link is required';
    } else {
      if (!formData.location.trim()) newErrors.location = 'Location is required for in-person events';
    }
    
    if (formData.capacity && parseInt(formData.capacity) < 1) {
      newErrors.capacity = 'Capacity must be at least 1';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setLoading(true);
    
    try {
      // Create form data for upload
      const eventData = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'tags') {
          eventData.append(key, JSON.stringify(value));
        } else if (value !== null && value !== undefined) {
          eventData.append(key, value as string | Blob);
        }
      });

      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Success - navigate to events page
      navigate('/events');
    } catch (error) {
      console.error('Failed to create event:', error);
      setErrors({ submit: 'Failed to create event. Please try again.' });
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
              onClick={() => navigate('/events')}
              className="flex items-center gap-2 text-white/60 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Events
            </button>
            <h1 className="text-3xl font-bold text-white mb-2">Create New Event</h1>
            <p className="text-white/60">Invite collaborators to meet online or in person</p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <motion.div variants={fadeInUp} className="glass-card rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Event Details</h2>
              
              {/* Name */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Event Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-surface border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-accent-blue transition-colors"
                  placeholder="e.g., Jakarta Tech Meetup"
                />
                {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
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
                  placeholder="What's this event about? Who should attend?"
                  rows={4}
                />
                {errors.description && <p className="text-red-400 text-sm mt-1">{errors.description}</p>}
              </div>

              {/* Type */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Event Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-surface border border-white/10 rounded-xl text-white focus:outline-none focus:border-accent-blue transition-colors"
                >
                  <option value="">Select event type</option>
                  {eventTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {errors.type && <p className="text-red-400 text-sm mt-1">{errors.type}</p>}
              </div>

              {/* Event Image */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Event Banner (Optional)
                </label>
                <div className="flex items-center gap-4">
                  {imagePreview ? (
                    <div className="relative">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-full max-w-sm h-32 object-cover rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview('');
                          setFormData({ ...formData, image: null });
                        }}
                        className="absolute top-2 right-2 p-1 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ) : (
                    <label className="w-full max-w-sm h-32 flex flex-col items-center justify-center border-2 border-dashed border-white/20 rounded-xl hover:border-white/40 cursor-pointer transition-colors">
                      <Upload className="w-8 h-8 text-white/40 mb-2" />
                      <span className="text-sm text-white/40">Upload Banner</span>
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

            {/* Date & Time */}
            <motion.div variants={fadeInUp} className="glass-card rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Date & Time</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    <Calendar className="inline w-4 h-4 mr-1" />
                    Date *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-surface border border-white/10 rounded-xl text-white focus:outline-none focus:border-accent-blue transition-colors"
                  />
                  {errors.date && <p className="text-red-400 text-sm mt-1">{errors.date}</p>}
                </div>

                {/* Time */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    <Clock className="inline w-4 h-4 mr-1" />
                    Time *
                  </label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-surface border border-white/10 rounded-xl text-white focus:outline-none focus:border-accent-blue transition-colors"
                  />
                  {errors.time && <p className="text-red-400 text-sm mt-1">{errors.time}</p>}
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Duration *
                  </label>
                  <select
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-surface border border-white/10 rounded-xl text-white focus:outline-none focus:border-accent-blue transition-colors"
                  >
                    <option value="">Select duration</option>
                    <option value="30min">30 minutes</option>
                    <option value="1h">1 hour</option>
                    <option value="1.5h">1.5 hours</option>
                    <option value="2h">2 hours</option>
                    <option value="3h">3 hours</option>
                    <option value="4h">4 hours</option>
                    <option value="all-day">All day</option>
                  </select>
                  {errors.duration && <p className="text-red-400 text-sm mt-1">{errors.duration}</p>}
                </div>
              </div>
            </motion.div>

            {/* Location */}
            <motion.div variants={fadeInUp} className="glass-card rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Location</h2>
              
              {/* Online Toggle */}
              <div className="mb-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isOnline}
                    onChange={(e) => setFormData({ ...formData, isOnline: e.target.checked })}
                    className="w-5 h-5 rounded"
                  />
                  <span className="text-white/80">This is an online event</span>
                </label>
              </div>

              {formData.isOnline ? (
                /* Online Link */
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    <Link className="inline w-4 h-4 mr-1" />
                    Meeting Link *
                  </label>
                  <input
                    type="url"
                    value={formData.onlineLink}
                    onChange={(e) => setFormData({ ...formData, onlineLink: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-surface border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-accent-blue transition-colors"
                    placeholder="https://meet.google.com/..."
                  />
                  {errors.onlineLink && <p className="text-red-400 text-sm mt-1">{errors.onlineLink}</p>}
                </div>
              ) : (
                /* Physical Location */
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    <MapPin className="inline w-4 h-4 mr-1" />
                    Venue Address *
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-surface border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-accent-blue transition-colors"
                    placeholder="Venue name, Street address, City"
                  />
                  {errors.location && <p className="text-red-400 text-sm mt-1">{errors.location}</p>}
                </div>
              )}
            </motion.div>

            {/* Additional Info */}
            <motion.div variants={fadeInUp} className="glass-card rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Additional Information</h2>
              
              {/* Capacity */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-white/80 mb-2">
                  <Users className="inline w-4 h-4 mr-1" />
                  Capacity (Optional)
                </label>
                <input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-surface border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-accent-blue transition-colors"
                  placeholder="Maximum number of attendees"
                  min="1"
                />
                {errors.capacity && <p className="text-red-400 text-sm mt-1">{errors.capacity}</p>}
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Tags (Optional)
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-accent-purple/20 text-accent-purple rounded-full text-sm flex items-center gap-2"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(index)}
                        className="hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 glass rounded-lg text-sm text-white/60 hover:text-white transition-colors"
                >
                  + Add Tag
                </button>
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
                onClick={() => navigate('/events')}
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
                {loading ? 'Creating...' : 'Create Event'}
              </GlassButton>
            </motion.div>
          </form>
        </motion.div>
      </div>
    </Layout>
  );
};
