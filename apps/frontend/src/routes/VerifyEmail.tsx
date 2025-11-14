import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { authAPI } from '../services/api';

export const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  const [status, setStatus] = useState<'pending' | 'verifying' | 'success' | 'error'>('pending');
  const [error, setError] = useState('');
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  // Get email from navigation state or URL
  const email = location.state?.email || searchParams.get('email') || '';
  const maskedEmail = maskEmail(email);
  
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

      // Success! Store tokens
      if (response.data?.accessToken) {
        console.log('✅ Verification success! Storing tokens...');
        localStorage.setItem('access_token', response.data.accessToken);
        localStorage.setItem('refresh_token', response.data.refreshToken || '');
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
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <h1 className="text-5xl sm:text-6xl font-semibold text-black text-center mb-12">
          Alliv
        </h1>

        {/* Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200">
          
          {/* Pending - Waiting for code input */}
          {status === 'pending' && (
            <>
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-black mb-2">
                  Verify Your Email
                </h2>
                <p className="text-gray-600 text-sm">
                  We've sent a 6-digit code to:
                </p>
                <p className="text-black font-medium mt-1 mb-2">{maskedEmail}</p>
                <button
                  onClick={() => {
                    localStorage.clear();
                    navigate('/register');
                  }}
                  className="text-xs text-gray-500 hover:text-black hover:underline transition-colors"
                >
                  Not your email? Change account
                </button>
              </div>

              {/* 6-Digit Code Input */}
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 mb-3 text-center">
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
                      className="w-12 h-14 text-center text-2xl font-semibold border-2 border-gray-300 rounded-xl focus:border-black focus:outline-none transition-colors"
                      autoComplete="off"
                      autoFocus={index === 0}
                    />
                  ))}
                </div>
                {error && (
                  <p className="text-sm text-red-600 mt-3 text-center">{error}</p>
                )}
              </div>

              <div className="space-y-3 text-sm text-gray-600 mb-6">
                <p>• Check your inbox and spam folder</p>
                <p>• The code expires in 10 minutes</p>
                <p>• Or click the link in the email</p>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">
                  Didn't receive the code?
                </p>
                <button
                  onClick={handleResendCode}
                  disabled={!canResend}
                  className="text-black font-medium hover:underline disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline"
                >
                  {canResend ? 'Resend code' : `Resend in ${countdown}s`}
                </button>
              </div>

              {/* Change Account Button */}
              <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                <p className="text-sm text-gray-600 mb-2">
                  Wrong email address?
                </p>
                <button
                  onClick={() => {
                    // Clear stored data
                    localStorage.clear();
                    // Redirect to register
                    navigate('/register');
                  }}
                  className="text-gray-700 font-medium hover:text-black hover:underline transition-colors"
                >
                  Change Account
                </button>
              </div>
            </>
          )}

          {/* Verifying */}
          {status === 'verifying' && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-black mb-4"></div>
              <h2 className="text-xl font-semibold text-black mb-2">
                Verifying...
              </h2>
              <p className="text-gray-600">Please wait</p>
            </div>
          )}

          {/* Success */}
          {status === 'success' && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-black mb-2">
                Email Verified!
              </h2>
              <p className="text-gray-600">Redirecting to profile setup...</p>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-black mb-2">
                Verification Failed
              </h2>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={() => {
                  setStatus('pending');
                  setError('');
                  setVerificationCode(['', '', '', '', '', '']);
                  inputRefs.current[0]?.focus();
                }}
                className="px-6 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
              >
                Try Again
              </button>

              {/* Change Account Option */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-2">
                  Wrong email address?
                </p>
                <button
                  onClick={() => {
                    localStorage.clear();
                    navigate('/register');
                  }}
                  className="text-gray-700 font-medium hover:text-black hover:underline transition-colors"
                >
                  Change Account
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
