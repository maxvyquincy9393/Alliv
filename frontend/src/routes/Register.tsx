import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { PasswordInput } from '../components/PasswordInput';

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
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <Link to="/">
          <h1 className="text-5xl sm:text-6xl font-semibold text-black text-center mb-12 cursor-pointer hover:opacity-70 transition-opacity">
            Alliv
          </h1>
        </Link>

        {/* Form Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200">
          <h2 className="text-2xl sm:text-3xl font-semibold text-black mb-6">Create Account</h2>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                placeholder="John Doe"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 chars, uppercase, lowercase, digit"
                autoComplete="new-password"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Must be at least 8 characters with uppercase, lowercase, and a digit
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-black text-white font-semibold rounded-full hover:bg-gray-800 transition-colors mt-6 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-300" />
            <span className="text-gray-500 text-sm">or</span>
            <div className="flex-1 h-px bg-gray-300" />
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => {
                window.location.href = 'http://localhost:8000/auth/oauth/google';
              }}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-gray-700 font-medium">Continue with Google</span>
            </button>
            
            <button
              type="button"
              onClick={() => {
                window.location.href = 'http://localhost:8000/auth/oauth/github';
              }}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <span className="text-gray-700 font-medium">Continue with GitHub</span>
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-black hover:opacity-70 transition-opacity font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
