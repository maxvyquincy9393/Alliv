import { ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { profileAPI, ProfileUpdate } from '../services/api';
import { FullScreenLayout } from '../components/FullScreenLayout';
import { Loader2, Plus, X, Sparkles, ChevronRight, Check, ChevronLeft } from 'lucide-react';

const SUGGESTED_SKILLS = [
  // Languages
  "Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "Go", "Rust", "Swift", "Kotlin", "PHP", "Ruby", "Dart", "Scala", "Elixir", "Haskell", "Lua", "Perl", "R", "Matlab", "Assembly", "Shell",
  // Frontend
  "React", "Vue.js", "Angular", "Svelte", "Next.js", "Nuxt.js", "Remix", "Gatsby", "SolidJS", "Alpine.js", "jQuery", "HTML5", "CSS3", "Sass", "Less", "Tailwind CSS", "Bootstrap", "Material UI", "Chakra UI", "Ant Design", "Styled Components", "Framer Motion", "Three.js", "WebGL",
  // Backend
  "Node.js", "Express.js", "NestJS", "FastAPI", "Django", "Flask", "Spring Boot", "ASP.NET Core", "Laravel", "Ruby on Rails", "Phoenix", "Gin", "Echo", "Fiber", "AdonisJS", "Strapi", "WordPress",
  // Mobile
  "React Native", "Flutter", "Expo", "Ionic", "Cordova", "Xamarin", "Unity", "Unreal Engine", "Android SDK", "iOS SDK",
  // Database
  "PostgreSQL", "MySQL", "MongoDB", "Redis", "SQLite", "MariaDB", "Cassandra", "DynamoDB", "Firestore", "Supabase", "Firebase", "Realm", "Neo4j", "Elasticsearch", "CouchDB",
  // DevOps & Cloud
  "AWS", "Azure", "Google Cloud", "Docker", "Kubernetes", "Terraform", "Ansible", "Jenkins", "GitHub Actions", "GitLab CI", "CircleCI", "Travis CI", "Nginx", "Apache", "Linux", "Bash", "PowerShell", "Vercel", "Netlify", "Heroku", "DigitalOcean",
  // AI/ML & Data
  "Machine Learning", "Deep Learning", "Data Science", "TensorFlow", "PyTorch", "Keras", "Scikit-learn", "Pandas", "NumPy", "OpenCV", "NLP", "Computer Vision", "Big Data", "Hadoop", "Spark", "Kafka", "Airflow", "Tableau", "Power BI",
  // Design
  "Figma", "Adobe XD", "Sketch", "Photoshop", "Illustrator", "InDesign", "After Effects", "Premiere Pro", "Blender", "Cinema 4D", "Maya", "UI Design", "UX Design", "Prototyping", "Wireframing", "User Research",
  // Other
  "Blockchain", "Smart Contracts", "Solidity", "Web3.js", "Ethers.js", "Cybersecurity", "Penetration Testing", "Ethical Hacking", "Cryptography", "Game Development", "Embedded Systems", "IoT", "Arduino", "Raspberry Pi", "Robotics", "Agile", "Scrum", "Kanban", "Jira", "Trello", "Notion", "Slack", "Discord", "Zoom", "Microsoft Teams"
];

const SUGGESTED_INTERESTS = [
  // Tech
  "Artificial Intelligence", "Machine Learning", "Web Development", "Mobile Development", "Game Development", "Data Science", "Cloud Computing", "DevOps", "Cybersecurity", "Blockchain", "Web3", "IoT", "Robotics", "VR/AR", "Metaverse", "Open Source", "SaaS", "Startups", "Product Management", "UI/UX Design",
  // Industries
  "FinTech", "EdTech", "HealthTech", "CleanTech", "AgriTech", "PropTech", "LegalTech", "BioTech", "SpaceTech", "AdTech", "E-commerce", "Social Media", "Streaming", "Gaming", "Music", "Art", "Fashion", "Travel", "Food", "Sports", "Fitness", "Wellness", "Mental Health",
  // Hobbies & Lifestyle
  "Reading", "Writing", "Blogging", "Podcasting", "Photography", "Videography", "Drawing", "Painting", "Digital Art", "Music Production", "DJing", "Playing Instruments", "Singing", "Dancing", "Acting", "Filmmaking", "Cooking", "Baking", "Gardening", "Hiking", "Camping", "Traveling", "Yoga", "Meditation", "Running", "Cycling", "Swimming", "Martial Arts", "Team Sports", "Esports", "Board Games", "Chess", "Puzzles", "DIY", "Crafts", "Knitting", "Sewing", "Woodworking", "3D Printing", "Electronics", "Cars", "Motorcycles", "Aviation", "History", "Philosophy", "Psychology", "Economics", "Politics", "Environment", "Sustainability", "Volunteering", "Mentoring", "Teaching", "Learning Languages"
];

export const SetupProfile = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [goals, setGoals] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [interestInput, setInterestInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const addSkill = (value?: string) => {
    const skillToAdd = value || skillInput;
    if (skillToAdd.trim() && !skills.includes(skillToAdd.trim()) && skills.length < 6) {
      setSkills([...skills, skillToAdd.trim()]);
      if (!value) setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => setSkills(skills.filter((s) => s !== skill));

  const addInterest = (value?: string) => {
    const interestToAdd = value || interestInput;
    if (interestToAdd.trim() && !interests.includes(interestToAdd.trim()) && interests.length < 6) {
      setInterests([...interests, interestToAdd.trim()]);
      if (!value) setInterestInput('');
    }
  };

  const removeInterest = (interest: string) => setInterests(interests.filter((i) => i !== interest));

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      action();
    }
  };

  const nextStep = () => {
    if (step === 1) {
      if (!name.trim()) return setError('Please enter your name.');
      if (!birthdate) return setError('Please enter your birthdate.');
      if (!bio.trim()) return setError('Please write a short bio.');
    } else if (step === 2) {
      if (!skills.length) return setError('Add at least one skill.');
      if (!interests.length) return setError('Add at least one interest.');
    }
    setError('');
    setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!photos.length) return setError('Upload at least one photo.');

    setLoading(true);

    try {
      const payload: ProfileUpdate = {
        name: name.trim(),
        age: new Date().getFullYear() - new Date(birthdate).getFullYear(),
        bio: bio.trim(),
        skills,
        interests,
        photos,
      };

      if (goals.trim()) {
        payload.goals = goals.trim();
      }

      const updateResponse = await profileAPI.updateMe(payload);
      if (updateResponse.error) {
        console.error('API Error:', updateResponse.error);
        setError(updateResponse.error);
        setLoading(false);
        return;
      }

      navigate('/discover');
    } catch (err: any) {
      console.error('Profile update failed:', err);
      const errorMsg = typeof err === 'string' ? err : err?.message || 'Failed to update profile. Please try again.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const progress = (step / 3) * 100;

  return (
    <FullScreenLayout>
      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[120px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-2xl"
        >
          {/* Header */}
          <div className="text-center mb-8 space-y-2">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-4"
            >
              <Sparkles size={14} className="text-yellow-400" />
              <span className="text-xs font-medium text-white/80">Let's personalize your experience</span>
            </motion.div>
            <h1 className="text-3xl md:text-4xl font-bold text-white font-display tracking-tight">
              Build Your Profile
            </h1>
            <div className="w-full bg-white/5 h-1.5 rounded-full mt-6 overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              />
            </div>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200 flex items-center gap-3 backdrop-blur-sm"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              {error}
            </motion.div>
          )}

          <motion.div 
            className="glass-panel rounded-3xl p-8 md:p-10 relative overflow-hidden border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl"
          >
            <form onSubmit={handleSubmit}>
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="space-y-1">
                      <h2 className="text-xl font-semibold text-white">The Essentials</h2>
                      <p className="text-sm text-white/50">Tell us a bit about yourself.</p>
                    </div>
                    
                    <div className="grid gap-6 md:grid-cols-2">
                      <Field label="Full name" required>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="input-field"
                          placeholder="e.g., Alex Carter"
                          autoFocus
                        />
                      </Field>
                      <Field label="Birthdate" required>
                        <input
                          type="date"
                          value={birthdate}
                          onChange={(e) => setBirthdate(e.target.value)}
                          className="input-field [color-scheme:dark]"
                        />
                      </Field>
                    </div>

                    <Field label="Short bio" required description="What drives you? How do you collaborate?">
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={4}
                        className="input-field resize-none"
                        placeholder="I'm a product designer obsessed with clean interfaces..."
                      />
                    </Field>

                    <div className="pt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={nextStep}
                        className="btn-primary flex items-center gap-2 px-8"
                      >
                        Next <ChevronRight size={18} />
                      </button>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="space-y-1">
                      <h2 className="text-xl font-semibold text-white">Expertise & Interests</h2>
                      <p className="text-sm text-white/50">What are you good at? What do you love?</p>
                    </div>

                    <SectionWithTags
                      label="Skills"
                      description="Press Enter to add up to 6 skills."
                      inputValue={skillInput}
                      onInputChange={setSkillInput}
                      onKeyDown={(e) => handleKeyDown(e, () => addSkill())}
                      items={skills}
                      onAdd={addSkill}
                      onRemove={removeSkill}
                      placeholder="e.g. React, Figma, Python..."
                      isError={skills.length === 0}
                      suggestions={SUGGESTED_SKILLS}
                    />

                    <SectionWithTags
                      label="Interests"
                      description="What topics are you exploring right now?"
                      inputValue={interestInput}
                      onInputChange={setInterestInput}
                      onKeyDown={(e) => handleKeyDown(e, () => addInterest())}
                      items={interests}
                      onAdd={addInterest}
                      onRemove={removeInterest}
                      placeholder="e.g. AI, Climate Tech, Music..."
                      isError={interests.length === 0}
                      suggestions={SUGGESTED_INTERESTS}
                    />
                    
                    <Field label="Goals (optional)" description="What kind of projects are you looking for?">
                      <textarea
                        value={goals}
                        onChange={(e) => setGoals(e.target.value)}
                        rows={3}
                        className="input-field resize-none"
                        placeholder="Looking for a technical co-founder for a SaaS..."
                      />
                    </Field>

                    <div className="pt-4 flex justify-between">
                      <button
                        type="button"
                        onClick={prevStep}
                        className="text-white/60 hover:text-white px-4 py-2 transition-colors flex items-center gap-2"
                      >
                        <ChevronLeft size={18} /> Back
                      </button>
                      <button
                        type="button"
                        onClick={nextStep}
                        className="btn-primary flex items-center gap-2 px-8"
                      >
                        Next <ChevronRight size={18} />
                      </button>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="space-y-1">
                      <h2 className="text-xl font-semibold text-white">Gallery</h2>
                      <p className="text-sm text-white/50">Show your personality. Add at least one photo.</p>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {[...Array(6)].map((_, index) => (
                        <motion.div
                          key={index}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="aspect-[3/4] rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center relative overflow-hidden group transition-all hover:border-white/30 hover:bg-white/10"
                        >
                          {photos[index] ? (
                            <>
                              <img src={photos[index]} alt={`Profile ${index + 1}`} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = [...photos];
                                    next.splice(index, 1);
                                    setPhotos(next);
                                  }}
                                  className="p-2 rounded-full bg-white/10 hover:bg-red-500 text-white transition-colors backdrop-blur-sm"
                                >
                                  <X size={18} />
                                </button>
                              </div>
                            </>
                          ) : (
                            <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer text-white/30 hover:text-white transition-colors">
                              <Plus size={24} className="mb-2 opacity-50" />
                              <span className="text-xs font-medium">Add Photo</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file && photos.length < 6) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => setPhotos([...photos, reader.result as string]);
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>
                          )}
                        </motion.div>
                      ))}
                    </div>

                    <div className="pt-6 flex justify-between items-center">
                      <button
                        type="button"
                        onClick={prevStep}
                        className="text-white/60 hover:text-white px-4 py-2 transition-colors flex items-center gap-2"
                      >
                        <ChevronLeft size={18} /> Back
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary flex items-center gap-2 px-8 py-3 text-lg shadow-lg shadow-purple-500/20"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="animate-spin" /> Saving...
                          </>
                        ) : (
                          <>
                            Complete Profile <Check size={18} />
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </motion.div>

          <div className="text-center mt-6">
            <button
              onClick={() => navigate('/discover')}
              className="text-xs text-white/30 hover:text-white transition-colors"
            >
              Skip for now (finish later)
            </button>
          </div>
        </motion.div>
      </div>
      
      <style>{`
        .input-field {
          width: 100%;
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 0.75rem;
          color: white;
          transition: all 0.2s;
        }
        .input-field:focus {
          outline: none;
          border-color: rgba(168, 85, 247, 0.5);
          background: rgba(255, 255, 255, 0.08);
          box-shadow: 0 0 0 1px rgba(168, 85, 247, 0.5);
        }
        .input-field::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </FullScreenLayout>
  );
};

interface FieldProps {
  label: string;
  description?: string;
  children: ReactNode;
  required?: boolean;
}

const Field = ({ label, description, children, required }: FieldProps) => (
  <div className="space-y-2">
    <div className="flex justify-between items-baseline">
      <label className="text-sm font-medium text-white/80">
        {label} {required && <span className="text-purple-400">*</span>}
      </label>
    </div>
    {children}
    {description && <p className="text-xs text-white/40">{description}</p>}
  </div>
);

interface SectionWithTagsProps {
  label: string;
  description: string;
  inputValue: string;
  onInputChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  items: string[];
  onAdd: (value?: string) => void;
  onRemove: (value: string) => void;
  placeholder: string;
  isError?: boolean;
  suggestions?: string[];
}

const SectionWithTags = ({
  label,
  description,
  inputValue,
  onInputChange,
  onKeyDown,
  items,
  onAdd,
  onRemove,
  placeholder,
  isError,
  suggestions,
}: SectionWithTagsProps) => {
  const listId = `list-${label.replace(/\s+/g, '-').toLowerCase()}`;
  
  // Filter suggestions to show only those not already added AND matching input
  const availableSuggestions = suggestions?.filter(s => 
    !items.includes(s) && 
    (inputValue.trim() ? s.toLowerCase().includes(inputValue.toLowerCase()) : false)
  ) || [];
  
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-white/80">{label} <span className="text-purple-400">*</span></label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            list={suggestions ? listId : undefined}
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={onKeyDown}
            className="input-field pr-12"
            placeholder={placeholder}
          />
          {suggestions && (
            <datalist id={listId}>
              {suggestions.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          )}
          <button
            type="button"
            onClick={() => onAdd()}
            disabled={!inputValue.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-white/10 text-white/70 hover:text-white hover:bg-white/20 disabled:opacity-0 transition-all"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
      
      {/* Suggestions Chips - Only show when typing */}
      <AnimatePresence>
        {inputValue.trim() && availableSuggestions.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-2 py-1 overflow-hidden"
          >
            <span className="text-xs text-white/40 py-1 self-center mr-1">Suggestions:</span>
            {availableSuggestions.slice(0, 8).map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => onAdd(suggestion)}
                className="text-xs px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all border border-white/5 hover:border-white/10"
              >
                + {suggestion}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="min-h-[2rem] flex flex-wrap gap-2">
        <AnimatePresence>
          {items.map((value) => (
            <motion.span
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              key={value}
              className="inline-flex items-center gap-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-sm text-white pl-3 pr-2 py-1.5"
            >
              {value}
              <button
                type="button"
                onClick={() => onRemove(value)}
                className="ml-1 p-0.5 rounded-full hover:bg-white/20 text-white/70 hover:text-white transition-colors"
                aria-label={`Remove ${value}`}
              >
                <X size={14} />
              </button>
            </motion.span>
          ))}
        </AnimatePresence>
        {items.length === 0 && (
          <span className="text-sm text-white/30 italic py-1.5">No items added yet</span>
        )}
      </div>
      
      <div className="flex justify-between items-start">
        <p className="text-xs text-white/50">{description}</p>
        {isError && <p className="text-xs text-red-400">Required</p>}
      </div>
    </div>
  );
};
