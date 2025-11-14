import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface SwipeConfig {
  left?: string;  // Route to navigate when swiping left
  right?: string; // Route to navigate when swiping right
  threshold?: number; // Minimum distance to trigger navigation
  enabled?: boolean; // Enable/disable swipe
}

export const useFullScreenSwipe = (config: SwipeConfig) => {
  const navigate = useNavigate();
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const [swipeProgress, setSwipeProgress] = useState(0); // -1 to 1 for visual feedback
  const [isSwipingHorizontal, setIsSwipingHorizontal] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    left,
    right,
    threshold = 100, // pixels
    enabled = true,
  } = config;

  useEffect(() => {
    if (!enabled) return;

    const container = containerRef.current;
    if (!container) return;

    let currentX = 0;
    let currentY = 0;
    let initialX = 0;
    let initialY = 0;
    let isDragging = false;
    let isHorizontalSwipe = false;

    const handleTouchStart = (e: TouchEvent) => {
      // Don't interfere with card swipes or other interactive elements
      const target = e.target as HTMLElement;
      if (
        target.closest('[data-swipeable-card]') ||
        target.closest('input') ||
        target.closest('textarea') ||
        target.closest('button') ||
        target.closest('a') ||
        target.closest('[data-prevent-swipe]')
      ) {
        return;
      }

      initialX = e.touches[0].clientX;
      initialY = e.touches[0].clientY;
      touchStartX.current = initialX;
      touchStartY.current = initialY;
      isDragging = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;

      currentX = e.touches[0].clientX;
      currentY = e.touches[0].clientY;

      const deltaX = currentX - initialX;
      const deltaY = currentY - initialY;

      // Determine if this is a horizontal swipe (only once at the start)
      if (!isHorizontalSwipe && !isSwipingHorizontal) {
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);
        
        if (absX > 10 || absY > 10) {
          isHorizontalSwipe = absX > absY;
          setIsSwipingHorizontal(isHorizontalSwipe);
        }
      }

      // Only track horizontal movement if it's a horizontal swipe
      if (isHorizontalSwipe) {
        // Prevent default to stop scrolling while swiping
        if (Math.abs(deltaX) > 10) {
          e.preventDefault();
        }

        // Calculate progress (-1 to 1, where threshold = 1)
        const progress = Math.max(-1, Math.min(1, deltaX / (threshold * 2)));
        setSwipeProgress(progress);
      }
    };

    const handleTouchEnd = () => {
      if (!isDragging || !isHorizontalSwipe) {
        isDragging = false;
        isHorizontalSwipe = false;
        setIsSwipingHorizontal(false);
        setSwipeProgress(0);
        return;
      }

      const deltaX = currentX - touchStartX.current;
      const absX = Math.abs(deltaX);

      // Check if swipe meets threshold
      if (absX >= threshold) {
        if (deltaX > 0 && right) {
          // Swipe right
          navigate(right);
        } else if (deltaX < 0 && left) {
          // Swipe left
          navigate(left);
        }
      }

      // Reset
      isDragging = false;
      isHorizontalSwipe = false;
      setIsSwipingHorizontal(false);
      setSwipeProgress(0);
    };

    // Add event listeners with passive: false to allow preventDefault
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [enabled, left, right, threshold, navigate]);

  return {
    containerRef,
    swipeProgress,
    isSwipingHorizontal,
  };
};
