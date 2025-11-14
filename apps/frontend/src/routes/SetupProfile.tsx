import { ReactNode, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Layout } from '../components/Layout';

const inputClasses =
  'w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-white/50 focus:outline-none';

export const SetupProfile = () => {
  const navigate = useNavigate();
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

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim()) && skills.length < 6) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => setSkills(skills.filter((s) => s !== skill));

  const addInterest = () => {
    if (interestInput.trim() && !interests.includes(interestInput.trim()) && interests.length < 6) {
      setInterests([...interests, interestInput.trim()]);
      setInterestInput('');
    }
  };

  const removeInterest = (interest: string) => setInterests(interests.filter((i) => i !== interest));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) return setError('Please enter your name.');
    if (!birthdate) return setError('Please enter your birthdate.');
    if (!bio.trim()) return setError('Please write a short bio.');
    if (!skills.length) return setError('Add at least one skill.');
    if (!interests.length) return setError('Add at least one interest.');
    if (!photos.length) return setError('Upload at least one photo.');

    setLoading(true);

    try {
      const age = new Date().getFullYear() - new Date(birthdate).getFullYear();
      const token = api.getToken();
      if (!token) {
        setError('Please log in again.');
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:8000/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          age,
          bio: bio.trim(),
          skills,
          interests,
          goals: goals.trim(),
          photos,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to update profile');
      }

      navigate('/discover');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout showNavbar={false} showMobileChrome={false} padded={false}>
      <div className="min-h-screen pt-24 pb-16 px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-5xl mx-auto space-y-10"
        >
          <section className="panel p-6 sm:p-8 text-center space-y-4">
            <span className="pill mx-auto text-white/70">
              <span className="w-2 h-2 rounded-full bg-[var(--color-highlight)] block" />
              Profile setup
            </span>
            <h1 className="text-3xl font-semibold text-white">
              Give collaborators a snapshot of how you build.
            </h1>
            <p className="text-white/70 text-sm sm:text-base max-w-3xl mx-auto">
              We ask for the essentials--story, skills, interests, and a few photos--so we can introduce you to
              the right people faster.
            </p>
          </section>

          {error && (
            <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          )}

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="panel p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-8 text-white">
              <div className="grid gap-6 md:grid-cols-2">
                <Field label="Full name *" description="Keep it personal--use your real name.">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClasses}
                    placeholder="e.g., Alex Carter"
                  />
                </Field>
                <Field label="Birthdate *">
                  <input
                    type="date"
                    value={birthdate}
                    onChange={(e) => setBirthdate(e.target.value)}
                    className={inputClasses}
                  />
                </Field>
              </div>

              <Field label="Short bio *" description="Share what drives you or how you like to collaborate.">
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  className={`${inputClasses} resize-none`}
                  placeholder="Lead product designer turned indie filmmaker..."
                />
              </Field>

              <SectionWithTags
                label="Skills *"
                description="Highlight up to six tools or disciplines you lead with."
                inputValue={skillInput}
                onInputChange={setSkillInput}
                items={skills}
                onAdd={addSkill}
                onRemove={removeSkill}
                placeholder="Add a skill (e.g., React, Sound Design)"
                isError={skills.length === 0}
              />

              <SectionWithTags
                label="Interests *"
                description="Let people know what themes you're exploring right now."
                inputValue={interestInput}
                onInputChange={setInterestInput}
                items={interests}
                onAdd={addInterest}
                onRemove={removeInterest}
                placeholder="Add an interest (e.g., Climate tech, Storytelling)"
                isError={interests.length === 0}
              />

              <Field label="Goals (optional)" description="Mention the type of collaborations you're seeking.">
                <textarea
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  rows={3}
                  className={`${inputClasses} resize-none`}
                  placeholder="Looking to join a nimble team shipping health tools..."
                />
              </Field>

              <div className="space-y-3">
                <label className="text-sm font-medium text-white/80">
                  Profile photos * <span className="text-white/50">(at least one, max six)</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, index) => (
                    <div
                      key={index}
                      className="aspect-square rounded-2xl border-2 border-dashed border-white/15 bg-white/5 flex items-center justify-center relative overflow-hidden"
                    >
                      {photos[index] ? (
                        <>
                          <img src={photos[index]} alt={`Profile ${index + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => {
                              const next = [...photos];
                              next.splice(index, 1);
                              setPhotos(next);
                            }}
                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 text-white text-xs"
                          >
                            ×
                          </button>
                        </>
                      ) : (
                        <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer text-white/60 text-sm">
                          <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Add photo
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
                    </div>
                  ))}
                </div>
                {photos.length === 0 && (
                  <p className="text-xs text-red-300">Please upload at least one photo.</p>
                )}
                <p className="text-xs text-white/50">
                  Choose images that show your craft, workspace, or personality.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-white text-black font-semibold py-3 disabled:opacity-60 disabled:cursor-not-allowed hover:-translate-y-0.5 transition-transform"
              >
                {loading ? 'Saving...' : 'Complete profile'}
              </button>
            </form>
          </motion.div>

          <div className="text-center">
            <button
              onClick={() => navigate('/discover')}
              className="text-sm text-white/70 hover:text-white underline underline-offset-4"
            >
              Skip for now (finish later)
            </button>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

interface FieldProps {
  label: string;
  description?: string;
  children: ReactNode;
}

const Field = ({ label, description, children }: FieldProps) => (
  <div className="space-y-2">
    <label className="text-sm font-medium text-white/80">{label}</label>
    {children}
    {description && <p className="text-xs text-white/50">{description}</p>}
  </div>
);

interface SectionWithTagsProps {
  label: string;
  description: string;
  inputValue: string;
  onInputChange: (value: string) => void;
  items: string[];
  onAdd: () => void;
  onRemove: (value: string) => void;
  placeholder: string;
  isError?: boolean;
}

const SectionWithTags = ({
  label,
  description,
  inputValue,
  onInputChange,
  items,
  onAdd,
  onRemove,
  placeholder,
  isError,
}: SectionWithTagsProps) => (
  <div className="space-y-2">
    <label className="text-sm font-medium text-white/80">{label}</label>
    <div className="flex flex-col gap-3 sm:flex-row">
      <input
        type="text"
        value={inputValue}
        onChange={(e) => onInputChange(e.target.value)}
        className={`${inputClasses} flex-1`}
        placeholder={placeholder}
      />
      <button
        type="button"
        onClick={onAdd}
        className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-medium text-white hover:bg-white/20"
      >
        Add
      </button>
    </div>
    <p className="text-xs text-white/50">{description}</p>
    <div className="flex flex-wrap gap-2">
      {items.map((value) => (
        <span
          key={value}
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-sm text-white"
        >
          {value}
          <button
            type="button"
            onClick={() => onRemove(value)}
            className="text-white/70 hover:text-white"
            aria-label={`Remove ${value}`}
          >
            ×
          </button>
        </span>
      ))}
    </div>
    {isError && <p className="text-xs text-red-300">Add at least one item.</p>}
  </div>
);
