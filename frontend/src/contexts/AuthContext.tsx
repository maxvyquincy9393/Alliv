import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AuthUser } from '../types/user';
import { api } from '../lib/api';
import { socketService } from '../lib/socket';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthUser & { profileComplete?: boolean }>;
  register: (data: { name: string; email: string; password: string }) => Promise<any>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      const token = api.getToken();
      const storedUser = api.getStoredUser();

      if (storedUser) {
        setUser(storedUser);
        socketService.connect(storedUser.id);
      }

      if (!token) {
        if (isMounted) {
          setLoading(false);
        }
        return;
      }

      try {
        const freshUser = await api.fetchCurrentUser();
        if (!isMounted) return;

        if (freshUser) {
          setUser(freshUser);
          socketService.connect(freshUser.id);
        } else if (!storedUser) {
          setUser(null);
        }
      } catch (error) {
        console.error('Session restore failed:', error);
        api.clearSession();
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
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
      const userData = await api.login(email, password);
      setUser(userData);
      socketService.connect(userData.id);
      return userData;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (data: { name: string; email: string; password: string }) => {
    setLoading(true);
    try {
      const userData = await api.register(data);
      if (userData && 'id' in userData) {
        setUser(userData);
        socketService.connect(userData.id);
      }
      return userData;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    socketService.disconnect();
    setUser(null);
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user || !!api.getToken(),
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
