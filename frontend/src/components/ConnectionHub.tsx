import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Search,
  Filter,
  MessageCircle,
  Briefcase,
  MapPin,
  Star,
  MoreVertical,
  UserPlus,
  Download,
  TrendingUp,
  Award,
  Grid3X3,
  List,
  Heart
} from 'lucide-react';
import { theme } from '../styles/theme';
import api from '../services/api';

interface Connection {
  id: string;
  user: {
    id: string;
    name: string;
    avatar: string;
    role: string;
    field: string;
    location: string;
    skills: string[];
    verified: boolean;
    last_active: string;
  };
  connection_type: string;
  status: string;
  connected_at: string;
  last_interaction?: string;
  collaboration_count: number;
  mutual_connections: number;
  shared_projects: Array<{
    id: string;
    name: string;
    status: string;
    role_user: string;
    role_connection: string;
  }>;
  interaction_score: number;
  tags: string[];
  notes?: string;
}

interface ConnectionStats {
  total_connections: number;
  active_connections: number;
  new_this_month: number;
  by_type: Record<string, number>;
  by_field: Record<string, number>;
  top_collaborators: Array<{
    user: {
      id: string;
      name: string;
      avatar: string;
      role: string;
    };
    interaction_score: number;
    connection_type: string;
  }>;
  connection_growth: Array<{
    month: string;
    connections: number;
  }>;
}

interface ConnectionHubProps {
  className?: string;
}

export const ConnectionHub: React.FC<ConnectionHubProps> = ({ className = '' }) => {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [stats, setStats] = useState<ConnectionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'active' | 'inactive' | 'recent'>('all');
  const [connectionTypeFilter, setConnectionTypeFilter] = useState<string>('');
  const [fieldFilter, setFieldFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'interaction' | 'mutual'>('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchConnections();
    fetchStats();
  }, [filterType, connectionTypeFilter, fieldFilter, sortBy, searchQuery]);

  const fetchConnections = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: '50',
        offset: '0',
        sort_by: sortBy
      });

      if (filterType !== 'all') params.append('filter_type', filterType);
      if (connectionTypeFilter) params.append('connection_type', connectionTypeFilter);
      if (fieldFilter) params.append('field', fieldFilter);
      if (searchQuery) params.append('search', searchQuery);

      const response = await api.connections.getConnections(params);

      if (response.error) throw new Error(response.error);

      const data = response.data;
      setConnections(data);
    } catch (error) {
      console.error('Error fetching connections:', error);
      // Handle error state in UI
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.connections.getStats();

      if (response.error) throw new Error(response.error);

      const data = response.data;
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleConnectionAction = async (connectionId: string, action: string) => {
    // Handle connection actions like message, invite, etc.
    console.log(`Action ${action} on connection ${connectionId}`);
  };

  const exportConnections = async () => {
    try {
      // Direct fetch for blob download as api wrapper handles JSON
      const response = await fetch('/api/connections/export?format=csv', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to export connections');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'connections.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting connections:', error);
    }
  };

  const getConnectionTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'collaborator': theme.colors.primary.blue,
      'colleague': theme.colors.primary.purple,
      'mentor': theme.colors.primary.yellow,
      'mentee': '#10B981',
      'friend': '#F59E0B',
      'professional': '#6B7280'
    };
    return colors[type] || '#6B7280';
  };

  const getInteractionScoreColor = (score: number) => {
    if (score >= 8) return '#10B981';
    if (score >= 6) return '#F59E0B';
    return '#EF4444';
  };

  const formatLastActive = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Active now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-[#0A0F1C] to-[#1A1F3A] text-white ${className}`}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="mb-6 lg:mb-0">
            <h1 className="text-3xl font-bold mb-2">Connection Hub</h1>
            <p className="text-white/60">Manage your professional network and collaborations</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={exportConnections}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <Download size={16} />
              Export
            </button>
            <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#35F5FF] to-[#7F6CFF] text-black font-semibold">
              <UserPlus size={18} />
              Add Connection
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="glass-panel rounded-2xl p-5">
              <div className="flex items-center justify-between mb-2">
                <Users className="h-5 w-5 text-white/60" />
                <TrendingUp className="h-4 w-4 text-green-400" />
              </div>
              <div className="text-3xl font-bold text-white">{stats.total_connections}</div>
              <div className="text-xs text-white/60 font-medium uppercase tracking-wider mt-1">Total Connections</div>
            </div>

            <div className="glass-panel rounded-2xl p-5">
              <div className="flex items-center justify-between mb-2">
                <Heart className="h-5 w-5 text-white/60" />
                <div className="text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">Active</div>
              </div>
              <div className="text-3xl font-bold text-white">{stats.active_connections}</div>
              <div className="text-xs text-white/60 font-medium uppercase tracking-wider mt-1">Active This Month</div>
            </div>

            <div className="glass-panel rounded-2xl p-5">
              <div className="flex items-center justify-between mb-2">
                <UserPlus className="h-5 w-5 text-white/60" />
                <div className="text-xs text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full">+{stats.new_this_month}</div>
              </div>
              <div className="text-3xl font-bold text-white">{stats.new_this_month}</div>
              <div className="text-xs text-white/60 font-medium uppercase tracking-wider mt-1">New This Month</div>
            </div>

            <div className="glass-panel rounded-2xl p-5">
              <div className="flex items-center justify-between mb-2">
                <Award className="h-5 w-5 text-white/60" />
                <Star className="h-4 w-4 text-yellow-400" />
              </div>
              <div className="text-3xl font-bold text-white">
                {stats.top_collaborators.length > 0 ?
                  stats.top_collaborators[0].interaction_score.toFixed(1) : '0'
                }
              </div>
              <div className="text-xs text-white/60 font-medium uppercase tracking-wider mt-1">Top Interaction Score</div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="glass-panel rounded-2xl p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
              <input
                type="text"
                placeholder="Search connections by name or skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:bg-white/10 focus:outline-none transition-all"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl transition-all ${showFilters ? 'bg-white text-black' : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'}`}
            >
              <Filter size={18} />
              Filters
            </button>

            {/* View Mode */}
            <div className="flex rounded-xl bg-white/5 p-1 border border-white/10">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white/20 text-white shadow-sm' : 'text-white/40 hover:text-white hover:bg-white/10'}`}
              >
                <Grid3X3 size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white/20 text-white shadow-sm' : 'text-white/40 hover:text-white hover:bg-white/10'}`}
              >
                <List size={18} />
              </button>
            </div>
          </div>

          {/* Expanded Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-6 pt-6 border-t border-white/10"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as any)}
                    className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-white/30 focus:outline-none"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="recent">Recent</option>
                  </select>

                  <select
                    value={connectionTypeFilter}
                    onChange={(e) => setConnectionTypeFilter(e.target.value)}
                    className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-white/30 focus:outline-none"
                  >
                    <option value="">All Types</option>
                    <option value="collaborator">Collaborator</option>
                    <option value="colleague">Colleague</option>
                    <option value="mentor">Mentor</option>
                    <option value="mentee">Mentee</option>
                    <option value="friend">Friend</option>
                    <option value="professional">Professional</option>
                  </select>

                  <select
                    value={fieldFilter}
                    onChange={(e) => setFieldFilter(e.target.value)}
                    className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-white/30 focus:outline-none"
                  >
                    <option value="">All Fields</option>
                    <option value="Software Development">Software Development</option>
                    <option value="Creative Design">Creative Design</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Business">Business</option>
                  </select>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-white/30 focus:outline-none"
                  >
                    <option value="recent">Most Recent</option>
                    <option value="name">Name A-Z</option>
                    <option value="interaction">Interaction Score</option>
                    <option value="mutual">Mutual Connections</option>
                  </select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Connections Grid/List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/10 border-t-blue-500"></div>
          </div>
        ) : (
          <div className={viewMode === 'grid' ?
            'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' :
            'space-y-4'
          }>
            <AnimatePresence>
              {connections.map((connection, index) => (
                <motion.div
                  key={connection.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className={`glass-card rounded-2xl overflow-hidden group ${viewMode === 'list' ? 'p-4' : 'p-6'
                    }`}
                >
                  <div className={`flex ${viewMode === 'list' ? 'items-center gap-4' : 'flex-col'}`}>
                    {/* Avatar and Basic Info */}
                    <div className={`flex ${viewMode === 'list' ? 'items-center gap-3' : 'items-start justify-between mb-4'}`}>
                      <div className="flex items-center gap-3">
                        <img
                          src={connection.user.avatar}
                          alt={connection.user.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-white">{connection.user.name}</h3>
                            {connection.user.verified && (
                              <Star className="h-4 w-4 text-yellow-400" />
                            )}
                          </div>
                          <p className="text-sm text-white/60">{connection.user.role}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className="px-2 py-0.5 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: `${getConnectionTypeColor(connection.connection_type)}20`,
                                color: getConnectionTypeColor(connection.connection_type)
                              }}
                            >
                              {connection.connection_type}
                            </span>
                            <span className="text-xs text-white/40">
                              {formatLastActive(connection.user.last_active)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {viewMode === 'grid' && (
                        <button className="p-2 rounded-lg hover:bg-white/10">
                          <MoreVertical className="h-4 w-4 text-white/60" />
                        </button>
                      )}
                    </div>

                    {/* Stats and Info */}
                    <div className={`${viewMode === 'list' ? 'flex items-center gap-6 flex-1' : 'space-y-3'}`}>
                      {/* Location and Field */}
                      <div className={viewMode === 'list' ? 'text-sm' : 'text-sm space-y-1'}>
                        <div className="flex items-center gap-1 text-white/60">
                          <MapPin className="h-3 w-3" />
                          <span>{connection.user.location}</span>
                        </div>
                        <div className="text-white/60">{connection.user.field}</div>
                      </div>

                      {/* Metrics */}
                      <div className={`${viewMode === 'list' ? 'flex gap-4' : 'grid grid-cols-3 gap-2'} text-center`}>
                        <div>
                          <div className="text-lg font-semibold text-white">{connection.collaboration_count}</div>
                          <div className="text-xs text-white/60">Projects</div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-white">{connection.mutual_connections}</div>
                          <div className="text-xs text-white/60">Mutual</div>
                        </div>
                        <div>
                          <div
                            className="text-lg font-semibold"
                            style={{ color: getInteractionScoreColor(connection.interaction_score) }}
                          >
                            {connection.interaction_score.toFixed(1)}
                          </div>
                          <div className="text-xs text-white/60">Score</div>
                        </div>
                      </div>

                      {/* Skills */}
                      {viewMode === 'grid' && (
                        <div className="flex flex-wrap gap-1">
                          {connection.user.skills.slice(0, 3).map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 rounded-full bg-white/10 text-xs text-white/70"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className={`${viewMode === 'list' ? 'flex gap-2' : 'flex gap-2 pt-3 border-t border-white/10'}`}>
                      <button
                        onClick={() => handleConnectionAction(connection.id, 'message')}
                        className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-gradient-to-r from-[#35F5FF] to-[#7F6CFF] text-black text-sm font-medium hover:opacity-90 transition-opacity"
                      >
                        <MessageCircle size={14} />
                        Message
                      </button>
                      <button
                        onClick={() => handleConnectionAction(connection.id, 'invite')}
                        className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-white/10 text-white text-sm hover:bg-white/20 transition-colors"
                      >
                        <Briefcase size={14} />
                        Invite
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Empty State */}
        {!loading && connections.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-white/20 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No connections found</h3>
            <p className="text-white/60 mb-6">
              {searchQuery || filterType !== 'all' ?
                'Try adjusting your filters or search terms.' :
                'Start building your professional network by connecting with collaborators.'
              }
            </p>
            <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#35F5FF] to-[#7F6CFF] text-black font-semibold">
              Find Connections
            </button>
          </div>
        )}
      </div>
    </div>
  );
};




