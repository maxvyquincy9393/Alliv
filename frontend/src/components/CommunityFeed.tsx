import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Image as ImageIcon,
  Link as LinkIcon,
  Send,
  Bookmark,
  Globe,
  Users,
  TrendingUp,
  Briefcase,
  Star,
  Video,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import type { Post, PostType, FeedParams } from '../types/post';
import api from '../services/api';

interface CommunityFeedProps {
  onCreatePost?: () => void;
  onEngagement?: (postId: string, type: string) => void;
  refreshTrigger?: number;
}

export const CommunityFeed = ({ onCreatePost, refreshTrigger = 0 }: CommunityFeedProps) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'following' | 'trending' | 'industry'>('all');
  const [showComments, setShowComments] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    loadPosts();
  }, [filter, refreshTrigger]);

  const loadPosts = async () => {
    setLoading(true);
    setError(null);

    try {
      const params: FeedParams = {
        limit: 20,
        offset: 0,
        filter_type: filter,
      };

      const response = await api.feed.getFeed(params);

      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data) {
        setPosts(response.data);
      }
    } catch (err: any) {
      console.error('Error loading feed:', err);
      setError(err.message || 'Failed to load feed');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const action = post.userEngagement.liked ? 'unlike' : 'like';

    // Optimistic update
    setPosts(current => current.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          engagement: {
            ...p.engagement,
            likes: p.userEngagement.liked ? p.engagement.likes - 1 : p.engagement.likes + 1
          },
          userEngagement: {
            ...p.userEngagement,
            liked: !p.userEngagement.liked
          }
        };
      }
      return p;
    }));

    try {
      await api.feed.engagePost(postId, action);
    } catch (err) {
      console.error('Like error:', err);
      // Revert on error
      loadPosts();
    }
  };

  const handleBookmark = async (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const action = post.userEngagement.bookmarked ? 'unbookmark' : 'bookmark';

    // Optimistic update
    setPosts(current => current.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          userEngagement: {
            ...p.userEngagement,
            bookmarked: !p.userEngagement.bookmarked
          }
        };
      }
      return p;
    }));

    try {
      await api.feed.engagePost(postId, action);
    } catch (err) {
      console.error('Bookmark error:', err);
      // Revert on error
      loadPosts();
    }
  };

  const handleShare = async (postId: string) => {
    try {
      await api.feed.engagePost(postId, 'share');
      // Could show share modal here
      console.log('Post shared:', postId);
    } catch (err) {
      console.error('Share error:', err);
    }
  };

  const getPostIcon = (type: PostType) => {
    switch (type) {
      case 'showcase': return ImageIcon;
      case 'collaboration': return Users;
      case 'talent-request': return Users;
      case 'resource': return LinkIcon;
      case 'discussion': return MessageCircle;
      case 'milestone': return Star;
      case 'opportunity': return Briefcase;
      default: return MessageCircle;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-200">
      <div className="max-w-4xl mx-auto px-6 py-8 md:pl-80 pt-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Community Feed</h1>
            <p className="text-slate-400">Discover opportunities, showcase work, and connect.</p>
          </div>
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={loadPosts}
              disabled={loading}
              className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all disabled:opacity-50"
              title="Refresh feed"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </motion.button>
            {onCreatePost && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onCreatePost}
                className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold shadow-lg shadow-blue-900/20 hover:bg-blue-500 transition-all flex items-center gap-2"
              >
                <ImageIcon size={20} />
                Create Post
              </motion.button>
            )}
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-between"
          >
            <span>{error}</span>
            <button onClick={loadPosts} className="text-red-300 hover:text-red-200">
              Retry
            </button>
          </motion.div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-full border-4 border-slate-700 border-t-blue-500 animate-spin mb-4" />
            <p className="text-slate-400">Loading feed...</p>
          </div>
        ) : (
          <>
            {/* Filters */}
            <div className="flex items-center gap-4 mb-8 overflow-x-auto pb-2 scrollbar-hide">
              <div className="flex gap-2 p-1 bg-slate-800/50 rounded-xl border border-slate-700/50">
                {(['all', 'following', 'trending', 'industry'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-2 rounded-lg capitalize transition-all font-medium flex items-center gap-2 whitespace-nowrap ${filter === f
                        ? 'bg-slate-700 text-white shadow-md'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
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
            </div>

            {/* Posts */}
            {posts.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
                  <ImageIcon size={32} className="text-slate-600" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No posts yet</h3>
                <p className="text-slate-400 mb-6">Be the first to share something!</p>
                {onCreatePost && (
                  <button
                    onClick={onCreatePost}
                    className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors"
                  >
                    Create First Post
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <AnimatePresence mode="popLayout">
                  {posts.map((post, index) => {
                    const PostIcon = getPostIcon(post.type);
                    const hasMedia = post.content.media && post.content.media.length > 0;

                    return (
                      <motion.article
                        key={post.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden hover:border-slate-600 transition-colors"
                      >
                        {/* Post Header */}
                        <div className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start gap-3">
                              <img
                                src={post.author.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author.name)}&background=random`}
                                alt={post.author.name}
                                className="w-12 h-12 rounded-full border border-slate-700"
                              />
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-bold text-white">{post.author.name}</h3>
                                  {post.author.verified && (
                                    <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                                      <Star size={10} className="text-white" />
                                    </div>
                                  )}
                                  <div className="px-2 py-0.5 rounded-full bg-slate-700/50 border border-slate-600/50 flex items-center gap-1">
                                    <PostIcon size={12} className="text-slate-400" />
                                    <span className="text-xs capitalize text-slate-300">
                                      {post.type.replace('-', ' ')}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-400">
                                  <span>{post.author.role}</span>
                                  <span>•</span>
                                  <span>{formatTimestamp(post.timestamp)}</span>
                                </div>
                              </div>
                            </div>
                            <button className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                              <MoreHorizontal size={18} />
                            </button>
                          </div>

                          {/* Post Content */}
                          <div className="mb-4">
                            <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">
                              {post.content.text}
                            </p>

                            {/* Tags */}
                            {post.content.tags && post.content.tags.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-3">
                                {post.content.tags.map(tag => (
                                  <span
                                    key={tag}
                                    className="text-blue-400 hover:underline cursor-pointer text-sm"
                                  >
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Media */}
                          {hasMedia && (
                            <div className="mb-4 -mx-6 bg-black/20 rounded-xl overflow-hidden">
                              {post.content.media![0].type === 'image' && (
                                <img
                                  src={post.content.media![0].url}
                                  alt="Post media"
                                  className="w-full max-h-[500px] object-contain"
                                />
                              )}
                              {post.content.media![0].type === 'video' && (
                                <div className="relative">
                                  <video
                                    src={post.content.media![0].url}
                                    controls
                                    className="w-full max-h-[500px]"
                                    poster={post.content.media![0].thumbnail}
                                  />
                                  <div className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm flex items-center gap-1">
                                    <Video size={14} className="text-white" />
                                    <span className="text-xs text-white">Video</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Engagement Bar */}
                        <div className="px-6 py-3 border-t border-slate-700/50 bg-slate-800/20">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleLike(post.id)}
                                className={`p-2 rounded-lg transition-colors flex items-center gap-2 ${post.userEngagement.liked
                                    ? 'text-red-400 bg-red-500/10'
                                    : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                                  }`}
                              >
                                <Heart size={18} fill={post.userEngagement.liked ? 'currentColor' : 'none'} />
                                <span className="text-sm font-medium">{post.engagement.likes}</span>
                              </motion.button>

                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setShowComments(showComments === post.id ? null : post.id)}
                                className="p-2 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white flex items-center gap-2"
                              >
                                <MessageCircle size={18} />
                                <span className="text-sm font-medium">{post.engagement.comments}</span>
                              </motion.button>

                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleShare(post.id)}
                                className="p-2 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white flex items-center gap-2"
                              >
                                <Share2 size={18} />
                                <span className="text-sm font-medium">{post.engagement.shares}</span>
                              </motion.button>
                            </div>

                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleBookmark(post.id)}
                              className={`p-2 rounded-lg transition-colors ${post.userEngagement.bookmarked
                                  ? 'text-yellow-400 bg-yellow-500/10'
                                  : 'text-slate-400 hover:bg-slate-700 hover:text-white'
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
                              className="px-6 pb-4 border-t border-slate-700/50 bg-slate-800/30"
                            >
                              <div className="mt-4 flex gap-3">
                                <img
                                  src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=random`}
                                  alt="You"
                                  className="w-8 h-8 rounded-full flex-shrink-0"
                                />
                                <div className="flex-1 flex gap-2">
                                  <input
                                    type="text"
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    placeholder="Write a comment..."
                                    className="flex-1 px-4 py-2 rounded-xl bg-slate-700/50 border border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
                                  />
                                  <button
                                    disabled={!commentText.trim()}
                                    className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
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
            )}
          </>
        )}
      </div>
    </div>
  );
};
