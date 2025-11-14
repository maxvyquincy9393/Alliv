import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { X, AlertTriangle, Shield, User, MessageSquare, Camera } from 'lucide-react';
import { GlassButton } from './GlassButton';
import axios from 'axios';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: {
    id: string;
    name: string;
    avatar?: string;
  };
  context?: {
    matchId?: string;
    messageId?: string;
    projectId?: string;
  };
}

const reportReasons = [
  {
    id: 'harassment',
    label: 'Harassment',
    description: 'Threatening, bullying, or harassing behavior',
    icon: AlertTriangle
  },
  {
    id: 'spam',
    label: 'Spam',
    description: 'Excessive promotion or spam messages',
    icon: MessageSquare
  },
  {
    id: 'inappropriate',
    label: 'Inappropriate Content',
    description: 'Offensive or inappropriate content',
    icon: Camera
  },
  {
    id: 'fake',
    label: 'Fake Profile',
    description: 'Fake photos, catfish, or impersonation',
    icon: User
  },
  {
    id: 'other',
    label: 'Other',
    description: 'Other violations of community guidelines',
    icon: Shield
  }
];

const CLOUDINARY_UPLOAD_PRESET = 'colabmatch_reports';
const CLOUDINARY_CLOUD_NAME = 'your_cloud_name'; // TODO: Update with actual cloud name

export const ReportModal = ({ isOpen, onClose, targetUser, context }: ReportModalProps) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [details, setDetails] = useState('');
  const [evidence, setEvidence] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', 'reports');

    try {
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        formData
      );
      return response.data.secure_url;
    } catch (err) {
      console.error('Upload failed:', err);
      throw new Error('Failed to upload screenshot');
    }
  };

  const handleSubmit = async () => {
    if (!selectedReason || details.trim().length < 20) {
      setError('Please provide at least 20 characters describing the issue');
      return;
    }

    if (details.trim().length > 1000) {
      setError('Description cannot exceed 1000 characters');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Please login to submit a report');
      }

      const reportData = {
        targetId: targetUser.id,
        type: selectedReason,
        reason: details.trim(),
        evidence: evidence,
        context: context || {}
      };

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/reports`,
        reportData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Report submitted:', response.data);
      setSuccess(true);
      
      // Show success message for 2 seconds, then close
      setTimeout(() => {
        setSelectedReason('');
        setDetails('');
        setEvidence([]);
        setSuccess(false);
        onClose();
      }, 2000);

    } catch (err: any) {
      console.error('Failed to submit report:', err);
      
      if (err.response?.status === 400) {
        if (err.response.data.detail?.includes('already reported')) {
          setError('You have already reported this user recently');
        } else if (err.response.data.detail?.includes('cannot report yourself')) {
          setError('You cannot report yourself');
        } else {
          setError(err.response.data.detail || 'Invalid report data');
        }
      } else if (err.response?.status === 404) {
        setError('User not found');
      } else if (err.response?.status === 401) {
        setError('Please login to submit a report');
      } else {
        setError('Failed to submit report. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEvidenceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Limit to 3 screenshots
    if (evidence.length + files.length > 3) {
      setError('Maximum 3 screenshots allowed');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const uploadPromises = Array.from(files).map(file => uploadToCloudinary(file));
      const urls = await Promise.all(uploadPromises);
      setEvidence([...evidence, ...urls]);
    } catch (err) {
      setError('Failed to upload screenshots. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="glass-strong max-w-lg w-full rounded-2xl p-6 shadow-2xl border border-red-500/20">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Report User</h2>
                    <p className="text-white/60 text-sm">Bantu jaga komunitas tetap aman</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>

              {/* User Info */}
              {targetUser && (
                <div className="flex items-center gap-3 p-3 glass rounded-xl mb-4">
                  <img 
                    src={targetUser.avatar} 
                    alt={targetUser.name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <p className="text-white font-medium">{targetUser.name}</p>
                    <p className="text-white/40 text-sm">ID: {targetUser.id}</p>
                  </div>
                </div>
              )}

              {/* Report Reasons */}
              <div className="space-y-2 mb-4">
                <label className="text-white/80 text-sm font-medium">
                  Pilih alasan report:
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {reportReasons.map((reason) => {
                    const Icon = reason.icon;
                    return (
                      <motion.button
                        key={reason.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedReason(reason.id)}
                        className={`flex items-start gap-3 p-3 rounded-xl border transition-all text-left ${
                          selectedReason === reason.id
                            ? 'border-red-500 bg-red-500/10'
                            : 'border-white/10 hover:border-white/20'
                        }`}
                      >
                        <Icon className={`w-5 h-5 flex-shrink-0 ${
                          selectedReason === reason.id ? 'text-red-500' : 'text-white/40'
                        }`} />
                        <div>
                          <p className={`font-medium ${
                            selectedReason === reason.id ? 'text-red-500' : 'text-white'
                          }`}>
                            {reason.label}
                          </p>
                          <p className="text-white/40 text-xs mt-0.5">
                            {reason.description}
                          </p>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Details */}
              <div className="mb-4">
                <label className="text-white/80 text-sm font-medium mb-2 block">
                  Describe what happened <span className="text-red-500">*</span>
                  <span className="text-white/40 text-xs ml-2">
                    ({details.length}/1000, min 20)
                  </span>
                </label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Please provide details about the violation..."
                  className="w-full p-3 bg-dark-surface border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-red-500/50 transition-colors resize-none"
                  rows={4}
                  maxLength={1000}
                />
                {details.length > 0 && details.length < 20 && (
                  <p className="text-red-400 text-xs mt-1">
                    Please provide at least 20 characters
                  </p>
                )}
              </div>

              {/* Evidence Upload */}
              <div className="mb-4">
                <label className="text-white/80 text-sm font-medium mb-2 block">
                  Evidence (screenshots, max 3):
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleEvidenceUpload}
                  className="hidden"
                  id="evidence-upload"
                  disabled={evidence.length >= 3 || uploading}
                />
                <label 
                  htmlFor="evidence-upload"
                  className={`flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-xl transition-colors ${
                    evidence.length >= 3 || uploading
                      ? 'border-white/10 cursor-not-allowed opacity-50'
                      : 'border-white/20 hover:border-white/40 cursor-pointer'
                  }`}
                >
                  <Camera className="w-5 h-5 text-white/40" />
                  <span className="text-white/60 text-sm">
                    {uploading ? 'Uploading...' : `Upload screenshot (${evidence.length}/3)`}
                  </span>
                </label>
                
                {/* Evidence Preview */}
                {evidence.length > 0 && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {evidence.map((img, index) => (
                      <div key={index} className="relative">
                        <img 
                          src={img} 
                          alt={`Evidence ${index + 1}`}
                          className="w-20 h-20 rounded-lg object-cover"
                        />
                        <button
                          onClick={() => setEvidence(evidence.filter((_, i) => i !== index))}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                          disabled={submitting}
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl"
                >
                  <p className="text-red-400 text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {error}
                  </p>
                </motion.div>
              )}

              {/* Success Message */}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl"
                >
                  <p className="text-green-400 text-sm flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Report submitted successfully! Our team will review it.
                  </p>
                </motion.div>
              )}

              {/* Warning about false reports */}
              <div className="mb-6 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                <p className="text-yellow-400 text-xs">
                  <AlertTriangle className="w-3 h-3 inline mr-1" />
                  <strong>Warning:</strong> False reports may result in penalties to your trust score.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <GlassButton
                  variant="secondary"
                  onClick={onClose}
                  fullWidth
                  disabled={submitting || success}
                >
                  Cancel
                </GlassButton>
                <GlassButton
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={!selectedReason || details.trim().length < 20 || submitting || uploading || success}
                  fullWidth
                  className={`${
                    selectedReason && details.trim().length >= 20 && !submitting
                      ? 'bg-red-500 hover:bg-red-600'
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                >
                  {submitting ? 'Submitting...' : success ? 'Submitted!' : 'Submit Report'}
                </GlassButton>
              </div>

              {/* Privacy Note */}
              <p className="text-white/40 text-xs text-center mt-4">
                Your report will be reviewed by our safety team. Reporter identity is confidential.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
