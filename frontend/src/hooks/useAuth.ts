import { useState, useEffect, useCallback } from 'react';
import { AuthUser } from '../types/user';
import { api } from '../lib/api';
import { socketService } from '../lib/socket';

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token
    const token = api.getToken();
    if (token) {
      // In a real app, validate token with backend
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const userData = await api.login(email, password);
      setUser(userData);
      
      // Connect socket
      socketService.connect(userData.id);
      
      return userData;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(
    async (data: { name: string; email: string; password: string }) => {
      setLoading(true);
      try {
        const userData = await api.register(data);
        setUser(userData);
        
        // Connect socket
        socketService.connect(userData.id);
        
        return userData;
      } catch (error) {
        console.error('Registration failed:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const logout = useCallback(async () => {
    await api.logout();
    socketService.disconnect();
    setUser(null);
  }, []);

  return {
    user,
    loading,
    isAuthenticated: !!user || !!api.getToken(),
    login,
    register,
    logout,
  };
};
