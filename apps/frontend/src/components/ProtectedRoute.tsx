import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireProfile?: boolean;  // Some routes need completed profile
  requireVerified?: boolean; // Some routes need email verification
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireProfile = false,
  requireVerified = false 
}) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    // Save the attempted location for redirect after login
    const from = location.pathname + location.search;
    return <Navigate to={`/login?redirect=${encodeURIComponent(from)}`} state={{ from: location }} replace />;
  }

  // Require email verification for certain routes
  if (requireVerified && user && !user.emailVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  // Require completed profile for certain routes
  if (requireProfile && user && !user.profileComplete) {
    return <Navigate to="/setup-profile" replace />;
  }

  // All checks passed - render protected content
  return <>{children}</>;
};

// Export a higher-order component for class components
export function withProtectedRoute<P extends object>(
  Component: React.ComponentType<P>,
  requireProfile = false,
  requireVerified = false
) {
  return (props: P) => (
    <ProtectedRoute requireProfile={requireProfile} requireVerified={requireVerified}>
      <Component {...props} />
    </ProtectedRoute>
  );
}
