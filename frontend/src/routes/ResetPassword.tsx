import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { authAPI } from '../services/api';
import { PasswordInput } from '../components/PasswordInput';
import { FullScreenLayout } from '../components/FullScreenLayout';

export const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || '';
  const token = location.state?.token || '';
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Password strength validation
  const passwordRequirements = {
    minLength: newPassword.length >= 8,
    hasUppercase: /[A-Z]/.test(newPassword),
    hasLowercase: /[a-z]/.test(newPassword),
    hasNumber: /\d/.test(newPassword),
  };

  const isPasswordValid = Object.values(passwordRequirements).every(Boolean);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  // Redirect if no token
  useEffect(() => {
    if (!email || !token) {
      navigate('/forgot-password');
    }
  }, [email, token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isPasswordValid) {
      setError('Password does not meet requirements');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await authAPI.resetPassword({ 
        email, 
        token, 
        newPassword 
      });
      
      setSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: 'Password reset successful! Please login with your new password.' 
          } 
        });
      }, 3000);
    } catch (err: any) {
      setError(err?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <FullScreenLayout>
        <div className="min-h-screen flex items-center justify-center px-4 py-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md text-center"
          >
            <div className="glass-panel p-8 rounded-2xl">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
              >
                <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-6" />
              </motion.div>
              <h2 className="text-3xl font-bold text-white mb-3">
                Password Reset!
              </h2>
              <p className="text-white/60 mb-6">
                Your password has been successfully reset. Redirecting to login...
              </p>
              <div className="w-12 h-1 bg-white/20 mx-auto rounded-full overflow-hidden">
                <div className="h-full bg-green-400 animate-pulse w-full" />
              </div>
            </div>
          </motion.div>
        </div>
      </FullScreenLayout>
    );
  }

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
            to="/verify-reset-otp"
            state={{ email }}
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
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
              Create New Password
            </h2>
            <p className="text-white/60 text-sm mb-6">
              Please create a strong password for your account
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
              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  New Password
                </label>
                <PasswordInput
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  autoComplete="new-password"
                  required
                  tone="dark"
                />
                
                {/* Password Requirements */}
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-medium text-white/60">Password must contain:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className={`flex items-center gap-2 text-xs ${passwordRequirements.minLength ? 'text-green-400' : 'text-white/40'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${passwordRequirements.minLength ? 'bg-green-400' : 'bg-white/20'}`} />
                      8+ characters
                    </div>
                    <div className={`flex items-center gap-2 text-xs ${passwordRequirements.hasUppercase ? 'text-green-400' : 'text-white/40'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${passwordRequirements.hasUppercase ? 'bg-green-400' : 'bg-white/20'}`} />
                      Uppercase
                    </div>
                    <div className={`flex items-center gap-2 text-xs ${passwordRequirements.hasLowercase ? 'text-green-400' : 'text-white/40'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${passwordRequirements.hasLowercase ? 'bg-green-400' : 'bg-white/20'}`} />
                      Lowercase
                    </div>
                    <div className={`flex items-center gap-2 text-xs ${passwordRequirements.hasNumber ? 'text-green-400' : 'text-white/40'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${passwordRequirements.hasNumber ? 'bg-green-400' : 'bg-white/20'}`} />
                      Number
                    </div>
                  </div>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Confirm Password
                </label>
                <PasswordInput
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  autoComplete="new-password"
                  required
                  tone="dark"
                />
                {confirmPassword.length > 0 && (
                  <p className={`mt-2 text-xs ${passwordsMatch ? 'text-green-400' : 'text-red-400'}`}>
                    {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !isPasswordValid || !passwordsMatch}
                className="w-full py-3 btn-primary rounded-xl font-bold text-lg mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Resetting Password...' : 'Reset Password'}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </FullScreenLayout>
  );
};
