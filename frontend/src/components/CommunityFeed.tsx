import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  TrendingUp,
  Users,
  Briefcase,
  Calendar,
  MapPin,
  DollarSign,
  Clock,
  Award,
  Star,
  Send,
  Plus,
  Zap,
  Target,
  Globe
} from 'lucide-react';
import { Industry } from '../types/collaborator';

interface Post {
  id: string;
  type: 'update' | 'talent-request' | 'event' | 'showcase' | 'milestone' | 'opportunity';
  author: {
    id: string;
    name: string;
    avatar: string;
    role: string;
    verified: boolean;
  };
  content: {
    text: string;
    media?: Media[];
    links?: string[];
    tags: string[];
    mentions?: string[];
  };
  project?: {
    id: string;
    name: string;
    industry: Industry;
    logo?: string;
  };
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
    bookmarks: number;
  };
  userEngagement: {
    liked: boolean;
    bookmarked: boolean;
    shared: boolean;
  };
  timestamp: Date;
  visibility: 'public' | 'connections' | 'project' | 'private';

  // Type-specific fields
  talentRequest?: TalentRequest;
  event?: EventDetails;
  showcase?: ShowcaseDetails;
  milestone?: MilestoneDetails;
  opportunity?: OpportunityDetails;
}

interface Media {
  type: 'image' | 'video' | 'audio';
  url: string;
  thumbnail?: string;
  caption?: string;
}

interface TalentRequest {
  roles: string[];
  skills: string[];
  experience: string;
  commitment: 'full-time' | 'part-time' | 'freelance' | 'contract';
  budget?: string;
  deadline: Date;
  applicants: number;
  location: 'remote' | 'onsite' | 'hybrid';
}

interface EventDetails {
  name: string;
  date: Date;
  location: string;
  type: 'workshop' | 'meetup' | 'conference' | 'webinar' | 'hackathon';
  attendees: number;
  maxAttendees: number;
  price?: number;
  registrationUrl?: string;
}

interface ShowcaseDetails {
  projectName: string;
  category: string;
  achievements: string[];
  metrics: {
    label: string;
    value: string;
  }[];
  collaborators: string[];
}

interface MilestoneDetails {
  achievement: string;
  impact: string;
  metrics?: {
    label: string;
    value: string;
  }[];
}

interface OpportunityDetails {
  title: string;
  company: string;
  type: 'job' | 'project' | 'collaboration' | 'investment';
  compensation: string;
  deadline?: Date;
  requirements: string[];
}

interface CommunityFeedProps {
  onCreatePost?: () => void;
  onEngagement?: (postId: string, type: string) => void;
}

export const CommunityFeed: React.FC<CommunityFeedProps> = ({
  onCreatePost,
  onEngagement
}) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await api.feed.getFeed();
      if (response.data) {
        // Transform API response to match component state
        setPosts(response.data.map((p: any) => ({
          id: p._id || p.id,
          type: p.type,
          author: p.author,
          content: {
            ...p.content,
            // Map backend media_urls to frontend media objects if needed
            media: p.media_urls ? p.media_urls.map((url: string) => ({
              type: 'image', // Default to image, backend doesn't store type in media_urls list
              url: url
            })) : (p.content.media || []),
            tags: p.tags || []
          },
          project: p.project,
          engagement: p.engagement || { likes: 0, comments: 0, shares: 0, views: 0, bookmarks: 0 },
          userEngagement: {
            liked: p.user_engagement?.liked || false,
            bookmarked: p.user_engagement?.bookmarked || false,
            shared: p.user_engagement?.shared || false
          },
          timestamp: new Date(p.timestamp),
          visibility: p.visibility,
          // Type specific fields might be in content or root, handle both
          talentRequest: p.talentRequest || p.content.talentRequest,
          event: p.event || p.content.event,
          showcase: p.showcase || p.content.showcase,
          milestone: p.milestone || p.content.milestone,
          opportunity: p.opportunity || p.content.opportunity
        })));
      }
    } catch (err) {
      console.error("Failed to fetch feed:", err);
      setError("Failed to load feed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const [filter, setFilter] = useState<'all' | 'following' | 'trending' | 'industry'>('all');
  const [selectedIndustry, setSelectedIndustry] = useState<Industry | 'all'>('all');
  const [showComments, setShowComments] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  const handleLike = (postId: string) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          engagement: {
            ...post.engagement,
            likes: post.userEngagement.liked
              ? post.engagement.likes - 1
              : post.engagement.likes + 1
          },
          userEngagement: {
            ...post.userEngagement,
            liked: !post.userEngagement.liked
          }
        };
      }
      return post;
    }));

    if (onEngagement) {
      onEngagement(postId, 'like');
    }
  };

  const handleBookmark = (postId: string) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          engagement: {
            ...post.engagement,
            bookmarks: post.userEngagement.bookmarked
              ? post.engagement.bookmarks - 1
              : post.engagement.bookmarks + 1
          },
          userEngagement: {
            ...post.userEngagement,
            bookmarked: !post.userEngagement.bookmarked
          }
        };
      }
      return post;
    }));

    if (onEngagement) {
      onEngagement(postId, 'bookmark');
    }
  };

  const getPostIcon = (type: Post['type']) => {
    switch (type) {
      case 'update': return Zap;
      case 'talent-request': return Users;
      case 'event': return Calendar;
      case 'showcase': return Award;
      case 'milestone': return Target;
      case 'opportunity': return Briefcase;
      default: return Zap;
    }
  };

  const getPostColor = (type: Post['type']) => {
    switch (type) {
      case 'update': return 'from-blue-500 to-cyan-500';
      case 'talent-request': return 'from-purple-500 to-pink-500';
      case 'event': return 'from-yellow-500 to-orange-500';
      case 'showcase': return 'from-green-500 to-emerald-500';
      case 'milestone': return 'from-red-500 to-pink-500';
      case 'opportunity': return 'from-indigo-500 to-purple-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const renderPostContent = (post: Post) => {
    switch (post.type) {
      case 'showcase':
        return post.showcase && (
          <div className="mt-4 bg-gradient-to-r from-white/5 to-white/10 rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-semibold">{post.showcase.projectName}</h4>
              <span className="px-3 py-1 rounded-full bg-white/10 text-xs">
                {post.showcase.category}
              </span>
            </div>

            {post.showcase.achievements.length > 0 && (
              <div className="mb-3 space-y-1">
                {post.showcase.achievements.map((achievement, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <Award size={14} className="text-yellow-400" />
                    <span>{achievement}</span>
                  </div>
                ))}
              </div>
            )}

            {post.showcase.metrics.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mb-3">
                {post.showcase.metrics.map((metric, idx) => (
                  <div key={idx} className="text-center">
                    <div className="text-xl font-bold">{metric.value}</div>
                    <div className="text-xs text-white/60">{metric.label}</div>
                  </div>
                ))}
              </div>
            )}

            {post.showcase.collaborators.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-white/60">
                <Users size={14} />
                <span>With {post.showcase.collaborators.join(', ')}</span>
              </div>
            )}
          </div>
        );

      case 'talent-request':
        return post.talentRequest && (
          <div className="mt-4 bg-gradient-to-r from-white/5 to-white/10 rounded-xl p-4 border border-white/10">
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <div className="text-xs text-white/60 mb-1">Role</div>
                <div className="font-medium">{post.talentRequest.roles.join(', ')}</div>
              </div>
              <div>
                <div className="text-xs text-white/60 mb-1">Commitment</div>
                <div className="font-medium capitalize">{post.talentRequest.commitment}</div>
              </div>
              <div>
                <div className="text-xs text-white/60 mb-1">Location</div>
                <div className="font-medium capitalize">{post.talentRequest.location}</div>
              </div>
              <div>
                <div className="text-xs text-white/60 mb-1">Budget</div>
                <div className="font-medium">{post.talentRequest.budget}</div>
              </div>
            </div>

            <div className="mb-3">
              <div className="text-xs text-white/60 mb-2">Required Skills</div>
              <div className="flex flex-wrap gap-2">
                {post.talentRequest.skills.map(skill => (
                  <span key={skill} className="px-2 py-1 rounded-full bg-white/10 text-xs">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <div className="flex items-center gap-2 text-sm text-white/60">
                <Clock size={14} />
                <span>Deadline: {new Date(post.talentRequest.deadline).toLocaleDateString()}</span>
              </div>
              <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#35F5FF] to-[#7F6CFF] text-black text-sm font-medium">
                Apply Now
              </button>
            </div>
          </div>
        );

      case 'event':
        return post.event && (
          <div className="mt-4 bg-gradient-to-r from-white/5 to-white/10 rounded-xl p-4 border border-white/10">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="text-lg font-semibold">{post.event.name}</h4>
                <div className="flex items-center gap-3 mt-1 text-sm text-white/60">
                  <span className="flex items-center gap-1">
                    <Calendar size={14} />
                    {new Date(post.event.date).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin size={14} />
                    {post.event.location}
                  </span>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-white/10 text-xs capitalize">
                {post.event.type}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-sm">
                  <span className="font-semibold">{post.event.attendees}</span>
                  <span className="text-white/60">/{post.event.maxAttendees} attending</span>
                </div>
                {post.event.price && (
                  <div className="flex items-center gap-1 text-sm">
                    <DollarSign size={14} />
                    <span className="font-semibold">${post.event.price}</span>
                  </div>
                )}
              </div>
              <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#35F5FF] to-[#7F6CFF] text-black text-sm font-medium">
                Register
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0F1C] to-[#1A1F3A] text-white">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Community Feed</h1>
            <p className="text-white/60 text-lg">Discover opportunities, showcase work, and connect</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onCreatePost}
            className="px-6 py-3 rounded-full bg-white text-black font-bold shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] transition-shadow flex items-center gap-2"
          >
            <Plus size={20} />
            Create Post
          </motion.button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          <div className="flex gap-2 p-1.5 bg-white/5 rounded-2xl backdrop-blur-md border border-white/10">
            {(['all', 'following', 'trending', 'industry'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-5 py-2.5 rounded-xl capitalize transition-all font-medium flex items-center gap-2 ${filter === f
                  ? 'bg-white text-black shadow-lg'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
              >
                {f === 'all' && <Globe size={16} />}
                {f === 'following' && <Users size={16} />}
                {f === 'trending' && <TrendingUp size={16} />}
                {f === 'industry' && <Briefcase size={16} />}
                {f}
              </button>
            ))}
          </div>

          {filter === 'industry' && (
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value as Industry | 'all')}
              className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white backdrop-blur-md focus:outline-none focus:border-white/30"
            >
              <option value="all">All Industries</option>
              {Object.values(Industry).map(ind => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
          )}
        </div>

        {/* Posts */}
        <div className="space-y-6">
          <AnimatePresence>
            {posts.map((post, index) => {
              const PostIcon = getPostIcon(post.type);

              return (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-card rounded-3xl overflow-hidden"
                >
                  {/* Post Header */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3">
                        <img
                          src={post.author.avatar}
                          alt={post.author.name}
                          className="w-12 h-12 rounded-full"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{post.author.name}</h3>
                            {post.author.verified && (
                              <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                                <Star size={10} className="text-white" />
                              </div>
                            )}
                            <div className={`px-2 py-1 rounded-full bg-gradient-to-r ${getPostColor(post.type)} flex items-center gap-1`}>
                              <PostIcon size={12} />
                              <span className="text-xs capitalize">{post.type.replace('-', ' ')}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-white/60">
                            <span>{post.author.role}</span>
                            {post.project && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  at {post.project.name}
                                </span>
                              </>
                            )}
                            <span>•</span>
                            <span>{new Date(post.timestamp).toLocaleTimeString()}</span>
                          </div>
                        </div>
                      </div>
                      <button className="p-2 rounded-lg hover:bg-white/10">
                        <MoreHorizontal size={18} />
                      </button>
                    </div>

                    {/* Post Content */}
                    <div className="mb-4">
                      <p className="text-white/90 whitespace-pre-wrap">{post.content.text}</p>

                      {/* Tags and Mentions */}
                      {(post.content.tags.length > 0 || post.content.mentions?.length) && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {post.content.tags.map(tag => (
                            <span key={tag} className="text-[#35F5FF] hover:underline cursor-pointer">
                              #{tag}
                            </span>
                          ))}
                          {post.content.mentions?.map(mention => (
                            <span key={mention} className="text-[#7F6CFF] hover:underline cursor-pointer">
                              {mention}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Media */}
                    {post.content.media && post.content.media.length > 0 && (
                      <div className="mb-4 -mx-6">
                        {post.content.media[0].type === 'image' && (
                          <img
                            src={post.content.media[0].url}
                            alt="Post media"
                            className="w-full"
                          />
                        )}
                        {post.content.media[0].type === 'video' && (
                          <div className="relative aspect-video bg-black">
                            <video
                              src={post.content.media[0].url}
                              poster={post.content.media[0].thumbnail}
                              controls
                              className="w-full h-full"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Type-specific content */}
                    {renderPostContent(post)}
                  </div>

                  {/* Engagement Bar */}
                  <div className="px-6 py-4 border-t border-white/10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-4 text-sm text-white/60">
                        <span>{post.engagement.likes} likes</span>
                        <span>{post.engagement.comments} comments</span>
                        <span>{post.engagement.shares} shares</span>
                        <span>{post.engagement.views} views</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleLike(post.id)}
                          className={`p-2 rounded-lg transition-colors ${post.userEngagement.liked
                            ? 'bg-red-500/20 text-red-400'
                            : 'hover:bg-white/10 text-white/60'
                            }`}
                        >
                          <Heart size={18} fill={post.userEngagement.liked ? 'currentColor' : 'none'} />
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setShowComments(showComments === post.id ? null : post.id)}
                          className="p-2 rounded-lg hover:bg-white/10 text-white/60"
                        >
                          <MessageCircle size={18} />
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-2 rounded-lg hover:bg-white/10 text-white/60"
                        >
                          <Share2 size={18} />
                        </motion.button>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleBookmark(post.id)}
                        className={`p-2 rounded-lg transition-colors ${post.userEngagement.bookmarked
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'hover:bg-white/10 text-white/60'
                          }`}
                      >
                        <Bookmark size={18} fill={post.userEngagement.bookmarked ? 'currentColor' : 'none'} />
                      </motion.button>
                    </div>
                  </div>

                  {/* Comments Section */}
                  <AnimatePresence>
                    {showComments === post.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-6 pb-4 border-t border-white/10"
                      >
                        <div className="mt-4 flex gap-3">
                          <img
                            src="/current-user-avatar.jpg"
                            alt="You"
                            className="w-8 h-8 rounded-full"
                          />
                          <div className="flex-1 flex gap-2">
                            <input
                              type="text"
                              value={commentText}
                              onChange={(e) => setCommentText(e.target.value)}
                              placeholder="Write a comment..."
                              className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-[#35F5FF]/50 focus:outline-none"
                            />
                            <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#35F5FF] to-[#7F6CFF] text-black">
                              <Send size={16} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
