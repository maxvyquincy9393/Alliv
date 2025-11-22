import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Loader2, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { PasswordInput } from '../components/PasswordInput';
import { FullScreenLayout } from '../components/FullScreenLayout';

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
    <FullScreenLayout>
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md relative z-10"
        >
          <div className="text-center space-y-6 mb-8">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-white/70 hover:bg-white/10 transition-colors"
            >
              <Sparkles className="w-3 h-3 text-blue-400" />
              <span>Alliv Network</span>
            </Link>
            
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-white tracking-tight font-display">
                Welcome Back
              </h1>
              <p className="text-white/50 text-lg">
                Enter the singularity.
              </p>
            </div>
          </div>

          <div className="glass-panel rounded-3xl p-8 shadow-2xl">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400 flex items-center gap-2"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-white/80 ml-1">Email</label>
                <div className="relative group">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within:text-white transition-colors" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-modern pl-11"
                    placeholder="visionary@alliv.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-sm font-medium text-white/80">Password</label>
                  <Link to="/forgot-password" className="text-xs text-white/40 hover:text-white transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <PasswordInput
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-modern"
                  tone="dark"
                  autoComplete="current-password"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Authenticating...
                  </>
                ) : (
                  <>
                    Enter Network <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 space-y-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[#0A0A0A] px-2 text-white/30">Or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => handleOAuth('google')} className="btn-secondary text-sm py-2.5">
                  Google
                </button>
                <button onClick={() => handleOAuth('github')} className="btn-secondary text-sm py-2.5">
                  GitHub
                </button>
              </div>
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-white/40">
            New to the network?{' '}
            <Link to="/register" className="font-medium text-white hover:text-blue-400 transition-colors">
              Apply for Access
            </Link>
          </p>
        </motion.div>
      </div>
    </FullScreenLayout>
  );
};
