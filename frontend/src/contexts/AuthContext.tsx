import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI, profileAPI } from '../services/api';

interface User {
  id: string;
  email: string;
  name: string;
  verified: boolean;
  profile?: any;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string, birthdate: string) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await profileAPI.getMe();
      if (response.data) {
        setUser(response.data);
      } else {
        // Token might be expired
        const refreshResponse = await authAPI.refreshToken();
        if (refreshResponse.data) {
          // Retry getting profile
          const retryResponse = await profileAPI.getMe();
          if (retryResponse.data) {
            setUser(retryResponse.data);
          }
        } else {
          // Refresh failed, clear tokens
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await authAPI.login({ email, password });
      if (response.data) {
        await refreshUser();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const register = async (
    email: string,
    password: string,
    name: string,
    birthdate: string
  ): Promise<boolean> => {
    try {
      const response = await authAPI.register({
        email,
        password,
        name,
        birthdate,
      });
      if (response.data) {
        // Auto login after registration
        return await login(email, password);
      }
      return false;
    } catch (error) {
      console.error('Registration failed:', error);
      return false;
    }
  };

  const logout = () => {
    authAPI.logout();
    setUser(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  };

  const refreshUser = async () => {
    try {
      const response = await profileAPI.getMe();
      if (response.data) {
        setUser(response.data);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    refreshUser,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
