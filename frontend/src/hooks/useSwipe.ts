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
  const [swipeHistory, setSwipeHistory] = useState<{ userId: string; direction: SwipeDirection }[]>([]);

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
        setSwipeHistory((prev) => [{ userId, direction }, ...prev].slice(0, 3));
      } catch (error) {
        console.error('Swipe failed:', error);
      }
    },
    []
  );

  const undoLastSwipe = useCallback(() => {
    let canUndo = false;
    setSwipeHistory((prev) => {
      if (!prev.length) {
        return prev;
      }
      canUndo = true;
      return prev.slice(1);
    });
    if (canUndo) {
      setCurrentIndex((prev) => Math.max(prev - 1, 0));
    }
  }, []);

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
    swipeHistory,
    loadUsers,
    handleSwipe,
    undoLastSwipe,
    closeMatchModal,
  };
};
