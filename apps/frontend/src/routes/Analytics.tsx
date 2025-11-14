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
import { Layout } from '../components/Layout';
import { UltraModernCard } from '../components/UltraModernCard';

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
      const response = await fetch('/api/analytics/user/insights', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setInsights(data.insights);
      }
    } catch (error) {
      console.error('Failed to fetch insights:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !insights) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-neon-cyan mx-auto"></div>
            <p className="text-dark-text-secondary">Loading your insights...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const { activity_summary, performance_metrics, activity_patterns, recommendations } = insights;

  return (
    <Layout>
      <div className="min-h-screen bg-dark-bg py-8 px-4">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4"
          >
            <h1 className="text-5xl font-bold text-gradient">
              Your Analytics Dashboard
            </h1>
            <p className="text-dark-text-secondary text-lg">
              Deep insights into your collaboration journey
            </p>
            
            {/* Timeframe Selector */}
            <div className="flex gap-2 justify-center mt-6">
              {(['week', 'month', 'year'] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-6 py-2 rounded-lg font-medium transition-all ${
                    timeframe === tf
                      ? 'bg-neon-cyan text-dark-bg shadow-lg shadow-neon-cyan/50'
                      : 'bg-dark-card text-dark-text-secondary hover:bg-dark-border'
                  }`}
                >
                  {tf.charAt(0).toUpperCase() + tf.slice(1)}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <UltraModernCard glowColor="cyan">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Target className="text-neon-cyan" size={32} />
                  <span className="flex items-center gap-1 text-neon-green text-sm font-medium">
                    <ArrowUp size={16} />
                    12%
                  </span>
                </div>
                <div>
                  <p className="text-dark-text-secondary text-sm">Engagement Score</p>
                  <p className="text-4xl font-bold text-white mt-1">
                    {performance_metrics.engagement_score}
                  </p>
                </div>
              </div>
            </UltraModernCard>

            <UltraModernCard glowColor="purple">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Users className="text-neon-purple" size={32} />
                  <span className="flex items-center gap-1 text-neon-green text-sm font-medium">
                    <ArrowUp size={16} />
                    8%
                  </span>
                </div>
                <div>
                  <p className="text-dark-text-secondary text-sm">Total Matches</p>
                  <p className="text-4xl font-bold text-white mt-1">
                    {activity_summary.total_matches}
                  </p>
                </div>
              </div>
            </UltraModernCard>

            <UltraModernCard glowColor="pink">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Zap className="text-neon-pink" size={32} />
                  <span className="flex items-center gap-1 text-neon-green text-sm font-medium">
                    <ArrowUp size={16} />
                    15%
                  </span>
                </div>
                <div>
                  <p className="text-dark-text-secondary text-sm">Match Rate</p>
                  <p className="text-4xl font-bold text-white mt-1">
                    {performance_metrics.match_rate}%
                  </p>
                </div>
              </div>
            </UltraModernCard>

            <UltraModernCard glowColor="yellow">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Star className="text-neon-yellow" size={32} />
                  <span className="flex items-center gap-1 text-neon-green text-sm font-medium">
                    <ArrowUp size={16} />
                    5%
                  </span>
                </div>
                <div>
                  <p className="text-dark-text-secondary text-sm">Profile Views</p>
                  <p className="text-4xl font-bold text-white mt-1">
                    {activity_summary.profile_views}
                  </p>
                </div>
              </div>
            </UltraModernCard>
          </div>

          {/* Activity Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <UltraModernCard>
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <BarChart3 className="text-neon-cyan" size={28} />
                  <h2 className="text-2xl font-bold text-white">Activity Summary</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-dark-card rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-neon-cyan/20 flex items-center justify-center">
                        <Target className="text-neon-cyan" size={20} />
                      </div>
                      <span className="text-white font-medium">Total Swipes</span>
                    </div>
                    <span className="text-2xl font-bold text-neon-cyan">
                      {activity_summary.total_swipes}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-dark-card rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-neon-pink/20 flex items-center justify-center">
                        <Award className="text-neon-pink" size={20} />
                      </div>
                      <span className="text-white font-medium">Total Likes</span>
                    </div>
                    <span className="text-2xl font-bold text-neon-pink">
                      {activity_summary.total_likes}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-dark-card rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-neon-purple/20 flex items-center justify-center">
                        <Zap className="text-neon-purple" size={20} />
                      </div>
                      <span className="text-white font-medium">Messages Sent</span>
                    </div>
                    <span className="text-2xl font-bold text-neon-purple">
                      {activity_summary.total_messages}
                    </span>
                  </div>
                </div>
              </div>
            </UltraModernCard>

            <UltraModernCard>
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <TrendingUp className="text-neon-purple" size={28} />
                  <h2 className="text-2xl font-bold text-white">Performance Metrics</h2>
                </div>
                
                <div className="space-y-4">
                  {/* Like Rate */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-dark-text-secondary">Like Rate</span>
                      <span className="text-white font-bold">{performance_metrics.like_rate}%</span>
                    </div>
                    <div className="w-full h-2 bg-dark-card rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${performance_metrics.like_rate}%` }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className="h-full bg-gradient-to-r from-neon-cyan to-neon-purple rounded-full"
                      />
                    </div>
                  </div>

                  {/* Match Rate */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-dark-text-secondary">Match Rate</span>
                      <span className="text-white font-bold">{performance_metrics.match_rate}%</span>
                    </div>
                    <div className="w-full h-2 bg-dark-card rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${performance_metrics.match_rate}%` }}
                        transition={{ duration: 1, delay: 0.4 }}
                        className="h-full bg-gradient-to-r from-neon-pink to-neon-yellow rounded-full"
                      />
                    </div>
                  </div>

                  {/* Response Rate */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-dark-text-secondary">Response Rate</span>
                      <span className="text-white font-bold">{performance_metrics.response_rate}%</span>
                    </div>
                    <div className="w-full h-2 bg-dark-card rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${performance_metrics.response_rate}%` }}
                        transition={{ duration: 1, delay: 0.6 }}
                        className="h-full bg-gradient-to-r from-neon-green to-neon-cyan rounded-full"
                      />
                    </div>
                  </div>

                  {/* Profile Score */}
                  <div className="mt-6 p-4 bg-gradient-to-r from-neon-cyan/10 to-neon-purple/10 rounded-lg border border-neon-cyan/30">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium">Your Profile Score</span>
                      <span className="text-3xl font-bold text-gradient">87.5</span>
                    </div>
                    <p className="text-dark-text-secondary text-sm mt-2">
                      Better than 78% of users 🎉
                    </p>
                  </div>
                </div>
              </div>
            </UltraModernCard>
          </div>

          {/* Activity Patterns & Recommendations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <UltraModernCard>
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <Calendar className="text-neon-yellow" size={28} />
                  <h2 className="text-2xl font-bold text-white">Activity Patterns</h2>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-dark-text-secondary mb-3">Most Active Hours</p>
                    <div className="flex flex-wrap gap-2">
                      {activity_patterns.most_active_hours.slice(0, 5).map((hour) => (
                        <div
                          key={hour}
                          className="px-4 py-2 bg-neon-yellow/20 border border-neon-yellow/30 rounded-lg"
                        >
                          <Clock className="inline-block mr-2 text-neon-yellow" size={16} />
                          <span className="text-white font-medium">{hour}:00</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-dark-text-secondary mb-3">Most Active Days</p>
                    <div className="flex flex-wrap gap-2">
                      {activity_patterns.most_active_days.slice(0, 3).map((day) => (
                        <div
                          key={day}
                          className="px-4 py-2 bg-neon-purple/20 border border-neon-purple/30 rounded-lg"
                        >
                          <span className="text-white font-medium">{day}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </UltraModernCard>

            <UltraModernCard>
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <CheckCircle className="text-neon-green" size={28} />
                  <h2 className="text-2xl font-bold text-white">Recommendations</h2>
                </div>
                
                <div className="space-y-3">
                  {recommendations.map((rec, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 bg-dark-card rounded-lg border-l-4 border-neon-green"
                    >
                      <div className="flex items-start gap-3">
                        <CheckCircle className="text-neon-green flex-shrink-0 mt-1" size={20} />
                        <p className="text-white">{rec}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </UltraModernCard>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <Link to="/discover">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-gradient-to-r from-neon-cyan to-neon-purple text-white font-bold rounded-xl shadow-lg hover:shadow-neon-cyan/50 transition-all"
              >
                Start Discovering
              </motion.button>
            </Link>
            <Link to="/profile">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-dark-card text-white font-bold rounded-xl hover:bg-dark-border transition-all"
              >
                Improve Profile
              </motion.button>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};
