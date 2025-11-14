import { motion } from 'framer-motion';
import { useState, type ComponentType } from 'react';
import {
  Code2,
  Palette,
  Megaphone,
  BarChart3,
  Settings,
  Users,
  BookOpen,
  Video,
  Lightbulb,
  Headphones,
  Camera,
  FileText,
  X,
  Check,
} from 'lucide-react';

interface SkillCategory {
  name: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  skills: string[];
}

const skillCategories: SkillCategory[] = [
  {
    name: 'Development',
    icon: Code2,
    skills: [
      'Frontend',
      'Backend',
      'Full Stack',
      'Mobile',
      'Game Dev',
      'DevOps',
      'Cloud',
      'Security',
      'Blockchain',
      'AI/ML',
    ],
  },
  {
    name: 'Design',
    icon: Palette,
    skills: [
      'UI Design',
      'UX Design',
      'Graphic Design',
      '3D Design',
      'Animation',
      'Branding',
      'Illustration',
      'Product Design',
    ],
  },
  {
    name: 'Marketing',
    icon: Megaphone,
    skills: [
      'Digital Marketing',
      'Content Marketing',
      'SEO',
      'Social Media',
      'Email Marketing',
      'Growth Hacking',
      'Brand Strategy',
      'Analytics',
    ],
  },
  {
    name: 'Business',
    icon: BarChart3,
    skills: [
      'Product Management',
      'Project Management',
      'Business Strategy',
      'Sales',
      'Finance',
      'Operations',
      'Consulting',
      'Entrepreneurship',
    ],
  },
  {
    name: 'Content',
    icon: FileText,
    skills: [
      'Writing',
      'Copywriting',
      'Technical Writing',
      'Blogging',
      'Journalism',
      'Editing',
      'Storytelling',
      'Translation',
    ],
  },
  {
    name: 'Media',
    icon: Video,
    skills: [
      'Video Editing',
      'Photography',
      'Audio Production',
      'Podcasting',
      'Streaming',
      'Voice Acting',
      'Music Production',
      'Broadcasting',
    ],
  },
  {
    name: 'Community',
    icon: Users,
    skills: [
      'Community Building',
      'Moderation',
      'Support',
      'Event Hosting',
      'Mentoring',
      'Public Speaking',
      'Recruiting',
      'Partnerships',
    ],
  },
  {
    name: 'Learning',
    icon: BookOpen,
    skills: [
      'Curriculum Design',
      'Teaching',
      'Coaching',
      'Workshop Design',
      'Technical Mentoring',
      'Course Creation',
      'Knowledge Management',
      'Research',
    ],
  },
  {
    name: 'Experiences',
    icon: Camera,
    skills: [
      'AR/VR',
      'Experience Design',
      'Storyboarding',
      'Live Production',
      'Set Design',
      'Cinematography',
      'Sound Design',
      'Lighting',
    ],
  },
  {
    name: 'Audio',
    icon: Headphones,
    skills: [
      'Sound Engineering',
      'Mixing',
      'Mastering',
      'Composing',
      'Music Direction',
      'DJing',
      'ADR',
      'Foley',
    ],
  },
];

interface AdvancedSkillSelectorProps {
  selectedSkills: string[];
  onSkillsChange: (skills: string[]) => void;
  maxSkills?: number;
}

export const AdvancedSkillSelector = ({
  selectedSkills,
  onSkillsChange,
  maxSkills = 20,
}: AdvancedSkillSelectorProps) => {
  const [activeCategory, setActiveCategory] = useState<string>(skillCategories[0].name);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      onSkillsChange(selectedSkills.filter((s) => s !== skill));
    } else if (selectedSkills.length < maxSkills) {
      onSkillsChange([...selectedSkills, skill]);
    }
  };

  const filteredCategories = skillCategories
    .map((category) => ({
      ...category,
      skills: category.skills.filter((skill) =>
        skill.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((category) => category.skills.length > 0);

  const activeCategoryData =
    filteredCategories.find((category) => category.name === activeCategory) ||
    filteredCategories[0];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold text-white">Select Your Skills</h3>
        <p className="text-dark-text-secondary">
          Choose up to {maxSkills} skills ({selectedSkills.length}/{maxSkills} selected)
        </p>
      </div>

      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search skills..."
          className="w-full rounded-xl border border-white/15 bg-black px-10 py-3 text-white placeholder:text-white/40 focus:border-white focus:outline-none"
        />
        <Settings className="absolute left-3 top-3.5 text-white/40" size={18} />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {filteredCategories.map((category) => {
          const Icon = category.icon;
          const isActive = category.name === activeCategory;

          return (
            <motion.button
              key={category.name}
              onClick={() => setActiveCategory(category.name)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-white text-black'
                  : 'bg-white/10 text-white/60 hover:text-white'
              }`}
            >
              <Icon size={16} />
              <span>{category.name}</span>
            </motion.button>
          );
        })}
      </div>

      {selectedSkills.length > 0 && (
        <div className="rounded-xl bg-dark-card p-4">
          <h4 className="mb-3 font-semibold text-white">Selected Skills</h4>
          <div className="flex flex-wrap gap-2">
            {selectedSkills.map((skill) => (
              <motion.button
                key={skill}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                onClick={() => toggleSkill(skill)}
                className="flex items-center gap-2 rounded-full border border-white px-3 py-1.5 text-sm font-medium text-black shadow-sm transition-colors"
                style={{ background: '#fff' }}
              >
                <span>{skill}</span>
                <X size={14} aria-hidden="true" />
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {activeCategoryData && (
        <motion.div
          key={activeCategoryData.name}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <h4 className="flex items-center gap-2 font-semibold text-white">
            <activeCategoryData.icon size={20} className="text-white" />
            {activeCategoryData.name} Skills
          </h4>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {activeCategoryData.skills.map((skill) => {
              const isSelected = selectedSkills.includes(skill);
              const isMaxed = selectedSkills.length >= maxSkills && !isSelected;

              return (
                <motion.button
                  key={skill}
                  onClick={() => !isMaxed && toggleSkill(skill)}
                  disabled={isMaxed}
                  whileHover={{ scale: isMaxed ? 1 : 1.05 }}
                  whileTap={{ scale: isMaxed ? 1 : 0.95 }}
                  className={`flex items-center justify-between gap-2 rounded-xl border p-3 text-sm transition-colors ${
                    isSelected
                      ? 'border-white bg-white text-black'
                      : isMaxed
                      ? 'cursor-not-allowed border-white/10 text-white/30'
                      : 'border-white/15 text-white/70 hover:border-white/40 hover:text-white'
                  }`}
                >
                  <span>{skill}</span>
                  {isSelected && <Check size={16} aria-hidden="true" />}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      )}

      {filteredCategories.length === 0 && (
        <div className="py-12 text-center text-white/60">
          <Lightbulb className="mx-auto mb-4 text-white/30" size={44} />
          <p>No skills found for "{searchQuery}"</p>
        </div>
      )}

      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <h4 className="mb-2 flex items-center gap-2 font-semibold text-white">
          <Lightbulb className="text-white" size={18} />
          Pro Tip
        </h4>
        <p className="text-sm text-white/70">
          Mix skills you have with the ones you want to learn. Balanced profiles lead to stronger
          collaboration matches and more invitations.
        </p>
      </div>
    </div>
  );
};
