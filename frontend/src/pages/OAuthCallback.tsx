/**
 * OAuth Callback Handler
 * 
 * Handles the redirect from OAuth providers (Google, Facebook, GitHub)
 * after user authorization. Extracts the JWT token and stores it,
 * then redirects to appropriate page based on profile completion.
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';

interface UserProfile {
  _id: string;
  email: string;
  name: string;
  bio?: string;
  photos?: string[];
  skills?: string[];
  profileComplete?: boolean;
  provider?: string;
}

export const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    handleOAuthCallback();
  }, [searchParams]);

  const handleOAuthCallback = async () => {
    try {
      // Extract parameters from URL
      const token = searchParams.get('token');
      const provider = searchParams.get('provider');
      const error = searchParams.get('error');

      // Handle OAuth errors
      if (error) {
        const errorMessages: Record<string, string> = {
          oauth_denied: 'You denied authorization. Please try again to continue.',
          oauth_failed: 'OAuth login failed. Please try again or use email login.',
          config_error: 'OAuth is not configured properly. Please contact support.',
          no_email: 'We need your email to create an account. Please allow email permission.',
          server_error: 'Server error occurred. Please try again later.'
        };

        const message = errorMessages[error] || 'An unknown error occurred during login.';
        setErrorMessage(message);
        setStatus('error');
        toast.error(message);
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
        return;
      }

      // Validate token
      if (!token) {
        setErrorMessage('No authentication token received.');
        setStatus('error');
        toast.error('Authentication failed - no token received');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      // Store token
      localStorage.setItem('token', token);
      localStorage.setItem('authProvider', provider || 'oauth');

      // Fetch user profile to check completion status
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }

      const userData: UserProfile = await response.json();

      // Store user data
      localStorage.setItem('user', JSON.stringify(userData));

      setStatus('success');

      // Display success message with provider name
      const providerName = (provider || 'OAuth').charAt(0).toUpperCase() + (provider || 'OAuth').slice(1);
      toast.success(`Welcome back! Logged in with ${providerName}`);

      // Check if profile needs completion
      const needsProfileSetup = 
        !userData.bio || 
        userData.bio.length < 20 ||
        !userData.photos || 
        userData.photos.length === 0 ||
        !userData.skills || 
        userData.skills.length === 0 ||
        userData.profileComplete === false;

      if (needsProfileSetup) {
        // New user or incomplete profile - redirect to profile setup
        toast('Please complete your profile to start matching!', { 
          icon: '👋',
          duration: 4000 
        });
        setTimeout(() => {
          navigate('/setup-profile');
        }, 1500);
      } else {
        // Existing user with complete profile - redirect to home
        setTimeout(() => {
          navigate('/home');
        }, 1000);
      }

    } catch (err) {
      console.error('OAuth callback error:', err);
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Authentication failed');
      toast.error('Failed to complete login. Please try again.');
      
      // Clear potentially invalid token
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
        {status === 'loading' && (
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Completing Login...</h2>
            <p className="text-gray-600">Please wait while we set up your account</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Login Successful!</h2>
            <p className="text-gray-600">Redirecting you...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Login Failed</h2>
            <p className="text-gray-600 mb-4">{errorMessage}</p>
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OAuthCallback;
