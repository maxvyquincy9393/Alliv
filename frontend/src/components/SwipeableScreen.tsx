import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useFullScreenSwipe } from '../hooks/useFullScreenSwipe';

interface SwipeableScreenProps {
  children: ReactNode;
  leftRoute?: string;
  rightRoute?: string;
  leftLabel?: string;
  rightLabel?: string;
  threshold?: number;
  enabled?: boolean;
  className?: string;
}

export const SwipeableScreen = ({
  children,
  leftRoute,
  rightRoute,
  leftLabel = 'Back',
  rightLabel = 'Next',
  threshold = 100,
  enabled = true,
  className = '',
}: SwipeableScreenProps) => {
  const { containerRef, swipeProgress, isSwipingHorizontal } = useFullScreenSwipe({
    left: leftRoute,
    right: rightRoute,
    threshold,
    enabled,
  });

  // Calculate opacity and position for hints
  const leftHintOpacity = Math.max(0, -swipeProgress * 2);
  const rightHintOpacity = Math.max(0, swipeProgress * 2);
  const translateX = swipeProgress * 30; // Subtle parallax effect

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
      {/* Content with parallax effect */}
      <motion.div
        style={{
          x: isSwipingHorizontal ? translateX : 0,
        }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      >
        {children}
      </motion.div>

      {/* Left swipe hint */}
      <AnimatePresence>
        {leftRoute && isSwipingHorizontal && leftHintOpacity > 0.1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: leftHintOpacity }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed left-0 top-0 z-50 flex h-full w-32 items-center justify-start bg-gradient-to-r from-white/10 to-transparent backdrop-blur-sm"
          >
            <div className="ml-6 flex flex-col items-center gap-2 text-white">
              <ChevronLeft className="h-8 w-8" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                {leftLabel}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right swipe hint */}
      <AnimatePresence>
        {rightRoute && isSwipingHorizontal && rightHintOpacity > 0.1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: rightHintOpacity }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed right-0 top-0 z-50 flex h-full w-32 items-center justify-end bg-gradient-to-l from-white/10 to-transparent backdrop-blur-sm"
          >
            <div className="mr-6 flex flex-col items-center gap-2 text-white">
              <ChevronRight className="h-8 w-8" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                {rightLabel}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
