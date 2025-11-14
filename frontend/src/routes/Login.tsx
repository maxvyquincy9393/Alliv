import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail } from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import { PasswordInput } from '../components/PasswordInput';

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
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 opacity-70">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(140,111,247,0.2),_transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(53,245,255,0.15),_transparent_55%)]" />
      </div>

      <div className="relative z-10 shell-content flex min-h-screen items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md space-y-8"
        >
          <div className="text-center space-y-3">
            <Link to="/" className="text-sm font-semibold tracking-[0.2em] text-white/60 uppercase">
              Alivv
            </Link>
            <h1 className="text-3xl font-semibold">Welcome back</h1>
            <p className="text-[var(--color-text-muted)] text-sm">
              Sign in to continue chatting, matching, and shipping projects with your crew.
            </p>
          </div>

          <div className="panel p-6 sm:p-8 space-y-6">
            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <label className="flex flex-col gap-2 text-sm font-medium text-white/80">
                Email
                <div className="relative">
                  <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-lg" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-2xl border border-white/15 bg-white/5 px-12 py-3 text-base text-white placeholder:text-white/40 focus:border-white/60 focus:ring-0"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-white/80">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.15em]">
                  <span>Password</span>
                  <Link to="/forgot-password" className="text-white/60 hover:text-white">
                    Forgot?
                  </Link>
                </div>
                <PasswordInput
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-base text-white placeholder:text-white/40 focus:border-white/60 focus:ring-0"
                  autoComplete="current-password"
                  required
                />
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-white text-black font-semibold py-3 mt-4 disabled:opacity-60 disabled:cursor-not-allowed hover:-translate-y-0.5 transition-all"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs uppercase tracking-[0.3em] text-white/50">or</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <div className="space-y-3">
              <SocialButton label="Continue with Google" onClick={() => handleOAuth('google')} />
              <SocialButton label="Continue with GitHub" onClick={() => handleOAuth('github')} />
            </div>

            <p className="text-center text-sm text-white/70">
              New here?{' '}
              <Link to="/register" className="text-white underline-offset-4 hover:underline">
                Create an account
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
    className="w-full rounded-2xl border border-white/15 bg-transparent px-4 py-3 text-white/85 hover:bg-white/5"
  >
    {label}
  </button>
);
