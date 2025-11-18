import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Users,
  DollarSign,
  MapPin,
  Plus,
  X,
  ChevronRight,
  Sparkles,
  Target,
  Briefcase,
  CheckCircle,
} from 'lucide-react';
import { Industry } from '../types/collaborator';

interface ProjectBrief {
  title: string;
  industry: Industry;
  description: string;
  objectives: string[];
  deliverables: Deliverable[];
  timeline: Timeline;
  budget: Budget;
  team: TeamRequirement[];
  location: LocationRequirement;
  additionalInfo: AdditionalInfo;
}

interface Deliverable {
  id: string;
  name: string;
  description: string;
  deadline: Date;
  priority: 'high' | 'medium' | 'low';
}

interface Timeline {
  startDate: Date;
  endDate: Date;
  milestones: Milestone[];
  flexibility: 'fixed' | 'flexible' | 'negotiable';
}

interface Milestone {
  id: string;
  name: string;
  date: Date;
  deliverables: string[];
}

interface Budget {
  total: number;
  currency: string;
  breakdown: BudgetItem[];
  paymentTerms: string;
  flexibility: 'fixed' | 'negotiable';
}

interface BudgetItem {
  category: string;
  amount: number;
  description: string;
}

interface TeamRequirement {
  role: string;
  skills: string[];
  experience: string;
  quantity: number;
  commitment: 'full-time' | 'part-time' | 'freelance';
  remote: boolean;
}

interface LocationRequirement {
  type: 'remote' | 'onsite' | 'hybrid';
  locations: string[];
  timezone: string;
  travelRequired: boolean;
}

interface AdditionalInfo {
  references: string[];
  attachments: File[];
  specialRequirements: string;
  confidential: boolean;
}

// Industry-specific templates
const industryTemplates: Partial<Record<Industry, Partial<ProjectBrief>>> = {
  [Industry.FILM]: {
    deliverables: [
      { id: '1', name: 'Script', description: 'Final screenplay', deadline: new Date(), priority: 'high' },
      { id: '2', name: 'Storyboard', description: 'Visual narrative', deadline: new Date(), priority: 'medium' },
      { id: '3', name: 'Final Cut', description: 'Edited film', deadline: new Date(), priority: 'high' }
    ],
    team: [
      { role: 'Director', skills: ['Vision', 'Leadership'], experience: '5+ years', quantity: 1, commitment: 'full-time', remote: false },
      { role: 'Cinematographer', skills: ['Camera', 'Lighting'], experience: '3+ years', quantity: 1, commitment: 'full-time', remote: false },
      { role: 'Editor', skills: ['Premiere', 'DaVinci'], experience: '3+ years', quantity: 2, commitment: 'freelance', remote: true }
    ]
  },
  [Industry.MUSIC]: {
    deliverables: [
      { id: '1', name: 'Demo', description: 'Initial tracks', deadline: new Date(), priority: 'medium' },
      { id: '2', name: 'Master Recording', description: 'Final mixed tracks', deadline: new Date(), priority: 'high' },
      { id: '3', name: 'Music Video', description: 'Visual content', deadline: new Date(), priority: 'low' }
    ],
    team: [
      { role: 'Producer', skills: ['Mixing', 'Arrangement'], experience: '5+ years', quantity: 1, commitment: 'freelance', remote: true },
      { role: 'Sound Engineer', skills: ['ProTools', 'Logic'], experience: '3+ years', quantity: 1, commitment: 'part-time', remote: false },
      { role: 'Session Musician', skills: ['Multi-instrument'], experience: '2+ years', quantity: 3, commitment: 'freelance', remote: false }
    ]
  },
  [Industry.STARTUP]: {
    deliverables: [
      { id: '1', name: 'MVP', description: 'Minimum viable product', deadline: new Date(), priority: 'high' },
      { id: '2', name: 'Pitch Deck', description: 'Investor presentation', deadline: new Date(), priority: 'high' },
      { id: '3', name: 'Go-to-Market Strategy', description: 'Launch plan', deadline: new Date(), priority: 'medium' }
    ],
    team: [
      { role: 'CTO', skills: ['Architecture', 'Leadership'], experience: '7+ years', quantity: 1, commitment: 'full-time', remote: true },
      { role: 'Full-Stack Developer', skills: ['React', 'Node.js'], experience: '3+ years', quantity: 3, commitment: 'full-time', remote: true },
      { role: 'Product Designer', skills: ['UI/UX', 'Figma'], experience: '3+ years', quantity: 1, commitment: 'full-time', remote: true }
    ]
  },
  // Additional industries can be configured here
} as const;

interface AdaptiveBriefBuilderProps {
  onSubmit: (brief: ProjectBrief) => void;
  onTeamMatch?: (requirements: TeamRequirement[]) => void;
}

export const AdaptiveBriefBuilder: React.FC<AdaptiveBriefBuilderProps> = ({
  onSubmit,
  onTeamMatch
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [brief, setBrief] = useState<Partial<ProjectBrief>>({
    industry: Industry.STARTUP,
    team: [],
    deliverables: [],
    objectives: [],
    timeline: {
      startDate: new Date(),
      endDate: new Date(),
      milestones: [],
      flexibility: 'flexible'
    },
    budget: {
      total: 0,
      currency: 'USD',
      breakdown: [],
      paymentTerms: '',
      flexibility: 'negotiable'
    },
    location: {
      type: 'remote',
      locations: [],
      timezone: '',
      travelRequired: false
    },
    additionalInfo: {
      references: [],
      attachments: [],
      specialRequirements: '',
      confidential: false
    }
  });

  const [suggestedTeam, setSuggestedTeam] = useState<TeamRequirement[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  const steps = [
    { title: 'Industry & Basics', icon: Briefcase },
    { title: 'Objectives & Deliverables', icon: Target },
    { title: 'Timeline & Milestones', icon: Calendar },
    { title: 'Budget & Resources', icon: DollarSign },
    { title: 'Team Requirements', icon: Users },
    { title: 'Location & Logistics', icon: MapPin },
    { title: 'Review & Submit', icon: CheckCircle }
  ];

  // Load industry template when industry changes
  useEffect(() => {
    const currentIndustry = brief.industry;
    if (!currentIndustry) {
      return;
    }

    const template = industryTemplates[currentIndustry];
    if (!template) {
      setSuggestedTeam([]);
      return;
    }

    setBrief(prev => ({
      ...prev,
      ...template
    }));
    setSuggestedTeam(template.team || []);
  }, [brief.industry]);

  // AI suggestions based on industry and objectives
  useEffect(() => {
    const objectives = brief.objectives ?? [];

    if (brief.industry && objectives.length > 0) {
      // Simulate AI suggestions
      const suggestions = [
        `Consider adding a ${brief.industry} specialist to your team`,
        `Timeline typically takes 3-6 months for ${brief.industry} projects`,
        `Budget range for similar projects: $50K-$200K`,
        `Recommended milestone: Initial concept review at week 2`
      ];
      setAiSuggestions(suggestions);
      return;
    }

    setAiSuggestions([]);
  }, [brief.industry, brief.objectives]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    onSubmit(brief as ProjectBrief);
  };

  const handleTeamMatch = () => {
    if (onTeamMatch && brief.team) {
      onTeamMatch(brief.team);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Industry & Basics
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Select Industry</label>
              <div className="grid grid-cols-3 gap-4">
                {Object.values(Industry).map(ind => (
                  <motion.button
                    key={ind}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setBrief(prev => ({ ...prev, industry: ind }))}
                    className={`p-4 rounded-xl border transition-all ${
                      brief.industry === ind
                        ? 'bg-gradient-to-r from-[#35F5FF] to-[#7F6CFF] border-transparent text-black'
                        : 'bg-white/5 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-lg font-medium capitalize">{ind}</div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Project Title</label>
              <input
                type="text"
                value={brief.title || ''}
                onChange={(e) => setBrief(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-[#35F5FF]/50 focus:outline-none"
                placeholder="Enter your project title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Project Description</label>
              <textarea
                value={brief.description || ''}
                onChange={(e) => setBrief(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-[#35F5FF]/50 focus:outline-none resize-none"
                rows={4}
                placeholder="Describe your project..."
              />
            </div>

            {/* AI Suggestions */}
            {aiSuggestions.length > 0 && (
              <div className="bg-gradient-to-r from-[#35F5FF]/10 to-[#7F6CFF]/10 rounded-xl p-4 border border-[#35F5FF]/20">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={16} className="text-[#35F5FF]" />
                  <span className="text-sm font-medium">AI Suggestions</span>
                </div>
                <div className="space-y-2">
                  {aiSuggestions.map((suggestion, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm text-white/80">
                      <div className="w-1 h-1 rounded-full bg-[#35F5FF] mt-2" />
                      <span>{suggestion}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 1: // Objectives & Deliverables
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Project Objectives</label>
              <div className="space-y-2">
                {brief.objectives?.map((obj, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={obj}
                      onChange={(e) => {
                        const newObjectives = [...(brief.objectives || [])];
                        newObjectives[idx] = e.target.value;
                        setBrief(prev => ({ ...prev, objectives: newObjectives }));
                      }}
                      className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                    />
                    <button
                      onClick={() => {
                        const newObjectives = brief.objectives?.filter((_, i) => i !== idx);
                        setBrief(prev => ({ ...prev, objectives: newObjectives }));
                      }}
                      className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setBrief(prev => ({ 
                    ...prev, 
                    objectives: [...(prev.objectives || []), ''] 
                  }))}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10"
                >
                  <Plus size={16} />
                  Add Objective
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Deliverables</label>
              <div className="space-y-3">
                {brief.deliverables?.map((deliverable, idx) => (
                  <div key={deliverable.id} className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        value={deliverable.name}
                        onChange={(e) => {
                          const newDeliverables = [...(brief.deliverables || [])];
                          newDeliverables[idx] = { ...deliverable, name: e.target.value };
                          setBrief(prev => ({ ...prev, deliverables: newDeliverables }));
                        }}
                        className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                        placeholder="Deliverable name"
                      />
                      <select
                        value={deliverable.priority}
                        onChange={(e) => {
                          const newDeliverables = [...(brief.deliverables || [])];
                          newDeliverables[idx] = { ...deliverable, priority: e.target.value as any };
                          setBrief(prev => ({ ...prev, deliverables: newDeliverables }));
                        }}
                        className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                      >
                        <option value="high">High Priority</option>
                        <option value="medium">Medium Priority</option>
                        <option value="low">Low Priority</option>
                      </select>
                    </div>
                    <textarea
                      value={deliverable.description}
                      onChange={(e) => {
                        const newDeliverables = [...(brief.deliverables || [])];
                        newDeliverables[idx] = { ...deliverable, description: e.target.value };
                        setBrief(prev => ({ ...prev, deliverables: newDeliverables }));
                      }}
                      className="w-full mt-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white resize-none"
                      rows={2}
                      placeholder="Description"
                    />
                  </div>
                ))}
                <button
                  onClick={() => setBrief(prev => ({ 
                    ...prev, 
                    deliverables: [...(prev.deliverables || []), {
                      id: Date.now().toString(),
                      name: '',
                      description: '',
                      deadline: new Date(),
                      priority: 'medium'
                    }] 
                  }))}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10"
                >
                  <Plus size={16} />
                  Add Deliverable
                </button>
              </div>
            </div>
          </div>
        );

      case 4: // Team Requirements
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Team Requirements</h3>
              <button
                onClick={handleTeamMatch}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#35F5FF] to-[#7F6CFF] text-black font-medium flex items-center gap-2"
              >
                <Sparkles size={16} />
                AI Team Match
              </button>
            </div>

            {/* Suggested Team */}
            {suggestedTeam.length > 0 && (
              <div className="bg-gradient-to-r from-[#35F5FF]/10 to-[#7F6CFF]/10 rounded-xl p-4 border border-[#35F5FF]/20">
                <div className="flex items-center gap-2 mb-3">
                  <Users size={16} className="text-[#35F5FF]" />
                  <span className="text-sm font-medium">Suggested Team Composition</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {suggestedTeam.map((member, idx) => (
                    <div key={idx} className="bg-white/5 rounded-lg p-3">
                      <div className="font-medium">{member.role}</div>
                      <div className="text-xs text-white/60">{member.experience}</div>
                      <div className="flex gap-1 mt-2">
                        {member.skills.slice(0, 2).map(skill => (
                          <span key={skill} className="px-2 py-1 rounded-full bg-white/10 text-xs">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setBrief(prev => ({ ...prev, team: suggestedTeam }))}
                  className="mt-3 w-full py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-sm"
                >
                  Use Suggested Team
                </button>
              </div>
            )}

            {/* Custom Team Builder */}
            <div className="space-y-3">
              {brief.team?.map((member, idx) => (
                <div key={idx} className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={member.role}
                      onChange={(e) => {
                        const newTeam = [...(brief.team || [])];
                        newTeam[idx] = { ...member, role: e.target.value };
                        setBrief(prev => ({ ...prev, team: newTeam }));
                      }}
                      className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                      placeholder="Role title"
                    />
                    <input
                      type="text"
                      value={member.experience}
                      onChange={(e) => {
                        const newTeam = [...(brief.team || [])];
                        newTeam[idx] = { ...member, experience: e.target.value };
                        setBrief(prev => ({ ...prev, team: newTeam }));
                      }}
                      className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                      placeholder="Experience required"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <input
                      type="number"
                      value={member.quantity}
                      onChange={(e) => {
                        const newTeam = [...(brief.team || [])];
                        newTeam[idx] = { ...member, quantity: parseInt(e.target.value) };
                        setBrief(prev => ({ ...prev, team: newTeam }));
                      }}
                      className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                      placeholder="Quantity"
                      min="1"
                    />
                    <select
                      value={member.commitment}
                      onChange={(e) => {
                        const newTeam = [...(brief.team || [])];
                        newTeam[idx] = { ...member, commitment: e.target.value as any };
                        setBrief(prev => ({ ...prev, team: newTeam }));
                      }}
                      className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                    >
                      <option value="full-time">Full-time</option>
                      <option value="part-time">Part-time</option>
                      <option value="freelance">Freelance</option>
                    </select>
                    <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                      <input
                        type="checkbox"
                        checked={member.remote}
                        onChange={(e) => {
                          const newTeam = [...(brief.team || [])];
                          newTeam[idx] = { ...member, remote: e.target.checked };
                          setBrief(prev => ({ ...prev, team: newTeam }));
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">Remote</span>
                    </label>
                  </div>
                </div>
              ))}
              <button
                onClick={() => setBrief(prev => ({ 
                  ...prev, 
                  team: [...(prev.team || []), {
                    role: '',
                    skills: [],
                    experience: '',
                    quantity: 1,
                    commitment: 'full-time',
                    remote: true
                  }] 
                }))}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10"
              >
                <Plus size={16} />
                Add Team Member
              </button>
            </div>
          </div>
        );

      default:
        return <div>Step content for {steps[currentStep].title}</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0F1C] to-[#1A1F3A] text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={idx} className="flex items-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCurrentStep(idx)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      idx === currentStep
                        ? 'bg-gradient-to-r from-[#35F5FF] to-[#7F6CFF] text-black'
                        : idx < currentStep
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-white/5 text-white/40'
                    }`}
                  >
                    <Icon size={18} />
                    <span className="hidden md:inline text-sm font-medium">{step.title}</span>
                  </motion.button>
                  {idx < steps.length - 1 && (
                    <div className={`w-8 h-0.5 ${
                      idx < currentStep ? 'bg-green-500' : 'bg-white/10'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10"
        >
          <h2 className="text-2xl font-bold mb-6">{steps[currentStep].title}</h2>
          {renderStepContent()}
        </motion.div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
          >
            Previous
          </button>
          {currentStep === steps.length - 1 ? (
            <button
              onClick={handleSubmit}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#35F5FF] to-[#7F6CFF] text-black font-semibold flex items-center gap-2"
            >
              Submit Project
              <CheckCircle size={18} />
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#35F5FF] to-[#7F6CFF] text-black font-semibold flex items-center gap-2"
            >
              Next
              <ChevronRight size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
