import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useRegistrationStore } from '../../store/registration';
import { GlassButton } from '../../components/GlassButton';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';

export const StepSummary = () => {
  const navigate = useNavigate();
  const { data, reset } = useRegistrationStore();
  const [creating, setCreating] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordInput, setShowPasswordInput] = useState(false);

  const handleCreate = async () => {
    // Validate email first
    if (!data.email || !data.email.trim()) {
      toast.error('Please provide your email in the Account step');
      navigate('/register/account');
      return;
    }

    // If password not set yet, show password input
    if (!showPasswordInput) {
      setShowPasswordInput(true);
      return;
    }

    // Validate password
    if (!password || password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    // Check password requirements
    if (!/[A-Z]/.test(password)) {
      toast.error('Password must contain at least one uppercase letter');
      return;
    }

    if (!/[a-z]/.test(password)) {
      toast.error('Password must contain at least one lowercase letter');
      return;
    }

    if (!/[0-9]/.test(password)) {
      toast.error('Password must contain at least one number');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setCreating(true);
    
    try {
      console.log('🚀 Starting registration with:', { name: data.name, email: data.email });
      
      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout - please try again')), 30000)
      );
      
      // Register with API (with 30s timeout)
      const response = await Promise.race([
        api.register({
          name: data.name!,
          email: data.email,
          password: password,
        }),
        timeoutPromise
      ]) as any;

      console.log('✅ Registration response:', response);
      console.log('Response type:', typeof response);
      console.log('requiresEmailVerification:', response?.requiresEmailVerification);

      toast.success('Registration successful! Please check your email to verify your account.');

      // Navigate to verify email page or home
      if (response && response.requiresEmailVerification) {
        console.log('📧 Email verification required, navigating to verify-email page');
        
        // Reset registration state BEFORE navigate
        reset();
        
        // Navigate immediately
        navigate('/verify-email', { 
          state: { 
            email: data.email,
            verificationToken: response.verificationToken 
          },
          replace: true // Replace current history entry
        });
      } else {
        console.log('✅ No verification needed, going to home');
        
        // Reset registration state BEFORE navigate
        reset();
        
        navigate('/home', { replace: true });
      }
    } catch (error: any) {
      console.error('❌ Registration failed:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        fullError: error
      });
      
      // Extract detailed error message
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      // Handle validation errors from backend
      if (error.message && error.message.includes('uppercase')) {
        errorMessage = 'Password must contain at least one uppercase letter';
      } else if (error.message && error.message.includes('lowercase')) {
        errorMessage = 'Password must contain at least one lowercase letter';
      } else if (error.message && error.message.includes('number') || error.message && error.message.includes('digit')) {
        errorMessage = 'Password must contain at least one number';
      } else if (error.message && error.message.includes('already registered')) {
        errorMessage = 'This email is already registered. Try logging in instead.';
      }
      
      toast.error(errorMessage, { duration: 5000 });
    } finally {
      console.log('🏁 Registration process completed, setting creating to false');
      setCreating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-3">Looking Good!</h1>
        <p className="text-white/50">Review your profile before continuing</p>
      </div>

      <div className="glass-card rounded-2xl p-8 mb-8">
        {/* Photo and basic info */}
        <div className="flex flex-col items-center mb-8">
          {data.photos && data.photos.length > 0 && (
            <img
              src={data.photos[0]}
              alt={data.name || 'Profile'}
              className="w-32 h-32 rounded-full object-cover ring-2 ring-accent-blue/50 shadow-glow mb-4"
            />
          )}
          <h2 className="text-2xl font-bold text-white">{data.name}</h2>
          <p className="text-white/50">{data.city}</p>
          {data.bio && <p className="text-sm text-white/60 mt-2 text-center max-w-md">{data.bio}</p>}
        </div>

        {/* Field */}
        {data.field && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-2">
              Field
            </h3>
            <div className="px-4 py-2 glass rounded-lg text-sm text-white/90 inline-block">
              {data.field}
            </div>
          </div>
        )}

        {/* Skills */}
        {data.skills && data.skills.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-3">
              Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {data.skills.map((skill, index) => (
                <div
                  key={index}
                  className="px-4 py-2 glass rounded-lg text-sm text-white/90"
                >
                  {skill}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Interests */}
        {data.interests && data.interests.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-3">
              Interests
            </h3>
            <div className="flex flex-wrap gap-2">
              {data.interests.map((interest, index) => (
                <div
                  key={index}
                  className="px-4 py-2 glass rounded-lg text-sm text-white/90"
                >
                  {interest}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Password Input - Shows after clicking Create Profile */}
      {showPasswordInput && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-8 mb-8 space-y-4"
        >
          {/* Password Requirements Info */}
          <div className="bg-accent-blue/10 border border-accent-blue/30 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-white mb-2">Password Requirements:</h4>
            <ul className="text-xs text-white/70 space-y-1">
              <li>• At least 8 characters</li>
              <li>• At least one uppercase letter (A-Z)</li>
              <li>• At least one lowercase letter (a-z)</li>
              <li>• At least one number (0-9)</li>
            </ul>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Create Password *
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 glass rounded-xl text-white placeholder-white/30 focus:ring-2 focus:ring-accent-blue/50 transition-all"
              placeholder="e.g., SecurePass123"
              minLength={8}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Confirm Password *
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 glass rounded-xl text-white placeholder-white/30 focus:ring-2 focus:ring-accent-blue/50 transition-all"
              placeholder="Re-enter your password"
              minLength={8}
            />
          </div>
        </motion.div>
      )}

      <div className="space-y-3">
        <GlassButton
          variant="primary"
          fullWidth
          onClick={handleCreate}
          loading={creating}
        >
          {showPasswordInput ? 'Complete Registration' : 'Create Profile'}
        </GlassButton>

        <GlassButton
          variant="ghost"
          fullWidth
          onClick={() => navigate('/register/location')}
          disabled={creating}
        >
          Back
        </GlassButton>
      </div>

      {/* Progress indicator */}
      <div className="mt-12 flex justify-center gap-2">
        {[0, 1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={`h-1 rounded-full transition-all ${
              step === 4 ? 'w-8 bg-accent-blue' : 'w-1 bg-accent-blue/50'
            }`}
          />
        ))}
      </div>
    </motion.div>
  );
};
