import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Users,
  Calendar,
  MessageCircle,
  Briefcase,
  Star,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Sparkles,
  Target,
  Zap
} from 'lucide-react';
import { theme } from '../styles/theme';
import api from '../services/api';

interface MatchInsight {
  match_reasons: string[];
  compatibility_score: number;
  skill_overlap: string[];
  complementary_skills: string[];
  shared_interests: string[];
  location_compatibility: {
    same_city: boolean;
    same_country: boolean;
    both_remote: boolean;
  };
  availability_match: {
    timezone_compatible: boolean;
    availability_ratio: number;
    overlap_assessment: string;
  };
  suggested_projects: Array<{
    title: string;
    description: string;
    duration: string;
  }>;
  conversation_starters: string[];
  collaboration_potential: 'High' | 'Medium' | 'Low';
  red_flags: string[];
}

interface AvailabilityBadge {
  status: 'available' | 'busy' | 'offline';
  label: string;
  description: string;
  color: string;
}

interface SuggestedAction {
  action: string;
  label: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  icon: string;
  data?: any;
}

interface AIInsightsPanelProps {
  userId: string;
  isVisible: boolean;
  onClose: () => void;
  onAction: (action: string, data?: any) => void;
  className?: string;
}

export const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({
  userId,
  isVisible,
  onClose,
  onAction,
  className = ''
}) => {
  const [insights, setInsights] = useState<MatchInsight | null>(null);
  const [availability, setAvailability] = useState<AvailabilityBadge | null>(null);
  const [suggestedActions, setSuggestedActions] = useState<SuggestedAction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']));
  const [aiConfidence, setAiConfidence] = useState(0);

  useEffect(() => {
    if (isVisible && userId) {
      fetchInsights();
    }
  }, [isVisible, userId]);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.insights.getMatchInsights(userId);

      if (response.error) throw new Error(response.error);

      const data = response.data;
      setInsights(data.insights);
      setAvailability(data.availability);
      setSuggestedActions(data.suggested_actions);
      setAiConfidence(data.ai_confidence);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load insights');
      // Fallback to mock data for development
      setInsights({
        match_reasons: [
          "Shared expertise in React and Node.js",
          "Compatible timezones for collaboration",
          "Common interest in startup projects"
        ],
        compatibility_score: 0.85,
        skill_overlap: ["React", "JavaScript", "Node.js"],
        complementary_skills: ["UI/UX Design", "Product Management", "DevOps"],
        shared_interests: ["Startup projects", "Web applications", "Open source"],
        location_compatibility: {
          same_city: false,
          same_country: true,
          both_remote: true
        },
        availability_match: {
          timezone_compatible: true,
          availability_ratio: 0.8,
          overlap_assessment: "High"
        },
        suggested_projects: [
          {
            title: "SaaS Dashboard",
            description: "Build a modern analytics dashboard with real-time data",
            duration: "2-3 months"
          },
          {
            title: "Mobile App MVP",
            description: "Create a minimum viable product for a mobile application",
            duration: "1-2 months"
          }
        ],
        conversation_starters: [
          "I noticed we both work with React. What's your favorite project you've built with it?",
          "Your experience in startups caught my attention. What's the most valuable lesson you've learned?",
          "I'd love to hear about your approach to full-stack development."
        ],
        collaboration_potential: "High",
        red_flags: []
      });
      setAvailability({
        status: "available",
        label: "Online now",
        description: "Active within the last 15 minutes",
        color: "#10B981"
      });
      setSuggestedActions([
        {
          action: "send_message",
          label: "Send Message",
          description: "Start a conversation with a personalized message",
          priority: "high",
          icon: "MessageCircle"
        },
        {
          action: "invite_project",
          label: "Invite to Project",
          description: "Invite them to collaborate on a specific project",
          priority: "high",
          icon: "Users"
        },
        {
          action: "schedule_call",
          label: "Schedule Call",
          description: "Set up a brief introduction call",
          priority: "medium",
          icon: "Calendar"
        }
      ]);
      setAiConfidence(0.85);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const getCompatibilityColor = (score: number) => {
    if (score >= 0.8) return '#10B981'; // Green
    if (score >= 0.6) return '#F59E0B'; // Yellow
    return '#EF4444'; // Red
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return theme.colors.primary.blue;
      case 'medium': return theme.colors.primary.yellow;
      case 'low': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getIconComponent = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      MessageCircle,
      Users,
      Calendar,
      Briefcase,
      Target,
      Zap
    };
    return iconMap[iconName] || MessageCircle;
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 300 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className={`fixed right-0 top-0 h-full w-96 bg-gradient-to-b from-[#0A0F1C] to-[#1A1F3A] border-l border-white/10 backdrop-blur-xl z-50 overflow-y-auto ${className}`}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#0A0F1C]/95 to-[#1A1F3A]/95 backdrop-blur-xl border-b border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-[#35F5FF]/20 to-[#7F6CFF]/20 border border-white/10">
                <Brain className="h-5 w-5" style={{ color: theme.colors.primary.blue }} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">AI Insights</h2>
                <p className="text-xs text-white/60">Collaboration analysis</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <ChevronUp className="h-4 w-4 text-white/60" />
            </button>
          </div>

          {/* AI Confidence */}
          <div className="flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-yellow-400" />
            <span className="text-white/70">AI Confidence:</span>
            <span className="font-semibold" style={{ color: getCompatibilityColor(aiConfidence) }}>
              {Math.round(aiConfidence * 100)}%
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-white/60">
              <Loader2 className="h-8 w-8 animate-spin mb-3" />
              <p>Analyzing compatibility...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-3" />
              <p className="text-red-200 text-sm">{error}</p>
              <button
                onClick={fetchInsights}
                className="mt-3 px-4 py-2 rounded-lg bg-white/10 text-white/80 hover:bg-white/20 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : insights ? (
            <>
              {/* Overview Section */}
              <div className="space-y-4">
                <button
                  onClick={() => toggleSection('overview')}
                  className="flex items-center justify-between w-full text-left"
                >
                  <h3 className="text-white font-medium">Overview</h3>
                  {expandedSections.has('overview') ? 
                    <ChevronUp className="h-4 w-4 text-white/60" /> : 
                    <ChevronDown className="h-4 w-4 text-white/60" />
                  }
                </button>

                <AnimatePresence>
                  {expandedSections.has('overview') && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-4"
                    >
                      {/* Compatibility Score */}
                      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-white/70 text-sm">Compatibility</span>
                          <span 
                            className="font-bold text-lg"
                            style={{ color: getCompatibilityColor(insights.compatibility_score) }}
                          >
                            {Math.round(insights.compatibility_score * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${insights.compatibility_score * 100}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-2 rounded-full"
                            style={{ 
                              background: `linear-gradient(90deg, ${getCompatibilityColor(insights.compatibility_score)}, ${getCompatibilityColor(insights.compatibility_score)}80)`
                            }}
                          />
                        </div>
                        <p className="text-xs text-white/60 mt-2">
                          {insights.collaboration_potential} collaboration potential
                        </p>
                      </div>

                      {/* Availability Status */}
                      {availability && (
                        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: availability.color }}
                            />
                            <div>
                              <p className="text-white font-medium text-sm">{availability.label}</p>
                              <p className="text-white/60 text-xs">{availability.description}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Match Reasons */}
                      <div className="space-y-2">
                        <h4 className="text-white/80 text-sm font-medium">Why you matched:</h4>
                        {insights.match_reasons.map((reason, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-start gap-2 text-sm"
                          >
                            <Star className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                            <span className="text-white/70">{reason}</span>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Skills Section */}
              <div className="space-y-4">
                <button
                  onClick={() => toggleSection('skills')}
                  className="flex items-center justify-between w-full text-left"
                >
                  <h3 className="text-white font-medium">Skills & Expertise</h3>
                  {expandedSections.has('skills') ? 
                    <ChevronUp className="h-4 w-4 text-white/60" /> : 
                    <ChevronDown className="h-4 w-4 text-white/60" />
                  }
                </button>

                <AnimatePresence>
                  {expandedSections.has('skills') && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-4"
                    >
                      {/* Shared Skills */}
                      {insights.skill_overlap.length > 0 && (
                        <div>
                          <h4 className="text-white/80 text-sm font-medium mb-2">Shared Skills</h4>
                          <div className="flex flex-wrap gap-2">
                            {insights.skill_overlap.map((skill, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 rounded-full bg-green-500/20 text-green-300 text-xs border border-green-500/30"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Complementary Skills */}
                      {insights.complementary_skills.length > 0 && (
                        <div>
                          <h4 className="text-white/80 text-sm font-medium mb-2">Complementary Skills</h4>
                          <div className="flex flex-wrap gap-2">
                            {insights.complementary_skills.slice(0, 6).map((skill, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs border border-blue-500/30"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Project Suggestions */}
              {insights.suggested_projects.length > 0 && (
                <div className="space-y-4">
                  <button
                    onClick={() => toggleSection('projects')}
                    className="flex items-center justify-between w-full text-left"
                  >
                    <h3 className="text-white font-medium">Project Ideas</h3>
                    {expandedSections.has('projects') ? 
                      <ChevronUp className="h-4 w-4 text-white/60" /> : 
                      <ChevronDown className="h-4 w-4 text-white/60" />
                    }
                  </button>

                  <AnimatePresence>
                    {expandedSections.has('projects') && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="space-y-3"
                      >
                        {insights.suggested_projects.map((project, index) => (
                          <div
                            key={index}
                            className="bg-white/5 rounded-lg p-3 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                            onClick={() => onAction('suggest_project', project)}
                          >
                            <h4 className="text-white font-medium text-sm mb-1">{project.title}</h4>
                            <p className="text-white/60 text-xs mb-2">{project.description}</p>
                            <div className="flex items-center gap-2 text-xs">
                              <Clock className="h-3 w-3 text-white/40" />
                              <span className="text-white/40">{project.duration}</span>
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Conversation Starters */}
              {insights.conversation_starters.length > 0 && (
                <div className="space-y-4">
                  <button
                    onClick={() => toggleSection('conversation')}
                    className="flex items-center justify-between w-full text-left"
                  >
                    <h3 className="text-white font-medium">Conversation Starters</h3>
                    {expandedSections.has('conversation') ? 
                      <ChevronUp className="h-4 w-4 text-white/60" /> : 
                      <ChevronDown className="h-4 w-4 text-white/60" />
                    }
                  </button>

                  <AnimatePresence>
                    {expandedSections.has('conversation') && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="space-y-2"
                      >
                        {insights.conversation_starters.slice(0, 3).map((starter, index) => (
                          <div
                            key={index}
                            className="bg-white/5 rounded-lg p-3 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                            onClick={() => onAction('use_starter', starter)}
                          >
                            <p className="text-white/80 text-sm">{starter}</p>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Red Flags */}
              {insights.red_flags.length > 0 && (
                <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/20">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-red-300 font-medium text-sm mb-2">Potential Concerns</h4>
                      {insights.red_flags.map((flag, index) => (
                        <p key={index} className="text-red-200/80 text-xs mb-1">{flag}</p>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Suggested Actions */}
              <div className="space-y-3">
                <h3 className="text-white font-medium">Suggested Actions</h3>
                {suggestedActions.map((action, index) => {
                  const IconComponent = getIconComponent(action.icon);
                  return (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => onAction(action.action, action.data)}
                      className="w-full bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all text-left group"
                    >
                      <div className="flex items-start gap-3">
                        <div 
                          className="p-2 rounded-lg"
                          style={{ 
                            backgroundColor: `${getPriorityColor(action.priority)}20`,
                            borderColor: `${getPriorityColor(action.priority)}30`
                          }}
                        >
                          <IconComponent 
                            className="h-4 w-4" 
                            style={{ color: getPriorityColor(action.priority) }}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-white font-medium text-sm">{action.label}</h4>
                            <span 
                              className="px-2 py-0.5 rounded-full text-xs font-medium"
                              style={{ 
                                backgroundColor: `${getPriorityColor(action.priority)}20`,
                                color: getPriorityColor(action.priority)
                              }}
                            >
                              {action.priority}
                            </span>
                          </div>
                          <p className="text-white/60 text-xs">{action.description}</p>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </>
          ) : null}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};




