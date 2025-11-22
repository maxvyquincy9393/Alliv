import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';
import { authAPI } from '../services/api';
import { FullScreenLayout } from '../components/FullScreenLayout';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Request OTP for password reset
      const response = await authAPI.requestPasswordReset({ email });
      if (response.error) {
        setError(response.error);
        setSuccess(false);
        return;
      }

      setSuccess(true);
      
      // Navigate to OTP verification page after 2 seconds
      setTimeout(() => {
        navigate('/verify-reset-otp', { 
          state: { email, fromForgotPassword: true } 
        });
      }, 2000);
    } catch (err: any) {
      setError(err?.message || 'Failed to send reset code. Please try again.');
    } finally {
      setLoading(false);
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
            to="/login"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Login
          </Link>

          {/* Logo */}
          <Link to="/">
            <h1 className="text-5xl sm:text-6xl font-bold text-white text-center mb-12 cursor-pointer hover:opacity-80 transition-opacity font-display">
              Alliv
            </h1>
          </Link>

          {/* Form Card */}
          <div className="glass-panel p-8 rounded-2xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Forgot Password?
            </h2>
            <p className="text-white/60 text-sm mb-6">
              No worries! Enter your email and we'll send you a verification code to reset your password.
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

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm"
              >
                ✓ Verification code sent! Redirecting...
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                    placeholder="you@example.com"
                    required
                    disabled={success}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || success}
                className="w-full py-3 btn-primary rounded-xl font-bold text-lg mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : success ? 'Code Sent!' : 'Send Reset Code'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-white/60 text-sm">
                Remember your password?{' '}
                <Link
                  to="/login"
                  className="text-white hover:text-purple-400 transition-colors font-medium"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </FullScreenLayout>
  );
};
