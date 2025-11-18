import { useState, useCallback } from 'react';
import { User } from '../types/user';
import { SwipeDirection } from '../types/match';
import api from '../services/api';

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
      // Use discoverOnline for now, or discoverNearby if location is available
      const response = await api.discovery.discoverOnline();
      if (response.data && Array.isArray(response.data.users)) {
        setUsers(response.data.users);
      } else if (Array.isArray(response.data)) {
        // Fallback for legacy response format
        setUsers(response.data);
      } else {
        console.warn('Unexpected response format:', response.data);
        setUsers([]);
      }
      setCurrentIndex(0);
    } catch (error) {
      console.error('Failed to load users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSwipe = useCallback(
    async (direction: SwipeDirection, userId: string) => {
      try {
        let action: 'skip' | 'save' | 'connect' = 'skip';
        if (direction === 'right') action = 'connect';
        if (direction === 'up') action = 'save'; // Super like maps to save/connect? Or maybe 'connect' with a flag?
        // For now, map right to connect, left to skip. Up (super like) -> connect?
        // api.match.swipe expects 'skip' | 'save' | 'connect'.
        // Let's map: left -> skip, right -> connect, up -> connect (for now)

        const response = await api.match.swipe(userId, action);
        const result = response.data;

        if (result && result.match && result.user) {
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
