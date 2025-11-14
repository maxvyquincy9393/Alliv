import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  AlertTriangle,
  User,
  MessageSquare,
  Camera,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Filter
} from 'lucide-react';
import axios from 'axios';
import { GlassButton } from '../../components/GlassButton';

interface Report {
  _id: string;
  reporterId: string;
  targetId: string;
  type: 'harassment' | 'spam' | 'inappropriate' | 'fake' | 'other';
  reason: string;
  evidence: string[];
  context?: {
    matchId?: string;
    messageId?: string;
    projectId?: string;
  };
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  reviewedBy?: string;
  action?: 'warning' | 'suspension' | 'ban' | 'dismiss';
  reviewNotes?: string;
  createdAt: string;
  resolvedAt?: string;
  reporter?: {
    name: string;
    email: string;
    photo?: string;
    trustScore: number;
  };
  target?: {
    name: string;
    email: string;
    photo?: string;
    status: string;
    trustScore: number;
    reportCount?: number;
  };
}

const reportTypeIcons = {
  harassment: AlertTriangle,
  spam: MessageSquare,
  inappropriate: Camera,
  fake: User,
  other: Shield
};

const reportTypeLabels = {
  harassment: 'Harassment',
  spam: 'Spam',
  inappropriate: 'Inappropriate Content',
  fake: 'Fake Profile',
  other: 'Other'
};

const statusColors = {
  pending: 'yellow',
  reviewing: 'blue',
  resolved: 'green',
  dismissed: 'gray'
};

export const ModerationPanel = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolveAction, setResolveAction] = useState<'warning' | 'suspension' | 'ban' | 'dismiss'>('warning');
  const [resolveNotes, setResolveNotes] = useState('');
  const [suspensionDays, setSuspensionDays] = useState(30);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState('');
  const [expandedReports, setExpandedReports] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchReports();
  }, [statusFilter, typeFilter]);

  const fetchReports = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login as admin');
        return;
      }

      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('type', typeFilter);

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/reports?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setReports(response.data.reports || []);
    } catch (err: any) {
      console.error('Failed to fetch reports:', err);
      if (err.response?.status === 403) {
        setError('Access denied. Admin privileges required.');
      } else if (err.response?.status === 401) {
        setError('Please login as admin');
      } else {
        setError('Failed to load reports');
      }
    } finally {
      setLoading(false);
    }
  };

  const viewReportDetails = async (reportId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/reports/${reportId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setSelectedReport(response.data);
      setShowResolveModal(true);
    } catch (err) {
      console.error('Failed to fetch report details:', err);
      setError('Failed to load report details');
    }
  };

  const handleResolve = async () => {
    if (!selectedReport) return;

    if (resolveNotes.trim().length < 10) {
      setError('Please provide at least 10 characters in notes');
      return;
    }

    setResolving(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/reports/${selectedReport._id}/resolve`,
        {
          action: resolveAction,
          notes: resolveNotes,
          suspensionDays: resolveAction === 'suspension' ? suspensionDays : undefined
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Report resolved:', response.data);

      // Refresh reports list
      await fetchReports();

      // Close modal
      setShowResolveModal(false);
      setSelectedReport(null);
      setResolveNotes('');
      setResolveAction('warning');
      setSuspensionDays(30);
    } catch (err: any) {
      console.error('Failed to resolve report:', err);
      setError(err.response?.data?.detail || 'Failed to resolve report');
    } finally {
      setResolving(false);
    }
  };

  const toggleExpanded = (reportId: string) => {
    const newExpanded = new Set(expandedReports);
    if (newExpanded.has(reportId)) {
      newExpanded.delete(reportId);
    } else {
      newExpanded.add(reportId);
    }
    setExpandedReports(newExpanded);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-dark-surface to-dark-bg p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Moderation Panel</h1>
              <p className="text-white/60">Review and manage user reports</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="glass-strong p-4 rounded-2xl mb-6 border border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-5 h-5 text-white/60" />
            <h3 className="text-white font-medium">Filters</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status Filter */}
            <div>
              <label className="text-white/80 text-sm mb-2 block">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full p-3 bg-dark-surface border border-white/10 rounded-xl text-white focus:outline-none focus:border-red-500/50"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="reviewing">Reviewing</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="text-white/80 text-sm mb-2 block">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full p-3 bg-dark-surface border border-white/10 rounded-xl text-white focus:outline-none focus:border-red-500/50"
              >
                <option value="">All Types</option>
                <option value="harassment">Harassment</option>
                <option value="spam">Spam</option>
                <option value="inappropriate">Inappropriate Content</option>
                <option value="fake">Fake Profile</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl"
          >
            <p className="text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              {error}
            </p>
          </motion.div>
        )}

        {/* Reports List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white/60">Loading reports...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="glass-strong p-12 rounded-2xl text-center border border-white/10">
              <Shield className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <p className="text-white/60 text-lg">No reports found</p>
              <p className="text-white/40 text-sm mt-2">Try adjusting your filters</p>
            </div>
          ) : (
            reports.map((report) => {
              const TypeIcon = reportTypeIcons[report.type];
              const isExpanded = expandedReports.has(report._id);
              const statusColor = statusColors[report.status];

              return (
                <motion.div
                  key={report._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-strong rounded-2xl border border-white/10 overflow-hidden"
                >
                  {/* Report Header */}
                  <div
                    className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => toggleExpanded(report._id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        {/* Type Icon */}
                        <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                          <TypeIcon className="w-5 h-5 text-red-500" />
                        </div>

                        {/* Report Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-white font-medium">
                              {reportTypeLabels[report.type]}
                            </h3>
                            <span className={`px-2 py-0.5 rounded-full text-xs bg-${statusColor}-500/20 text-${statusColor}-400 border border-${statusColor}-500/20`}>
                              {report.status}
                            </span>
                          </div>

                          <p className="text-white/60 text-sm mb-2">
                            Reporter: <span className="text-white">{report.reporter?.name || 'Unknown'}</span>
                            {' • '}
                            Target: <span className="text-white">{report.target?.name || 'Unknown'}</span>
                          </p>

                          <p className="text-white/80 text-sm line-clamp-2">
                            {report.reason}
                          </p>

                          <div className="flex items-center gap-4 mt-2 text-xs text-white/40">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(report.createdAt).toLocaleDateString()}
                            </span>
                            {report.evidence.length > 0 && (
                              <span className="flex items-center gap-1">
                                <Camera className="w-3 h-3" />
                                {report.evidence.length} screenshot{report.evidence.length > 1 ? 's' : ''}
                              </span>
                            )}
                            {report.target?.reportCount && report.target.reportCount > 1 && (
                              <span className="flex items-center gap-1 text-red-400">
                                <TrendingDown className="w-3 h-3" />
                                {report.target.reportCount} total reports
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expand/Collapse Button */}
                      <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-white/60" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-white/60" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-white/10"
                      >
                        <div className="p-4 space-y-4">
                          {/* Evidence Screenshots */}
                          {report.evidence.length > 0 && (
                            <div>
                              <h4 className="text-white/80 text-sm font-medium mb-2">Evidence:</h4>
                              <div className="flex gap-2 flex-wrap">
                                {report.evidence.map((url, index) => (
                                  <a
                                    key={index}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="relative group"
                                  >
                                    <img
                                      src={url}
                                      alt={`Evidence ${index + 1}`}
                                      className="w-24 h-24 rounded-lg object-cover border border-white/10"
                                    />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                      <ExternalLink className="w-5 h-5 text-white" />
                                    </div>
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* User Details */}
                          <div className="grid grid-cols-2 gap-4">
                            {/* Reporter */}
                            <div className="glass p-3 rounded-xl">
                              <h4 className="text-white/60 text-xs mb-2">Reporter</h4>
                              <div className="flex items-center gap-2">
                                {report.reporter?.photo && (
                                  <img
                                    src={report.reporter.photo}
                                    alt={report.reporter.name}
                                    className="w-10 h-10 rounded-full"
                                  />
                                )}
                                <div>
                                  <p className="text-white text-sm font-medium">
                                    {report.reporter?.name || 'Unknown'}
                                  </p>
                                  <p className="text-white/40 text-xs">
                                    Trust: {report.reporter?.trustScore || 0}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Target */}
                            <div className="glass p-3 rounded-xl">
                              <h4 className="text-white/60 text-xs mb-2">Target</h4>
                              <div className="flex items-center gap-2">
                                {report.target?.photo && (
                                  <img
                                    src={report.target.photo}
                                    alt={report.target.name}
                                    className="w-10 h-10 rounded-full"
                                  />
                                )}
                                <div>
                                  <p className="text-white text-sm font-medium">
                                    {report.target?.name || 'Unknown'}
                                  </p>
                                  <p className="text-white/40 text-xs">
                                    Trust: {report.target?.trustScore || 0} • Status: {report.target?.status || 'active'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          {report.status === 'pending' && (
                            <div className="flex gap-2">
                              <GlassButton
                                variant="primary"
                                onClick={() => viewReportDetails(report._id)}
                                className="flex-1 bg-red-500 hover:bg-red-600"
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Review & Take Action
                              </GlassButton>
                            </div>
                          )}

                          {/* Resolution Info */}
                          {report.status === 'resolved' && (
                            <div className="glass p-3 rounded-xl">
                              <div className="flex items-center gap-2 mb-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <h4 className="text-white text-sm font-medium">
                                  Resolved: {report.action}
                                </h4>
                              </div>
                              {report.reviewNotes && (
                                <p className="text-white/60 text-sm">{report.reviewNotes}</p>
                              )}
                              {report.resolvedAt && (
                                <p className="text-white/40 text-xs mt-2">
                                  {new Date(report.resolvedAt).toLocaleString()}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Resolve Modal */}
        <AnimatePresence>
          {showResolveModal && selectedReport && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
                onClick={() => setShowResolveModal(false)}
              />

              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="glass-strong max-w-2xl w-full rounded-2xl p-6 shadow-2xl border border-red-500/20 max-h-[90vh] overflow-y-auto">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">Resolve Report</h2>
                    <button
                      onClick={() => setShowResolveModal(false)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <XCircle className="w-6 h-6 text-white/60" />
                    </button>
                  </div>

                  {/* Report Details */}
                  <div className="space-y-4 mb-6">
                    <div>
                      <h3 className="text-white/80 text-sm font-medium mb-2">Report Type</h3>
                      <p className="text-white">{reportTypeLabels[selectedReport.type]}</p>
                    </div>

                    <div>
                      <h3 className="text-white/80 text-sm font-medium mb-2">Description</h3>
                      <p className="text-white/90">{selectedReport.reason}</p>
                    </div>

                    {selectedReport.target && (
                      <div className="glass p-4 rounded-xl">
                        <h3 className="text-white/80 text-sm font-medium mb-3">Target User Stats</h3>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-white/60 text-xs">Trust Score</p>
                            <p className="text-white text-lg font-medium">
                              {selectedReport.target.trustScore || 0}
                            </p>
                          </div>
                          <div>
                            <p className="text-white/60 text-xs">Total Reports</p>
                            <p className="text-white text-lg font-medium">
                              {selectedReport.target.reportCount || 0}
                            </p>
                          </div>
                          <div>
                            <p className="text-white/60 text-xs">Status</p>
                            <p className="text-white text-lg font-medium capitalize">
                              {selectedReport.target.status || 'active'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Selection */}
                  <div className="mb-4">
                    <label className="text-white/80 text-sm font-medium mb-2 block">
                      Select Action <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['warning', 'suspension', 'ban', 'dismiss'] as const).map((action) => (
                        <button
                          key={action}
                          onClick={() => setResolveAction(action)}
                          className={`p-3 rounded-xl border transition-all text-left ${
                            resolveAction === action
                              ? 'border-red-500 bg-red-500/10'
                              : 'border-white/10 hover:border-white/20'
                          }`}
                        >
                          <p className={`font-medium capitalize ${
                            resolveAction === action ? 'text-red-500' : 'text-white'
                          }`}>
                            {action}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Suspension Days */}
                  {resolveAction === 'suspension' && (
                    <div className="mb-4">
                      <label className="text-white/80 text-sm font-medium mb-2 block">
                        Suspension Days
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={365}
                        value={suspensionDays}
                        onChange={(e) => setSuspensionDays(parseInt(e.target.value))}
                        className="w-full p-3 bg-dark-surface border border-white/10 rounded-xl text-white focus:outline-none focus:border-red-500/50"
                      />
                    </div>
                  )}

                  {/* Notes */}
                  <div className="mb-6">
                    <label className="text-white/80 text-sm font-medium mb-2 block">
                      Resolution Notes <span className="text-red-500">*</span>
                      <span className="text-white/40 text-xs ml-2">
                        ({resolveNotes.length}/500, min 10)
                      </span>
                    </label>
                    <textarea
                      value={resolveNotes}
                      onChange={(e) => setResolveNotes(e.target.value)}
                      placeholder="Explain your decision..."
                      className="w-full p-3 bg-dark-surface border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-red-500/50 resize-none"
                      rows={4}
                      maxLength={500}
                    />
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                      <p className="text-red-400 text-sm">{error}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3">
                    <GlassButton
                      variant="secondary"
                      onClick={() => setShowResolveModal(false)}
                      fullWidth
                      disabled={resolving}
                    >
                      Cancel
                    </GlassButton>
                    <GlassButton
                      variant="primary"
                      onClick={handleResolve}
                      disabled={resolveNotes.trim().length < 10 || resolving}
                      fullWidth
                      className={`${
                        resolveNotes.trim().length >= 10
                          ? 'bg-red-500 hover:bg-red-600'
                          : 'opacity-50 cursor-not-allowed'
                      }`}
                    >
                      {resolving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                          Resolving...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Confirm & Resolve
                        </>
                      )}
                    </GlassButton>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
