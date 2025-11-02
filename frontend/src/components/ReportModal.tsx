import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { X, AlertTriangle, Shield, User, MessageSquare, Camera } from 'lucide-react';
import { GlassButton } from './GlassButton';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser?: {
    id: string;
    name: string;
    avatar: string;
  };
  onSubmit: (report: ReportData) => void;
}

interface ReportData {
  reason: string;
  details: string;
  evidence: string[];
  urgent: boolean;
}

const reportReasons = [
  {
    id: 'fake_profile',
    label: 'Fake Profile',
    description: 'Photo palsu, info bohong, atau catfish',
    icon: User
  },
  {
    id: 'harassment',
    label: 'Harassment',
    description: 'Perilaku tidak pantas atau mengganggu',
    icon: AlertTriangle
  },
  {
    id: 'spam',
    label: 'Spam/Scam',
    description: 'Promosi berlebihan atau penipuan',
    icon: MessageSquare
  },
  {
    id: 'inappropriate_content',
    label: 'Inappropriate Content',
    description: 'Konten tidak sesuai atau melanggar',
    icon: Camera
  },
  {
    id: 'other',
    label: 'Lainnya',
    description: 'Pelanggaran lain yang perlu dilaporkan',
    icon: Shield
  }
];

export const ReportModal = ({ isOpen, onClose, targetUser, onSubmit }: ReportModalProps) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [details, setDetails] = useState('');
  const [evidence, setEvidence] = useState<string[]>([]);
  const [urgent, setUrgent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason || !details.trim()) return;

    setSubmitting(true);
    try {
      await onSubmit({
        reason: selectedReason,
        details,
        evidence,
        urgent
      });
      
      // Reset form
      setSelectedReason('');
      setDetails('');
      setEvidence([]);
      setUrgent(false);
      onClose();
    } catch (error) {
      console.error('Failed to submit report:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEvidenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newEvidence: string[] = [];
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newEvidence.push(reader.result as string);
        setEvidence([...evidence, ...newEvidence]);
      };
      reader.readAsDataURL(file);
    });
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
                  Detail kejadian:
                </label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Jelaskan apa yang terjadi..."
                  className="w-full p-3 bg-dark-surface border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-red-500/50 transition-colors resize-none"
                  rows={4}
                />
              </div>

              {/* Evidence Upload */}
              <div className="mb-4">
                <label className="text-white/80 text-sm font-medium mb-2 block">
                  Bukti screenshot (opsional):
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleEvidenceUpload}
                  className="hidden"
                  id="evidence-upload"
                />
                <label 
                  htmlFor="evidence-upload"
                  className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-white/20 rounded-xl hover:border-white/40 cursor-pointer transition-colors"
                >
                  <Camera className="w-5 h-5 text-white/40" />
                  <span className="text-white/60 text-sm">Upload screenshot</span>
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
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Urgent Flag */}
              <label className="flex items-center gap-3 mb-6 cursor-pointer">
                <input
                  type="checkbox"
                  checked={urgent}
                  onChange={(e) => setUrgent(e.target.checked)}
                  className="w-5 h-5 rounded border-2 border-white/20 bg-transparent checked:bg-red-500 checked:border-red-500"
                />
                <span className="text-white/80 text-sm">
                  Ini urgent (user membahayakan keselamatan)
                </span>
              </label>

              {/* Actions */}
              <div className="flex gap-3">
                <GlassButton
                  variant="secondary"
                  onClick={onClose}
                  fullWidth
                >
                  Batal
                </GlassButton>
                <GlassButton
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={!selectedReason || !details.trim() || submitting}
                  fullWidth
                  className={`${
                    selectedReason && details.trim()
                      ? 'bg-red-500 hover:bg-red-600'
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                >
                  {submitting ? 'Mengirim...' : 'Submit Report'}
                </GlassButton>
              </div>

              {/* Privacy Note */}
              <p className="text-white/40 text-xs text-center mt-4">
                Report kamu akan di-review tim safety. Identitas pelapor dirahasiakan.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
