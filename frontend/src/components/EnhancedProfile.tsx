import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase,
  Award,
  Calendar,
  Globe,
  Star,
  MessageCircle,
  UserPlus,
  Clock,
  MapPin,
  Film,
  Music,
  Code,
  Palette,
  TrendingUp,
  Shield,
  CheckCircle,
  Edit,
  Grid,
  List
} from 'lucide-react';
import { CollaboratorProfile, Industry, Badge as BadgeType } from '../types/collaborator';

interface EnhancedProfileProps {
  profile: CollaboratorProfile;
  isOwnProfile?: boolean;
  onConnect?: () => void;
  onMessage?: () => void;
  onInviteToProject?: () => void;
}

export const EnhancedProfile: React.FC<EnhancedProfileProps> = ({
  profile,
  isOwnProfile = false,
  onConnect,
  onMessage,
  onInviteToProject
}) => {
  const [activeTab, setActiveTab] = useState<'portfolio' | 'skills' | 'reviews' | 'availability'>('portfolio');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedIndustry, setSelectedIndustry] = useState<Industry | 'all'>('all');

  const industryIcons: Record<Industry, any> = {
    [Industry.FILM]: Film,
    [Industry.MUSIC]: Music,
    [Industry.STARTUP]: TrendingUp,
    [Industry.TECH]: Code,
    [Industry.ART]: Palette,
    [Industry.SOCIAL]: Globe,
    [Industry.GAMING]: Code,
    [Industry.FASHION]: Palette,
    [Industry.EDUCATION]: Award,
    [Industry.HEALTHCARE]: Shield,
    [Industry.FINANCE]: TrendingUp,
    [Industry.MEDIA]: Film,
    [Industry.NONPROFIT]: Globe,
    [Industry.RESEARCH]: Award,
    [Industry.EVENT]: Calendar
  };

  const getAvailabilityColor = () => {
    switch (profile.availability.status) {
      case 'available': return '#10B981';
      case 'busy': return '#F59E0B';
      case 'on-project': return '#3B82F6';
      case 'vacation': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const renderBadge = (badge: BadgeType) => {
    const rarityColors = {
      common: 'from-gray-400 to-gray-500',
      rare: 'from-blue-400 to-blue-500',
      epic: 'from-purple-400 to-purple-500',
      legendary: 'from-yellow-400 to-yellow-500'
    };

    return (
      <motion.div
        key={badge.id}
        whileHover={{ scale: 1.1 }}
        className="relative group cursor-pointer"
      >
        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${rarityColors[badge.rarity]} p-2 shadow-lg`}>
          <div className="w-full h-full flex items-center justify-center text-white text-xl">
            {badge.icon}
          </div>
        </div>
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black/90 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
          {badge.name}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0F1C] to-[#1A1F3A] text-white">
      {/* Header Section */}
      <div className="relative">
        {/* Cover Image */}
        <div className="h-64 bg-gradient-to-r from-[#35F5FF] via-[#7F6CFF] to-[#FF8EC7] opacity-80" />
        
        {/* Profile Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#0A0F1C] to-transparent p-6">
          <div className="max-w-7xl mx-auto flex items-end gap-6">
            {/* Avatar */}
            <div className="relative">
              <img
                src={profile.basicInfo.avatar}
                alt={profile.basicInfo.name}
                className="w-32 h-32 rounded-2xl border-4 border-white/20 shadow-xl"
              />
              <div
                className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full border-2 border-[#0A0F1C]"
                style={{ backgroundColor: getAvailabilityColor() }}
              />
            </div>
            
            {/* Basic Info */}
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{profile.basicInfo.name}</h1>
              <p className="text-xl text-white/80 mb-3">{profile.basicInfo.headline}</p>
              <div className="flex flex-wrap gap-4 text-sm text-white/60">
                <span className="flex items-center gap-1">
                  <MapPin size={14} />
                  {profile.basicInfo.location}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  {profile.basicInfo.timezone}
                </span>
                <span className="flex items-center gap-1">
                  <Globe size={14} />
                  {profile.basicInfo.languages.join(', ')}
                </span>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3">
              {isOwnProfile ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center gap-2"
                >
                  <Edit size={18} />
                  Edit Profile
                </motion.button>
              ) : (
                <>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onConnect}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#35F5FF] to-[#7F6CFF] text-black font-semibold flex items-center gap-2"
                  >
                    <UserPlus size={18} />
                    Connect
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onMessage}
                    className="px-6 py-3 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center gap-2"
                  >
                    <MessageCircle size={18} />
                    Message
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onInviteToProject}
                    className="px-6 py-3 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center gap-2"
                  >
                    <Briefcase size={18} />
                    Invite to Project
                  </motion.button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white/5 backdrop-blur-xl border-y border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="grid grid-cols-6 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{profile.reputation.overall}%</div>
              <div className="text-xs text-white/60">Reputation</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{profile.reputation.completedProjects}</div>
              <div className="text-xs text-white/60">Projects</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{profile.reputation.successRate}%</div>
              <div className="text-xs text-white/60">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{profile.connections.total}</div>
              <div className="text-xs text-white/60">Connections</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{profile.reputation.responseTime}</div>
              <div className="text-xs text-white/60">Response Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold flex items-center justify-center gap-1">
                <Star size={16} className="text-yellow-400" />
                {profile.reputation.reviews.reduce((acc, r) => acc + r.rating, 0) / profile.reputation.reviews.length || 0}
              </div>
              <div className="text-xs text-white/60">Rating</div>
            </div>
          </div>
        </div>
      </div>

      {/* Badges Section */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center gap-4 mb-4">
          <Award className="text-yellow-400" />
          <h2 className="text-xl font-semibold">Achievements & Badges</h2>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {profile.reputation.badges.map(badge => renderBadge(badge))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar - Roles & Industries */}
          <div className="col-span-3 space-y-6">
            {/* Roles */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Briefcase size={18} />
                Roles
              </h3>
              <div className="space-y-3">
                {profile.roles.map((role, idx) => {
                  const Icon = industryIcons[role.industry];
                  return (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
                        <Icon size={18} />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{role.title}</div>
                        <div className="text-xs text-white/60">{role.industry} • {role.level}</div>
                        <div className="text-xs text-white/40">{role.yearsExperience} years</div>
                        {role.verified && (
                          <div className="flex items-center gap-1 text-xs text-green-400 mt-1">
                            <CheckCircle size={12} />
                            Verified
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Availability */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar size={18} />
                Availability
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/60">Status</span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium" 
                    style={{ 
                      backgroundColor: `${getAvailabilityColor()}20`,
                      color: getAvailabilityColor()
                    }}>
                    {profile.availability.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/60">Next Available</span>
                  <span className="text-sm">{new Date(profile.availability.nextAvailable).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/60">Preferred Hours</span>
                  <span className="text-sm">{profile.availability.preferredHours}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/60">Current Projects</span>
                  <span className="text-sm">{profile.availability.currentProjects}/{profile.availability.maxProjects}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-9">
            {/* Tabs */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
                {(['portfolio', 'skills', 'reviews', 'availability'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-lg capitalize transition-all ${
                      activeTab === tab 
                        ? 'bg-gradient-to-r from-[#35F5FF] to-[#7F6CFF] text-black font-medium' 
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              
              {activeTab === 'portfolio' && (
                <div className="flex items-center gap-4">
                  <select
                    value={selectedIndustry}
                    onChange={(e) => setSelectedIndustry(e.target.value as Industry | 'all')}
                    className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                  >
                    <option value="all">All Industries</option>
                    {Object.values(Industry).map(ind => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                  <div className="flex gap-1 p-1 bg-white/5 rounded-lg">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white/10' : ''}`}
                    >
                      <Grid size={16} />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded ${viewMode === 'list' ? 'bg-white/10' : ''}`}
                    >
                      <List size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              {activeTab === 'portfolio' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={viewMode === 'grid' ? 'grid grid-cols-3 gap-4' : 'space-y-4'}
                >
                  {profile.portfolio.featured.map(item => (
                    <motion.div
                      key={item.id}
                      whileHover={{ scale: 1.02 }}
                      className="bg-white/5 backdrop-blur-xl rounded-xl overflow-hidden border border-white/10 group cursor-pointer"
                    >
                      <div className="aspect-video relative overflow-hidden">
                        <img 
                          src={item.thumbnail} 
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="absolute bottom-4 left-4 right-4">
                            <h4 className="font-semibold mb-1">{item.title}</h4>
                            <p className="text-xs text-white/80 line-clamp-2">{item.description}</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-white/60">{item.industry}</span>
                          <span className="text-xs text-white/60">{new Date(item.date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {item.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="px-2 py-1 rounded-full bg-white/10 text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {activeTab === 'skills' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Primary Skills */}
                  <div className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10">
                    <h3 className="text-lg font-semibold mb-4">Primary Skills</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {profile.skills.primary.map(skill => (
                        <div key={skill.name} className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{skill.name}</span>
                              {skill.verified && <CheckCircle size={14} className="text-green-400" />}
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-[#35F5FF] to-[#7F6CFF]"
                                  style={{ width: `${skill.level * 20}%` }}
                                />
                              </div>
                              <span className="text-xs text-white/60">{skill.endorsed} endorsed</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tools & Software */}
                  <div className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10">
                    <h3 className="text-lg font-semibold mb-4">Tools & Software</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.tools.map(tool => (
                        <span 
                          key={tool.name}
                          className="px-3 py-1 rounded-full bg-white/10 text-sm"
                        >
                          {tool.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'reviews' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  {profile.reputation.reviews.map(review => (
                    <div key={review.id} className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10">
                      <div className="flex items-start gap-4">
                        <img 
                          src={review.reviewerAvatar} 
                          alt={review.reviewerName}
                          className="w-12 h-12 rounded-full"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <div className="font-semibold">{review.reviewerName}</div>
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star 
                                    key={i} 
                                    size={14} 
                                    className={i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'}
                                  />
                                ))}
                              </div>
                            </div>
                            <span className="text-xs text-white/60">
                              {new Date(review.date).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-white/80 mb-3">{review.comment}</p>
                          <div className="flex gap-2">
                            {review.skills.map(skill => (
                              <span key={skill} className="px-2 py-1 rounded-full bg-white/10 text-xs">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
