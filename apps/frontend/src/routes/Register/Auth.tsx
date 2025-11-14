import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { GlassButton } from '../../components/GlassButton';
import { fadeInUp, stagger, scaleIn } from '../../lib/motion';
import type { AuthProvider, VerificationMethod } from '../../types/profile';

export const Auth = () => {
  const [provider, setProvider] = useState<AuthProvider | null>(null);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationMethod, setVerificationMethod] = useState<VerificationMethod>('email');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(60);
  const navigate = useNavigate();

  const handleProviderAuth = (selectedProvider: AuthProvider) => {
    setProvider(selectedProvider);
    // Simulate OAuth flow
    setTimeout(() => {
      setShowVerification(true);
      startCountdown();
    }, 1000);
  };

  const startCountdown = () => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleVerify = () => {
    if (code.length >= 6) {
      // Mock verification success
      navigate('/register/account');
    }
  };

  const handleResend = () => {
    setCountdown(60);
    setCode('');
    startCountdown();
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <motion.div
        variants={stagger(0.1)}
        initial="hidden"
        animate="show"
        className="max-w-md w-full"
      >
        <AnimatePresence mode="wait">
          {!showVerification ? (
            <motion.div
              key="auth"
              variants={fadeInUp}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Header */}
              <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-white mb-3">
                  Create Account
                </h1>
                <p className="text-white/60">
                  Choose how you want to sign up
                </p>
              </div>

              {/* Provider Buttons */}
              <div className="space-y-3 mb-8">
                <ProviderButton
                  provider="google"
                  icon="🔵"
                  label="Continue with Google"
                  onClick={() => handleProviderAuth('google')}
                />
                <ProviderButton
                  provider="github"
                  icon="⚫"
                  label="Continue with GitHub"
                  onClick={() => handleProviderAuth('github')}
                />
                <ProviderButton
                  provider="x"
                  icon="⚪"
                  label="Continue with X"
                  onClick={() => handleProviderAuth('x')}
                />
              </div>

              {/* Divider */}
              <div className="relative mb-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 glass text-white/40">
                    or use email/phone
                  </span>
                </div>
              </div>

              {/* Email/Phone Option */}
              <GlassButton
                variant="secondary"
                fullWidth
                onClick={() => handleProviderAuth('email')}
              >
                Continue with Email/Phone
              </GlassButton>
            </motion.div>
          ) : (
            <motion.div
              key="verification"
              variants={scaleIn}
              initial="hidden"
              animate="show"
            >
              {/* Verification Step */}
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-3">
                  Verify Account
                </h2>
                <p className="text-white/60">
                  For security, we need to verify your {provider === 'email' ? 'email or phone' : 'account'}
                </p>
              </div>

              {/* Method Selection */}
              <div className="glass-card rounded-2xl p-6 mb-6">
                <label className="block text-sm font-medium text-white/70 mb-3">
                  Verification Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setVerificationMethod('email')}
                    className={`px-4 py-3 rounded-xl font-medium transition-all ${
                      verificationMethod === 'email'
                        ? 'glass-strong text-white shadow-glow-blue'
                        : 'glass text-white/60 hover:text-white'
                    }`}
                  >
                    Email Code
                  </button>
                  <button
                    onClick={() => setVerificationMethod('phone')}
                    className={`px-4 py-3 rounded-xl font-medium transition-all ${
                      verificationMethod === 'phone'
                        ? 'glass-strong text-white shadow-glow-blue'
                        : 'glass text-white/60 hover:text-white'
                    }`}
                  >
                    Phone OTP
                  </button>
                </div>

                {/* Code Input */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Enter {verificationMethod === 'email' ? '6-digit code' : 'OTP'}
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-3 glass rounded-xl text-white text-center text-2xl font-mono tracking-widest placeholder-white/30 focus:ring-2 focus:ring-accent-blue/50 transition-all"
                    placeholder="000000"
                  />
                </div>

                {/* Countdown */}
                <div className="mt-4 text-center">
                  {countdown > 0 ? (
                    <p className="text-sm text-white/40">
                      Resend code in {countdown}s
                    </p>
                  ) : (
                    <button
                      onClick={handleResend}
                      className="text-sm text-accent-blue hover:text-accent-blue-light transition-colors"
                    >
                      Resend Code
                    </button>
                  )}
                </div>
              </div>

              {/* Verify Button */}
              <GlassButton
                variant="primary"
                fullWidth
                onClick={handleVerify}
                disabled={code.length < 6}
              >
                Verify & Continue
              </GlassButton>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

interface ProviderButtonProps {
  provider: AuthProvider;
  icon: string;
  label: string;
  onClick: () => void;
}

const ProviderButton = ({ icon, label, onClick }: ProviderButtonProps) => (
  <motion.button
    variants={fadeInUp}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="w-full glass-card rounded-xl px-6 py-4 flex items-center gap-4 hover:shadow-glow-blue transition-all group"
  >
    <span className="text-2xl">{icon}</span>
    <span className="flex-1 text-left font-medium text-white group-hover:text-accent-blue transition-colors">
      {label}
    </span>
    <svg
      className="w-5 h-5 text-white/40 group-hover:text-accent-blue transition-colors"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5l7 7-7 7"
      />
    </svg>
  </motion.button>
);
