import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { PasswordInput } from '../components/PasswordInput';
import { FiMail, FiUser } from 'react-icons/fi';
import { AnimatedBackground } from '../components/AnimatedBackground';

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
      
      // Create timeout wrapper
      const withTimeout = (promise: Promise<any>, timeoutMs: number = 30000) => {
        return Promise.race([
          promise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout - server not responding')), timeoutMs)
          )
        ]);
      };

      // Step 1: Register user
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
        
        if (verifyResponse.error) {
          console.warn('⚠️ Failed to send verification email, but registration succeeded');
        }

        // Step 3: Navigate to verification page
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
      setLoading(false);
    }
  };

  const handleOAuth = (provider: 'google' | 'github') => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
    window.location.href = `${API_URL}/auth/oauth/${provider}`;
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden">
      <AnimatedBackground />
      
      <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-4 py-10 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="relative space-y-6"
        >
          <div className="text-center space-y-2">
            <Link
              to="/"
              className="inline-flex text-xs font-semibold uppercase tracking-[0.25em] text-white/50 hover:text-white transition-colors"
            >
              Alliv
            </Link>
            <h1 className="text-3xl font-bold text-white tracking-tight font-display">Create Account</h1>
            <p className="text-sm text-white/60">Start building your dream team today.</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 shadow-2xl backdrop-blur-xl sm:p-8 ring-1 ring-white/5">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400"
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <label className="flex flex-col gap-2 text-sm font-medium text-white/70">
                Full Name
                <div className="relative group">
                  <FiUser className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base text-white/40 group-focus-within:text-white/80 transition-colors" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 pl-11 text-base text-white placeholder:text-white/20 focus:border-white/20 focus:ring-1 focus:ring-white/20 focus:bg-white/10 transition-all outline-none"
                    placeholder="John Doe"
                    required
                  />
                </div>
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-white/70">
                Email
                <div className="relative group">
                  <FiMail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base text-white/40 group-focus-within:text-white/80 transition-colors" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 pl-11 text-base text-white placeholder:text-white/20 focus:border-white/20 focus:ring-1 focus:ring-white/20 focus:bg-white/10 transition-all outline-none"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-white/70">
                Password
                <PasswordInput
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 chars, uppercase, lowercase, digit"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-base text-white placeholder:text-white/20 focus:border-white/20 focus:ring-1 focus:ring-white/20 focus:bg-white/10 transition-all outline-none"
                  tone="light"
                  autoComplete="new-password"
                  required
                />
                <p className="text-[10px] text-white/30 mt-1">
                  Must include uppercase, lowercase, and number.
                </p>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-white px-4 py-3.5 font-semibold text-black transition-all hover:bg-gray-200 hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none shadow-lg shadow-white/5"
              >
                {loading ? 'Creating...' : 'Create Account'}
              </button>
            </form>

            <div className="pt-8">
              <div className="flex items-center gap-4 text-white/20 mb-6">
                <div className="h-px flex-1 bg-current" />
                <span className="text-[10px] font-semibold uppercase tracking-widest">or continue with</span>
                <div className="h-px flex-1 bg-current" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <SocialButton label="Google" onClick={() => handleOAuth('google')} />
                <SocialButton label="GitHub" onClick={() => handleOAuth('github')} />
              </div>
            </div>

            <p className="mt-8 text-center text-sm text-white/40">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-white hover:text-white/80 transition-colors">
                Sign In
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

interface SocialButtonProps {
  label: string;
  onClick: () => void;
}

const SocialButton = ({ label, onClick }: SocialButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm font-medium text-white/70 transition-all hover:bg-white/[0.05] hover:text-white hover:border-white/20 active:scale-95"
  >
    {label}
  </button>
);
