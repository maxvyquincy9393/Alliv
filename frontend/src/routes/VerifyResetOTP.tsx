import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { authAPI } from '../services/api';
import { rateLimit } from '../lib/rateLimiter';
import { FullScreenLayout } from '../components/FullScreenLayout';

export const VerifyResetOTP = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || '';
  
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const RESEND_INTERVAL_MS = 120000;
  const RESEND_LIMIT = 3;

  // Redirect if no email
  useEffect(() => {
    if (!email) {
      navigate('/forgot-password');
    }
  }, [email, navigate]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Verify the OTP code
      const response = await authAPI.verifyPasswordResetOTP({ email, code });
      
      // Extract token from response data
      const token = response.data?.token;
      
      if (!token) {
        throw new Error('No reset token received');
      }
      
      // Navigate to reset password page with token
      navigate('/reset-password', { 
        state: { 
          email, 
          token,
          fromOTPVerification: true 
        } 
      });
    } catch (err: any) {
      setError(err?.message || 'Invalid or expired code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;

    const { allowed, retryAfter } = rateLimit(`reset-otp-${email}`, RESEND_LIMIT, RESEND_INTERVAL_MS);
    if (!allowed) {
      setError(`Please wait ${Math.ceil(retryAfter / 1000)}s before requesting another code.`);
      return;
    }

    setResending(true);
    setError('');

    try {
      await authAPI.requestPasswordReset({ email });
      setCountdown(60);
      setCanResend(false);
      setError('');
    } catch (err: any) {
      setError(err?.message || 'Failed to resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <FullScreenLayout>
      <div className="min-h-screen flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Back Button */}
          <Link 
            to="/forgot-password"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </Link>

          {/* Logo */}
          <Link to="/">
            <h1 className="text-5xl sm:text-6xl font-bold text-white text-center mb-12 font-display cursor-pointer hover:opacity-80 transition-opacity">
              Alliv
            </h1>
          </Link>

          {/* Form Card */}
          <div className="glass-panel p-8 rounded-2xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Enter Verification Code
            </h2>
            <p className="text-white/60 text-sm mb-6">
              We sent a 6-digit code to <strong className="text-white">{email}</strong>
            </p>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm"
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-center text-2xl tracking-widest font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all placeholder:text-white/20"
                  placeholder="000000"
                  maxLength={6}
                  required
                  autoComplete="off"
                />
                <p className="text-xs text-white/40 mt-2 text-center">
                  Enter the 6-digit code from your email
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full py-3 btn-primary rounded-full transition-all mt-6 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify Code'
                )}
              </button>
            </form>

            {/* Resend Code */}
            <div className="mt-6 text-center">
              {canResend ? (
                <button
                  onClick={handleResendCode}
                  disabled={resending}
                  className="text-white hover:text-purple-400 transition-colors font-medium text-sm disabled:opacity-50"
                >
                  {resending ? 'Resending...' : 'Resend Code'}
                </button>
              ) : (
                <p className="text-white/40 text-sm">
                  Resend code in <strong className="text-white">{countdown}s</strong>
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </FullScreenLayout>
  );
};
