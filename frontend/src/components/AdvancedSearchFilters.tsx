import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Filter, X, MapPin, Clock, Award, Code, Star } from 'lucide-react';

export interface FilterOptions {
  skills: string[];
  availability: string[];
  experience: string[];
  distance: number;
  rating: number;
  verified: boolean;
  online: boolean;
}

interface AdvancedSearchFiltersProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
}

export const AdvancedSearchFilters = ({
  filters,
  onFilterChange,
}: AdvancedSearchFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const availableSkills = [
    'JavaScript', 'TypeScript', 'React', 'Vue', 'Angular', 'Node.js',
    'Python', 'Django', 'FastAPI', 'Java', 'Spring Boot', 'Go',
    'Rust', 'C++', 'C#', '.NET', 'PHP', 'Laravel', 'Ruby', 'Rails',
    'iOS', 'Android', 'Flutter', 'React Native', 'AWS', 'Azure',
    'GCP', 'Docker', 'Kubernetes', 'MongoDB', 'PostgreSQL', 'MySQL',
    'Redis', 'GraphQL', 'REST API', 'Microservices', 'DevOps',
    'UI/UX Design', 'Figma', 'Adobe XD', 'Photoshop', 'Illustrator',
    'Product Management', 'Data Science', 'Machine Learning', 'AI',
    'Blockchain', 'Web3', 'Smart Contracts', 'Game Development',
  ];

  const availabilityOptions = [
    'Full-time', 'Part-time', 'Weekends', 'Evenings', 'Flexible', 'Contract'
  ];

  const experienceLevels = [
    'Beginner', 'Intermediate', 'Advanced', 'Expert'
  ];

  const toggleSkill = (skill: string) => {
    const newSkills = filters.skills.includes(skill)
      ? filters.skills.filter(s => s !== skill)
      : [...filters.skills, skill];
    
    onFilterChange({ ...filters, skills: newSkills });
  };

  const toggleAvailability = (option: string) => {
    const newAvailability = filters.availability.includes(option)
      ? filters.availability.filter(a => a !== option)
      : [...filters.availability, option];
    
    onFilterChange({ ...filters, availability: newAvailability });
  };

  const toggleExperience = (level: string) => {
    const newExperience = filters.experience.includes(level)
      ? filters.experience.filter(e => e !== level)
      : [...filters.experience, level];
    
    onFilterChange({ ...filters, experience: newExperience });
  };

  const updateDistance = (distance: number) => {
    onFilterChange({ ...filters, distance });
  };

  const updateRating = (rating: number) => {
    onFilterChange({ ...filters, rating });
  };

  const toggleVerified = () => {
    onFilterChange({ ...filters, verified: !filters.verified });
  };

  const toggleOnline = () => {
    onFilterChange({ ...filters, online: !filters.online });
  };

  const clearFilters = () => {
    const clearedFilters: FilterOptions = {
      skills: [],
      availability: [],
      experience: [],
      distance: 50,
      rating: 0,
      verified: false,
      online: false,
    };
    onFilterChange(clearedFilters);
  };

  const activeFilterCount = 
    filters.skills.length + 
    filters.availability.length + 
    filters.experience.length +
    (filters.verified ? 1 : 0) +
    (filters.online ? 1 : 0) +
    (filters.rating > 0 ? 1 : 0) +
    (filters.distance !== 50 ? 1 : 0);

  return (
    <>
      {/* Filter Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center gap-2 px-6 py-3 rounded-full border border-white/15 text-white/80 font-medium transition-colors hover:text-white"
      >
        <Filter size={20} />
        <span>Filters</span>
        {activeFilterCount > 0 && (
          <span className="absolute -top-2 -right-2 flex items-center justify-center w-6 h-6 rounded-full bg-white text-black text-xs font-semibold">
            {activeFilterCount}
          </span>
        )}
      </motion.button>

      {/* Filter Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />

            {/* Filter Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 z-50 h-full w-full max-w-lg overflow-y-auto border-l border-white/10 bg-black/95 shadow-2xl"
            >
              <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-dark-border">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Advanced Filters</h2>
                    {activeFilterCount > 0 && (
                      <p className="text-sm text-dark-text-secondary mt-1">
                        {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-dark-card rounded-lg transition-colors"
                  >
                    <X size={24} className="text-white" />
                  </button>
                </div>

                {/* Skills */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <Code size={20} className="text-white" />
                    <h3>Skills</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {availableSkills.map((skill) => (
                      <button
                        key={skill}
                        onClick={() => toggleSkill(skill)}
                        className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                          filters.skills.includes(skill)
                            ? 'border-white bg-white text-black'
                            : 'border-white/15 text-white/60 hover:border-white/40 hover:text-white'
                        }`}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Availability */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <Clock size={20} className="text-white" />
                    <h3>Availability</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {availabilityOptions.map((option) => (
                      <button
                        key={option}
                        onClick={() => toggleAvailability(option)}
                        className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                          filters.availability.includes(option)
                            ? 'border-white bg-white text-black'
                            : 'border-white/15 text-white/60 hover:border-white/40 hover:text-white'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Experience Level */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <Award size={20} className="text-white" />
                    <h3>Experience Level</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {experienceLevels.map((level) => (
                      <button
                        key={level}
                        onClick={() => toggleExperience(level)}
                        className={`rounded-xl border px-4 py-3 text-sm transition-colors ${
                          filters.experience.includes(level)
                            ? 'border-white bg-white text-black'
                            : 'border-white/15 text-white/60 hover:border-white/40 hover:text-white'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Distance */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white font-semibold">
                      <MapPin size={20} className="text-white" />
                      <h3>Distance</h3>
                    </div>
                    <span className="font-semibold text-white">{filters.distance} km</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="200"
                    value={filters.distance}
                    onChange={(e) => updateDistance(Number(e.target.value))}
                    className="w-full h-2 rounded-lg bg-white/10 accent-white"
                  />
                </div>

                {/* Rating */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-semibold text-white">
                      <Star size={18} />
                      <h3>Minimum Rating</h3>
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => updateRating(star)}
                          className={`transition-colors ${
                            star <= filters.rating ? 'text-white' : 'text-white/25'
                          }`}
                        >
                          <Star
                            size={18}
                            fill={star <= filters.rating ? 'currentColor' : 'none'}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Toggle Filters */}
                  <div className="space-y-3">
                    <button
                      onClick={toggleVerified}
                      className={`flex w-full items-center justify-between rounded-lg border p-4 transition-colors ${
                        filters.verified
                          ? 'border-white bg-white/10'
                          : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      <span className="text-white font-medium">Verified Only</span>
                      <div
                        className={`flex h-6 w-12 items-center rounded-full border transition-colors ${
                          filters.verified ? 'border-white bg-white' : 'border-white/20'
                        }`}
                      >
                        <motion.div
                          animate={{ x: filters.verified ? 18 : 0 }}
                          className="h-4 w-4 rounded-full bg-black"
                        />
                      </div>
                    </button>

                    <button
                      onClick={toggleOnline}
                      className={`flex w-full items-center justify-between rounded-lg border p-4 transition-colors ${
                        filters.online
                          ? 'border-white bg-white/10'
                          : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      <span className="text-white font-medium">Online Now</span>
                      <div
                        className={`flex h-6 w-12 items-center rounded-full border transition-colors ${
                          filters.online ? 'border-white bg-white' : 'border-white/20'
                        }`}
                      >
                        <motion.div
                          animate={{ x: filters.online ? 18 : 0 }}
                          className="h-4 w-4 rounded-full bg-black"
                        />
                      </div>
                    </button>
                  </div>

                {/* Actions */}
                <div className="flex gap-3 border-t border-white/10 pt-4">
                  <button
                    onClick={clearFilters}
                    className="flex-1 rounded-xl border border-white/20 px-6 py-3 text-white/70 transition-colors hover:border-white/40 hover:text-white"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="flex-1 rounded-xl bg-white px-6 py-3 font-semibold text-black transition-transform hover:-translate-y-0.5"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

