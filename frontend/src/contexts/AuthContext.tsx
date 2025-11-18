import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AuthUser } from '../types/user';
import api from '../services/api';
import { socketService } from '../lib/socket';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthUser & { profileComplete?: boolean }>;
  register: (data: { name: string; email: string; password: string; birthdate?: string }) => Promise<any>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      const token = localStorage.getItem('access_token');
      const storedUserStr = localStorage.getItem('user');
      const storedUser = storedUserStr ? JSON.parse(storedUserStr) : null;

      if (storedUser) {
        setUser(storedUser);
        socketService.connect(storedUser.id);
      }

      if (!token) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        // Verify token and get fresh user data
        const response = await api.profile.getMe();
        if (!isMounted) return;

        if (response.data) {
          const freshUser = response.data;
          setUser(freshUser);
          localStorage.setItem('user', JSON.stringify(freshUser));
          socketService.connect(freshUser.id);
        } else if (response.error) {
          // Token invalid or expired
          console.error('Session restore failed:', response.error);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          setUser(null);
        }
      } catch (error) {
        console.error('Session restore error:', error);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await api.auth.login({ email, password });

      if (response.error) {
        throw new Error(response.error);
      }

      // The backend returns { accessToken, refreshToken, user }
      // api.ts types might be incomplete, but we can access data
      const data = response.data as any;

      if (data?.accessToken) {
        localStorage.setItem('access_token', data.accessToken);
      }
      if (data?.refreshToken) {
        localStorage.setItem('refresh_token', data.refreshToken);
      }

      const userData = data?.user;
      if (userData) {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        socketService.connect(userData.id);
        return userData;
      } else {
        // Fallback: fetch user if not in login response
        const userResp = await api.profile.getMe();
        if (userResp.data) {
          setUser(userResp.data);
          localStorage.setItem('user', JSON.stringify(userResp.data));
          socketService.connect(userResp.data.id);
          return userResp.data;
        }
      }

      throw new Error('Login succeeded but failed to retrieve user data');
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (data: { name: string; email: string; password: string; birthdate?: string }) => {
    setLoading(true);
    try {
      const response = await api.auth.register({
        ...data,
        birthdate: data.birthdate || '2000-01-01' // Fallback for now
      });

      if (response.error) {
        throw new Error(response.error);
      }

      // If registration returns token/user (auto-login), handle it
      const responseData = response.data as any;
      if (responseData?.accessToken && responseData?.user) {
        localStorage.setItem('access_token', responseData.accessToken);
        if (responseData.refreshToken) {
          localStorage.setItem('refresh_token', responseData.refreshToken);
        }
        setUser(responseData.user);
        localStorage.setItem('user', JSON.stringify(responseData.user));
        socketService.connect(responseData.user.id);
        return responseData.user;
      }

      return response.data;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } catch (e) {
      console.error('Logout API call failed', e);
    }

    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    socketService.disconnect();
    setUser(null);
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
