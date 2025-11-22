import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { PasswordInput } from '../components/PasswordInput';
import { Mail, User, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { FullScreenLayout } from '../components/FullScreenLayout';

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
    <FullScreenLayout showNavbar={false} showMobileChrome={false}>
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
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
                Create Account
              </h1>
              <p className="text-white/50 text-lg">
                Start building your dream team today.
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
                <label className="text-sm font-medium text-white/80 ml-1">Full Name</label>
                <div className="relative group">
                  <User className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within:text-white transition-colors" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-modern pl-11"
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-white/80 ml-1">Email</label>
                <div className="relative group">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within:text-white transition-colors" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-modern pl-11"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-white/80 ml-1">Password</label>
                <PasswordInput
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 chars, uppercase, lowercase, digit"
                  className="input-modern"
                  tone="dark"
                  autoComplete="new-password"
                  required
                />
                <p className="text-[10px] text-white/30 mt-1 ml-1">
                  Must include uppercase, lowercase, and number.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Creating...
                  </>
                ) : (
                  <>
                    Create Account <ArrowRight className="w-5 h-5" />
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
                <SocialButton label="Google" onClick={() => handleOAuth('google')} />
                <SocialButton label="GitHub" onClick={() => handleOAuth('github')} />
              </div>
            </div>

            <p className="mt-8 text-center text-sm text-white/40">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-white hover:text-blue-400 transition-colors">
                Sign In
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </FullScreenLayout>
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
    className="btn-secondary w-full text-sm py-2.5"
  >
    {label}
  </button>
);
