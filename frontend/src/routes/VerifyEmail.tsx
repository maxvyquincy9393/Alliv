import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { rateLimit } from '../lib/rateLimiter';
import { FullScreenLayout } from '../components/FullScreenLayout';
import { Mail, Check, X, Loader2 } from 'lucide-react';

export const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { setAuthUser } = useAuth();
  
  const [status, setStatus] = useState<'pending' | 'verifying' | 'success' | 'error'>('pending');
  const [error, setError] = useState('');
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  // Get email from navigation state or URL
  const email = location.state?.email || searchParams.get('email') || '';
  const maskedEmail = maskEmail(email);
  const RESEND_INTERVAL_MS = 120000;
  const RESEND_LIMIT = 3;
  
  // Refs for input management
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  // Auto-verify from magic link (URL token parameter)
  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      // Magic link clicked - redirect to backend for verification
      window.location.href = `http://localhost:8000/auth/verify/email?token=${tokenFromUrl}`;
    }
  }, [searchParams]);

  // Handle code input change
  const handleCodeChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (newCode.every(digit => digit !== '') && index === 5) {
      handleVerifyWithCode(newCode.join(''));
    }
  };

  // Handle backspace navigation
  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    
    if (pastedData.length === 6) {
      const newCode = pastedData.split('');
      setVerificationCode(newCode);
      inputRefs.current[5]?.focus();
      handleVerifyWithCode(pastedData);
    }
  };

  // Verify with 6-digit code
  const handleVerifyWithCode = async (code: string) => {
    setStatus('verifying');
    setError('');

    try {
      console.log('🔍 Sending verification:', { email, code });
      
      const response = await authAPI.confirmVerification({
        email,
        code
      });

      console.log('📥 Verification response:', response);

      if (response.error) {
        console.error('❌ Verification error:', response.error);
        throw new Error(response.error);
      }

      // Auto-login user
      if (response.data?.user) {
        setAuthUser(response.data.user);
      }

      setStatus('success');

      // Redirect to setup profile after 2 seconds
      setTimeout(() => {
        navigate('/setup-profile');
      }, 2000);

    } catch (err: any) {
      console.error('❌ Verification failed:', err);
      setStatus('error');
      setError(err?.message || 'Invalid verification code. Please try again.');
      // Reset code inputs
      setVerificationCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  // Resend verification code
  const handleResendCode = async () => {
    if (!canResend) return;

    const { allowed, retryAfter } = rateLimit(
      `verify-email-${email}`,
      RESEND_LIMIT,
      RESEND_INTERVAL_MS,
    );
    if (!allowed) {
      setError(`Please wait ${Math.ceil(retryAfter / 1000)}s before resending another code.`);
      return;
    }

    try {
      setCanResend(false);
      setCountdown(60);
      setError('');

      const response = await authAPI.requestVerification({ email });

      if (response.error) {
        throw new Error(response.error);
      }

      // Show success message
      setError('');
      
    } catch (err: any) {
      if (err?.message?.includes('wait')) {
        setError(err.message);
      } else {
        setError('Failed to resend code. Please try again.');
      }
      setCanResend(true);
      setCountdown(0);
    }
  };

  // Utility: Mask email
  function maskEmail(email: string): string {
    if (!email) return '';
    try {
      const [local, domain] = email.split('@');
      const domainParts = domain.split('.');
      const maskedLocal = local[0] + '***';
      const maskedDomain = domainParts[0][0] + '***';
      const tld = '.' + domainParts.slice(1).join('.');
      return `${maskedLocal}@${maskedDomain}${tld}`;
    } catch {
      return '***@***.com';
    }
  }

  return (
    <FullScreenLayout>
      <div className="min-h-screen flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <h1 className="text-5xl sm:text-6xl font-bold text-white text-center mb-12 font-display">
            Alliv
          </h1>

          {/* Card */}
          <div className="glass-panel p-8 rounded-2xl">
            
            {/* Pending - Waiting for code input */}
            {status === 'pending' && (
              <>
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-full mb-4">
                    <Mail className="w-8 h-8 text-blue-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Verify Your Email
                  </h2>
                  <p className="text-white/60 text-sm">
                    We've sent a 6-digit code to:
                  </p>
                  <p className="text-white font-medium mt-1 mb-2">{maskedEmail}</p>
                  <button
                    onClick={() => {
                      localStorage.clear();
                      navigate('/register');
                    }}
                    className="text-xs text-white/40 hover:text-white hover:underline transition-colors"
                  >
                    Not your email? Change account
                  </button>
                </div>

                {/* 6-Digit Code Input */}
                <div className="mb-6">
                  <p className="text-sm font-medium text-white/80 mb-3 text-center">
                    Enter the code from your email:
                  </p>
                  <div className="flex justify-center gap-2">
                    {verificationCode.map((digit, index) => (
                      <input
                        key={index}
                        ref={el => { inputRefs.current[index] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleCodeChange(index, e.target.value)}
                        onKeyDown={(e) => handleCodeKeyDown(index, e)}
                        onPaste={index === 0 ? handlePaste : undefined}
                        className="w-12 h-14 text-center text-2xl font-bold bg-white/5 border border-white/10 rounded-xl text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none transition-all"
                        autoComplete="off"
                        autoFocus={index === 0}
                      />
                    ))}
                  </div>
                  {error && (
                    <p className="text-sm text-red-400 mt-3 text-center">{error}</p>
                  )}
                </div>

                <div className="space-y-3 text-sm text-white/60 mb-6">
                  <p>• Check your inbox and spam folder</p>
                  <p>• The code expires in 10 minutes</p>
                  <p>• Or click the link in the email</p>
                </div>

                <div className="text-center">
                  <p className="text-sm text-white/60 mb-2">
                    Didn't receive the code?
                  </p>
                  <button
                    onClick={handleResendCode}
                    disabled={!canResend}
                    className="text-white font-medium hover:text-purple-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline transition-colors"
                  >
                    {canResend ? 'Resend code' : `Resend in ${countdown}s`}
                  </button>
                </div>

                {/* Change Account Button */}
                <div className="mt-6 pt-6 border-t border-white/10 text-center">
                  <p className="text-sm text-white/60 mb-2">
                    Wrong email address?
                  </p>
                  <button
                    onClick={() => {
                      // Clear stored data
                      localStorage.clear();
                      // Redirect to register
                      navigate('/register');
                    }}
                    className="text-white/80 font-medium hover:text-white hover:underline transition-colors"
                  >
                    Change Account
                  </button>
                </div>
              </>
            )}

            {/* Verifying */}
            {status === 'verifying' && (
              <div className="text-center py-8">
                <Loader2 className="w-12 h-12 text-white/20 animate-spin mx-auto mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">
                  Verifying...
                </h2>
                <p className="text-white/60">Please wait</p>
              </div>
            )}

            {/* Success */}
            {status === 'success' && (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
                  <Check className="w-8 h-8 text-green-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">
                  Email Verified!
                </h2>
                <p className="text-white/60">Redirecting to profile setup...</p>
              </div>
            )}

            {/* Error */}
            {status === 'error' && (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-4">
                  <X className="w-8 h-8 text-red-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">
                  Verification Failed
                </h2>
                <p className="text-red-400 mb-4">{error}</p>
                <button
                  onClick={() => {
                    setStatus('pending');
                    setError('');
                    setVerificationCode(['', '', '', '', '', '']);
                    inputRefs.current[0]?.focus();
                  }}
                  className="px-6 py-2 btn-primary rounded-full transition-colors"
                >
                  Try Again
                </button>

                {/* Change Account Option */}
                <div className="mt-6 pt-6 border-t border-white/10">
                  <p className="text-sm text-white/60 mb-2">
                    Wrong email address?
                  </p>
                  <button
                    onClick={() => {
                      localStorage.clear();
                      navigate('/register');
                    }}
                    className="text-white/80 font-medium hover:text-white hover:underline transition-colors"
                  >
                    Change Account
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </FullScreenLayout>
  );
};
