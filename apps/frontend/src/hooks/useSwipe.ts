import { useState, useCallback } from 'react';
import { User } from '../types/user';
import { SwipeDirection } from '../types/match';
import { api } from '../lib/api';

export const useSwipe = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [matchedUser, setMatchedUser] = useState<User | null>(null);
  const [showMatchModal, setShowMatchModal] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getDiscoverUsers();
      setUsers(data);
      setCurrentIndex(0);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSwipe = useCallback(
    async (direction: SwipeDirection, userId: string) => {
      try {
        const result = await api.swipeUser(userId, direction);
        
        if (result.match && result.user) {
          setMatchedUser(result.user);
          setShowMatchModal(true);
        }
        
        setCurrentIndex((prev) => prev + 1);
      } catch (error) {
        console.error('Swipe failed:', error);
      }
    },
    []
  );

  const closeMatchModal = useCallback(() => {
    setShowMatchModal(false);
    setMatchedUser(null);
  }, []);

  return {
    users,
    currentIndex,
    loading,
    matchedUser,
    showMatchModal,
    loadUsers,
    handleSwipe,
    closeMatchModal,
  };
};
