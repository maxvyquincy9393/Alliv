import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  Award,
  Target,
  Users,
  Zap,
  Calendar,
  Clock,
  Star,
  CheckCircle,
  ArrowUp,
} from 'lucide-react';
import { FullScreenLayout } from '../components/FullScreenLayout';

interface InsightData {
  activity_summary: {
    total_swipes: number;
    total_likes: number;
    total_matches: number;
    total_messages: number;
    profile_views: number;
  };
  performance_metrics: {
    like_rate: number;
    match_rate: number;
    response_rate: number;
    engagement_score: number;
    profile_likes_received: number;
  };
  activity_patterns: {
    most_active_hours: number[];
    most_active_days: string[];
  };
  recommendations: string[];
}

export const Analytics = () => {
  const [insights, setInsights] = useState<InsightData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      // Mock data for now since the API might not be ready
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockData: InsightData = {
        activity_summary: {
          total_swipes: 150,
          total_likes: 45,
          total_matches: 12,
          total_messages: 85,
          profile_views: 230
        },
        performance_metrics: {
          like_rate: 30,
          match_rate: 26,
          response_rate: 75,
          engagement_score: 85,
          profile_likes_received: 28
        },
        activity_patterns: {
          most_active_hours: [19, 20, 21],
          most_active_days: ['Saturday', 'Sunday']
        },
        recommendations: [
          'Complete your skills section to increase visibility',
          'Upload more project photos to attract collaborators',
          'Reply faster to messages to boost your response rate'
        ]
      };
      setInsights(mockData);
    } catch (error) {
      console.error('Failed to fetch insights:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !insights) {
    return (
      <FullScreenLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-white/60">Loading your insights...</p>
          </div>
        </div>
      </FullScreenLayout>
    );
  }

  const { activity_summary, performance_metrics, activity_patterns, recommendations } = insights;

  return (
    <FullScreenLayout>
      <div className="min-h-screen py-8 px-4 pt-24 pb-24">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white font-display">
              Your Analytics Dashboard
            </h1>
            <p className="text-white/60 text-lg">
              Deep insights into your collaboration journey
            </p>
            
            {/* Timeframe Selector */}
            <div className="flex gap-2 justify-center mt-6 bg-white/5 p-1 rounded-xl inline-flex border border-white/10">
              {(['week', 'month', 'year'] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-6 py-2 rounded-lg font-medium transition-all ${
                    timeframe === tf
                      ? 'bg-white/10 text-white shadow-sm'
                      : 'text-white/50 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tf.charAt(0).toUpperCase() + tf.slice(1)}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass-panel rounded-2xl p-6 relative overflow-hidden group hover:border-cyan-500/30 transition-colors">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Target size={64} className="text-cyan-400" />
              </div>
              <div className="space-y-3 relative z-10">
                <div className="flex items-center justify-between">
                  <Target className="text-cyan-400" size={32} />
                  <span className="flex items-center gap-1 text-green-400 text-sm font-medium bg-green-400/10 px-2 py-0.5 rounded-full">
                    <ArrowUp size={14} />
                    12%
                  </span>
                </div>
                <div>
                  <p className="text-white/60 text-sm">Engagement Score</p>
                  <p className="text-4xl font-bold text-white mt-1">
                    {performance_metrics.engagement_score}
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-6 relative overflow-hidden group hover:border-purple-500/30 transition-colors">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Users size={64} className="text-purple-400" />
              </div>
              <div className="space-y-3 relative z-10">
                <div className="flex items-center justify-between">
                  <Users className="text-purple-400" size={32} />
                  <span className="flex items-center gap-1 text-green-400 text-sm font-medium bg-green-400/10 px-2 py-0.5 rounded-full">
                    <ArrowUp size={14} />
                    8%
                  </span>
                </div>
                <div>
                  <p className="text-white/60 text-sm">Total Matches</p>
                  <p className="text-4xl font-bold text-white mt-1">
                    {activity_summary.total_matches}
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-6 relative overflow-hidden group hover:border-pink-500/30 transition-colors">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Zap size={64} className="text-pink-400" />
              </div>
              <div className="space-y-3 relative z-10">
                <div className="flex items-center justify-between">
                  <Zap className="text-pink-400" size={32} />
                  <span className="flex items-center gap-1 text-green-400 text-sm font-medium bg-green-400/10 px-2 py-0.5 rounded-full">
                    <ArrowUp size={14} />
                    15%
                  </span>
                </div>
                <div>
                  <p className="text-white/60 text-sm">Match Rate</p>
                  <p className="text-4xl font-bold text-white mt-1">
                    {performance_metrics.match_rate}%
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-6 relative overflow-hidden group hover:border-yellow-500/30 transition-colors">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Star size={64} className="text-yellow-400" />
              </div>
              <div className="space-y-3 relative z-10">
                <div className="flex items-center justify-between">
                  <Star className="text-yellow-400" size={32} />
                  <span className="flex items-center gap-1 text-green-400 text-sm font-medium bg-green-400/10 px-2 py-0.5 rounded-full">
                    <ArrowUp size={14} />
                    5%
                  </span>
                </div>
                <div>
                  <p className="text-white/60 text-sm">Profile Views</p>
                  <p className="text-4xl font-bold text-white mt-1">
                    {activity_summary.profile_views}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-panel rounded-2xl p-8">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <BarChart3 className="text-cyan-400" size={28} />
                  <h2 className="text-2xl font-bold text-white">Activity Summary</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                        <Target className="text-cyan-400" size={20} />
                      </div>
                      <span className="text-white font-medium">Total Swipes</span>
                    </div>
                    <span className="text-2xl font-bold text-cyan-400">
                      {activity_summary.total_swipes}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center">
                        <Award className="text-pink-400" size={20} />
                      </div>
                      <span className="text-white font-medium">Total Likes</span>
                    </div>
                    <span className="text-2xl font-bold text-pink-400">
                      {activity_summary.total_likes}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <Zap className="text-purple-400" size={20} />
                      </div>
                      <span className="text-white font-medium">Messages Sent</span>
                    </div>
                    <span className="text-2xl font-bold text-purple-400">
                      {activity_summary.total_messages}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-8">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <TrendingUp className="text-purple-400" size={28} />
                  <h2 className="text-2xl font-bold text-white">Performance Metrics</h2>
                </div>
                
                <div className="space-y-6">
                  {/* Like Rate */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-white/60">Like Rate</span>
                      <span className="text-white font-bold">{performance_metrics.like_rate}%</span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${performance_metrics.like_rate}%` }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full"
                      />
                    </div>
                  </div>

                  {/* Match Rate */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-white/60">Match Rate</span>
                      <span className="text-white font-bold">{performance_metrics.match_rate}%</span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${performance_metrics.match_rate}%` }}
                        transition={{ duration: 1, delay: 0.4 }}
                        className="h-full bg-gradient-to-r from-pink-500 to-yellow-500 rounded-full"
                      />
                    </div>
                  </div>

                  {/* Response Rate */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-white/60">Response Rate</span>
                      <span className="text-white font-bold">{performance_metrics.response_rate}%</span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${performance_metrics.response_rate}%` }}
                        transition={{ duration: 1, delay: 0.6 }}
                        className="h-full bg-gradient-to-r from-green-500 to-cyan-500 rounded-full"
                      />
                    </div>
                  </div>

                  {/* Profile Score */}
                  <div className="mt-6 p-4 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-xl border border-cyan-500/20">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium">Your Profile Score</span>
                      <span className="text-3xl font-bold text-white">87.5</span>
                    </div>
                    <p className="text-white/60 text-sm mt-2">
                      Better than 78% of users 🎉
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Patterns & Recommendations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-panel rounded-2xl p-8">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <Calendar className="text-yellow-400" size={28} />
                  <h2 className="text-2xl font-bold text-white">Activity Patterns</h2>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <p className="text-white/60 mb-3">Most Active Hours</p>
                    <div className="flex flex-wrap gap-2">
                      {activity_patterns.most_active_hours.slice(0, 5).map((hour) => (
                        <div
                          key={hour}
                          className="px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg"
                        >
                          <Clock className="inline-block mr-2 text-yellow-400" size={16} />
                          <span className="text-white font-medium">{hour}:00</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-white/60 mb-3">Most Active Days</p>
                    <div className="flex flex-wrap gap-2">
                      {activity_patterns.most_active_days.slice(0, 3).map((day) => (
                        <div
                          key={day}
                          className="px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-lg"
                        >
                          <span className="text-white font-medium">{day}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-8">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <CheckCircle className="text-green-400" size={28} />
                  <h2 className="text-2xl font-bold text-white">Recommendations</h2>
                </div>
                
                <div className="space-y-3">
                  {recommendations.map((rec, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 bg-white/5 rounded-xl border-l-4 border-green-500"
                    >
                      <div className="flex items-start gap-3">
                        <CheckCircle className="text-green-400 flex-shrink-0 mt-1" size={20} />
                        <p className="text-white">{rec}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <Link to="/discover">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-primary px-8 py-4 text-lg"
              >
                Start Discovering
              </motion.button>
            </Link>
            <Link to="/profile">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-secondary px-8 py-4 text-lg"
              >
                Improve Profile
              </motion.button>
            </Link>
          </div>
        </div>
      </div>
    </FullScreenLayout>
  );
};
