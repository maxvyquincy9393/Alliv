import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail } from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import { PasswordInput } from '../components/PasswordInput';
import { AnimatedBackground } from '../components/AnimatedBackground';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userData = await login(email, password);
      if (userData && 'profileComplete' in userData && userData.profileComplete === false) {
        navigate('/setup-profile');
      } else {
        navigate('/home');
      }
    } catch (err: any) {
      if (err?.message?.includes('verify your email')) {
        setError('Please verify your email before logging in.');
      } else if (err?.message?.includes('deactivated')) {
        setError('Your account has been deactivated. Contact support.');
      } else {
        setError('Invalid email or password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = (provider: 'google' | 'github') => {
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
            <h1 className="text-3xl font-bold text-white tracking-tight font-display">Sign In</h1>
            <p className="text-sm text-white/60">Use your email and password to continue.</p>
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
                <div className="flex items-center justify-between text-sm font-medium text-white/70">
                  <span>Password</span>
                  <Link to="/forgot-password" className="text-white/40 hover:text-white transition-colors text-xs">
                    Forgot password?
                  </Link>
                </div>
                <PasswordInput
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-base text-white placeholder:text-white/20 focus:border-white/20 focus:ring-1 focus:ring-white/20 focus:bg-white/10 transition-all outline-none"
                  tone="light"
                  autoComplete="current-password"
                  required
                />
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-white px-4 py-3.5 font-semibold text-black transition-all hover:bg-gray-200 hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none shadow-lg shadow-white/5"
              >
                {loading ? 'Processing...' : 'Sign In'}
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
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-white hover:text-white/80 transition-colors">
                Sign Up
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
