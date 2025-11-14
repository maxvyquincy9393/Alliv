import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { PasswordInput } from '../components/PasswordInput';
import { FiMail, FiUser } from 'react-icons/fi';
import { FaGoogle, FaGithub } from 'react-icons/fa';

export const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate password (match backend requirements)
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setError('Password must contain at least one uppercase letter');
      setLoading(false);
      return;
    }
    if (!/[a-z]/.test(password)) {
      setError('Password must contain at least one lowercase letter');
      setLoading(false);
      return;
    }
    if (!/[0-9]/.test(password)) {
      setError('Password must contain at least one digit');
      setLoading(false);
      return;
    }

    try {
      console.log('🚀 Starting registration:', { name, email });
      console.log('📝 Step 1: Creating timeout wrapper...');
      
      // Create timeout wrapper
      const withTimeout = (promise: Promise<any>, timeoutMs: number = 30000) => {
        console.log('⏱️ Timeout wrapper created with', timeoutMs, 'ms');
        return Promise.race([
          promise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout - server not responding')), timeoutMs)
          )
        ]);
      };

      // Step 1: Register user
      console.log('📝 Step 2: Calling register API...');
      console.log('API Data:', { name, email, password: '***', birthdate: '' });
      
      try {
        const registerResponse = await withTimeout(
          authAPI.register({
            name,
            email,
            password,
            birthdate: '' // Optional
          })
        );

        console.log('✅ Register response:', registerResponse);

        if (registerResponse.error) {
          throw new Error(registerResponse.error);
        }

        // Step 2: Request verification code
        console.log('📧 Requesting verification email...');
        const verifyResponse = await withTimeout(
          authAPI.requestVerification({ email })
        );
        
        console.log('✅ Verify response:', verifyResponse);
        
        if (verifyResponse.error) {
          console.warn('⚠️ Failed to send verification email, but registration succeeded');
        }

        // Step 3: Navigate to verification page
        console.log('🎯 Navigating to verify-email page...');
        navigate('/verify-email', {
          state: {
            email: email,
            fromRegister: true
          },
          replace: true
        });
      } catch (innerErr) {
        console.error('💥 Inner error during API calls:', innerErr);
        throw innerErr; // Re-throw to outer catch
      }

    } catch (err: any) {
      console.error('❌ Registration error:', err);
      console.error('Error details:', {
        message: err?.message,
        stack: err?.stack,
        fullError: err
      });
      
      if (err?.message?.includes('already registered')) {
        setError('Email already registered. Please login instead.');
      } else if (err?.message?.includes('timeout')) {
        setError('Server not responding. Please try again or check your connection.');
      } else if (err?.message) {
        setError(err.message);
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      console.log('🏁 Registration process completed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-32 h-32 bg-white/5 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl animate-pulse-slow delay-1000"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <Link to="/">
          <motion.h1 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-5xl sm:text-6xl font-display font-bold text-white text-center mb-12 cursor-pointer hover:opacity-80 transition-opacity"
          >
            Alliv
          </motion.h1>
        </Link>

        {/* Form Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/20 shadow-depth-xl relative"
        >
          {/* Card shine effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent rounded-3xl pointer-events-none"></div>
          
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-white mb-8 text-center">
            Create Account
          </h2>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm backdrop-blur-sm"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Input */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <label className="block text-sm font-medium text-white/70 mb-2">
                Full Name
              </label>
              <div className="relative">
                <FiUser className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40 text-lg" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white focus:border-white/40 transition-all hover:border-white/30"
                  placeholder="Enter your full name"
                  required
                />
              </div>
            </motion.div>

            {/* Email Input */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <label className="block text-sm font-medium text-white/70 mb-2">
                Email Address
              </label>
              <div className="relative">
                <FiMail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40 text-lg" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white focus:border-white/40 transition-all hover:border-white/30"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </motion.div>

            {/* Password Input */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <label className="block text-sm font-medium text-white/70 mb-2">
                Password
              </label>
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 chars, uppercase, lowercase, digit"
                autoComplete="new-password"
                className="w-full pl-4 pr-12 py-4 bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white focus:border-white/40 transition-all hover:border-white/30"
                required
              />
              <p className="mt-2 text-xs text-white/50">
                Must be at least 8 characters with uppercase, lowercase, and a digit
              </p>
            </motion.div>

            {/* Submit Button */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-white text-black font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 mt-8 hover:bg-white/90 shadow-depth-md hover:shadow-depth-lg"
            >
              {loading && (
                <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {loading ? 'Creating Account...' : 'Create Account'}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-white/20" />
            <span className="text-white/50 text-sm font-medium">or</span>
            <div className="flex-1 h-px bg-white/20" />
          </div>

          {/* Social Login Buttons */}
          <div className="space-y-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => {
                window.location.href = 'http://localhost:8000/auth/oauth/google';
              }}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl hover:bg-white/10 hover:border-white/30 transition-all duration-300"
            >
              <FaGoogle className="text-white text-lg" />
              <span className="text-white font-medium">Continue with Google</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => {
                window.location.href = 'http://localhost:8000/auth/oauth/github';
              }}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl hover:bg-white/10 hover:border-white/30 transition-all duration-300"
            >
              <FaGithub className="text-white text-lg" />
              <span className="text-white font-medium">Continue with GitHub</span>
            </motion.button>
          </div>

          {/* Login Link */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-center text-white/70 mt-8"
          >
            Already have an account?{' '}
            <Link 
              to="/login" 
              className="text-white hover:opacity-80 font-medium transition-opacity"
            >
              Sign in
            </Link>
          </motion.p>
        </motion.div>
      </motion.div>
    </div>
  );
};
