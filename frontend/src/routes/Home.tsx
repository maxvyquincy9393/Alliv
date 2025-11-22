import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Star, Undo2, X, Sparkles } from 'lucide-react';
import { FullScreenLayout } from '../components/FullScreenLayout';
import { SwipeCard } from '../components/SwipeCard';
import { MatchModal } from '../components/MatchModal';
import { useSwipe } from '../hooks/useSwipe';
import { useAuth } from '../hooks/useAuth';
import { theme } from '../styles/theme';
import { AIInsightsPanel } from '../components/AIInsightsPanel';

export const Home = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const {
    users,
    currentIndex,
    loading,
    matchedUser,
    showMatchModal,
    loadUsers,
    handleSwipe,
    closeMatchModal,
    swipeHistory,
    undoLastSwipe,
  } = useSwipe();

  const [feedback, setFeedback] = useState<{ type: 'pass' | 'like' | 'super'; id: number } | null>(null);
  const [superLikesUsed, setSuperLikesUsed] = useState(0);
  const [insightsOpen, setInsightsOpen] = useState(false);

  const totalDailySwipes = 50;
  const superLikeLimit = 3;

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadUsers();
  }, [isAuthenticated, navigate, loadUsers]);

  const currentUser = users[currentIndex];
  const noMoreUsers = currentIndex >= users.length;
  const swipesRemaining = Math.max(totalDailySwipes - currentIndex, 0);
  const superLikesRemaining = Math.max(superLikeLimit - superLikesUsed, 0);

  const handleSwipeAction = (direction: 'left' | 'right' | 'up') => {
    if (!currentUser) return;
    if (direction === 'up') {
      setSuperLikesUsed((prev) => Math.min(superLikeLimit, prev + 1));
    }
    setFeedback({
      type: direction === 'left' ? 'pass' : direction === 'right' ? 'like' : 'super',
      id: Date.now(),
    });
    handleSwipe(direction, currentUser.id);
    setTimeout(() => setFeedback(null), 1100);
  };

  const handleUndo = () => {
    if (!swipeHistory.length) return;
    undoLastSwipe();
  };

  const handleSendMessage = () => {
    closeMatchModal();
    navigate('/chat');
  };

  const handleInsightsAction = (action: string) => {
    if (action === 'send_message') {
      navigate('/chat');
      setInsightsOpen(false);
      return;
    }

    if (action === 'invite_project') {
      navigate('/projects');
      setInsightsOpen(false);
    }
  };

  return (
    <FullScreenLayout>
      <div className="absolute right-6 top-6 z-20 flex gap-3">
        <motion.button
          type="button"
          whileHover={{ scale: currentUser ? 1.03 : 1 }}
          whileTap={{ scale: currentUser ? 0.97 : 1 }}
          onClick={() => currentUser && setInsightsOpen(true)}
          disabled={!currentUser}
          className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur hover:bg-white/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          AI Insights
        </motion.button>
      </div>

      <div className="relative flex flex-1 items-center justify-center px-4 py-8">
        {loading ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-6"
          >
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                className="h-16 w-16 rounded-full border-4 border-t-transparent border-b-transparent border-l-blue-500 border-r-purple-500"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white/70" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-white">Finding matches</p>
              <p className="text-sm text-white/60">Preparing your personalized feed...</p>
            </div>
          </motion.div>
        ) : noMoreUsers ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex max-w-md flex-col items-center gap-6 text-center"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#FFEC3D] to-[#FFD700] rounded-full blur-2xl opacity-30" />
              <div className="relative rounded-full bg-gradient-to-br from-white/10 to-white/5 p-8 backdrop-blur-xl border border-white/10">
                <Star className="h-16 w-16" style={{ color: theme.colors.primary.yellow }} />
              </div>
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-bold text-white">All caught up!</h2>
              <p className="text-white/60 max-w-sm">
                You've seen all available profiles. Check back later or adjust your preferences.
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={loadUsers}
              className="btn-primary px-8 py-4 rounded-full"
            >
              Refresh Feed
            </motion.button>
          </motion.div>
        ) : (
          <div className="relative w-full max-w-[420px]">
            {/* Card Stack */}
            <div className="relative min-h-[580px]">
              <AnimatePresence initial={false}>
                {users
                  .slice(currentIndex, currentIndex + 3)
                  .reverse()
                  .map((userCard, index) => (
                    <SwipeCard
                      key={userCard.id}
                      user={userCard}
                      onSwipe={handleSwipeAction}
                      swipesRemaining={swipesRemaining}
                      totalSwipes={totalDailySwipes}
                      style={{
                        zIndex: 3 - index,
                        scale: 1 - index * 0.04,
                        top: index * 18,
                      }}
                    />
                  ))}
              </AnimatePresence>

              {/* Feedback Toast */}
              <AnimatePresence>
                {feedback && (
                  <motion.div
                    key={feedback.id}
                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.8 }}
                    className="pointer-events-none absolute left-1/2 top-8 -translate-x-1/2 z-50"
                  >
                    <div
                      className="px-8 py-3 rounded-full text-lg font-bold shadow-2xl"
                      style={{
                        background: feedback.type === 'pass'
                          ? `linear-gradient(135deg, #EF4444 0%, #DC2626 100%)`
                          : feedback.type === 'like'
                            ? theme.gradients.button
                            : `linear-gradient(135deg, ${theme.colors.primary.yellow} 0%, #FFD700 100%)`,
                        color: feedback.type === 'super' ? '#000' : '#fff',
                        boxShadow: `0 20px 40px ${feedback.type === 'pass' ? '#EF444440' : feedback.type === 'like' ? theme.colors.primary.purple + '40' : theme.colors.primary.yellow + '40'}`
                      }}
                    >
                      {feedback.type === 'pass' ? 'NOPE' : feedback.type === 'like' ? 'LIKE' : 'SUPER LIKE!'}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom Action Buttons */}
            <div className="mt-6 flex justify-center gap-3">
              <ActionButton
                icon={Undo2}
                onClick={handleUndo}
                disabled={swipeHistory.length === 0}
                size="small"
                gradient="linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)"
                shadowColor="rgba(255,255,255,0.1)"
              />
              <ActionButton
                icon={X}
                onClick={() => handleSwipeAction('left')}
                size="large"
                gradient={theme.gradients.danger}
                shadowColor="#EF444440"
              />
              <ActionButton
                icon={Star}
                onClick={() => handleSwipeAction('up')}
                disabled={superLikesRemaining === 0}
                size="medium"
                gradient={`linear-gradient(135deg, ${theme.colors.primary.yellow} 0%, #FFD700 100%)`}
                shadowColor={theme.colors.primary.yellow + '40'}
                textColor="#000"
              />
              <ActionButton
                icon={Heart}
                onClick={() => handleSwipeAction('right')}
                size="large"
                gradient={theme.gradients.button}
                shadowColor={theme.colors.primary.purple + '40'}
              />
              <ActionButton
                icon={MessageCircle}
                onClick={() => navigate('/chat')}
                size="small"
                gradient="linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)"
                shadowColor="rgba(255,255,255,0.1)"
              />
            </div>

            {/* Stats Bar */}
            <div className="mt-6 flex justify-center gap-4">
              <div className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 backdrop-blur-xl border border-white/10">
                <Heart size={14} className="text-white/60" />
                <span className="text-xs text-white/80 font-medium">{swipesRemaining} left</span>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 backdrop-blur-xl border border-white/10">
                <Star size={14} style={{ color: theme.colors.primary.yellow }} />
                <span className="text-xs text-white/80 font-medium">{superLikesRemaining} super</span>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <motion.button
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleSwipeAction('right')}
                className="btn-primary px-8 py-3 rounded-full"
              >
                Send a quick hello
              </motion.button>
            </div>
          </div>
        )}
      </div>

      {/* Match Modal */}
      <AnimatePresence>
        {showMatchModal && matchedUser && (
          <MatchModal
            user={matchedUser}
            onClose={closeMatchModal}
            onSendMessage={handleSendMessage}
          />
        )}
      </AnimatePresence>

      {currentUser?.id && (
        <AIInsightsPanel
          userId={String(currentUser.id)}
          isVisible={insightsOpen}
          onClose={() => setInsightsOpen(false)}
          onAction={handleInsightsAction}
        />
      )}
    </FullScreenLayout>
  );
};

interface ActionButtonProps {
  icon: typeof X;
  onClick: () => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  gradient: string;
  shadowColor: string;
  textColor?: string;
}

const ActionButton = ({
  icon: Icon,
  onClick,
  disabled = false,
  size = 'medium',
  gradient,
  shadowColor,
  textColor = '#fff'
}: ActionButtonProps) => {
  const sizeClasses = {
    small: 'h-12 w-12',
    medium: 'h-14 w-14',
    large: 'h-16 w-16',
  };

  const iconSizes = {
    small: 16,
    medium: 20,
    large: 22,
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.1 }}
      whileTap={{ scale: disabled ? 1 : 0.9 }}
      onClick={onClick}
      disabled={disabled}
      className={`${sizeClasses[size]} flex items-center justify-center rounded-full backdrop-blur-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed border border-white/10`}
      style={{
        background: gradient,
        boxShadow: `0 15px 35px ${shadowColor}`,
        color: textColor
      }}
    >
      <Icon size={iconSizes[size]} />
    </motion.button>
  );
};
