import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Star, Undo2, X, Sparkles, Zap } from 'lucide-react';
import { FullScreenLayout } from '../components/FullScreenLayout';
import { SwipeCard } from '../components/SwipeCard';
import { MatchModal } from '../components/MatchModal';
import { useSwipe } from '../hooks/useSwipe';
import { useAuth } from '../hooks/useAuth';
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
      {/* Top Bar Controls */}
      <div className="absolute top-0 left-0 right-0 z-20 p-6 flex justify-between items-start pointer-events-none">
         <div className="pointer-events-auto flex gap-3">
             {/* Potential Left Side Controls (Filters etc) */}
         </div>
         
         <div className="pointer-events-auto">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => currentUser && setInsightsOpen(true)}
              disabled={!currentUser}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 border border-white/10 backdrop-blur-md text-sm font-medium text-white/80 hover:bg-white/10 hover:border-white/20 transition-colors disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>AI Insights</span>
            </motion.button>
         </div>
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center w-full h-full overflow-hidden">
        
        {/* Ambient Background Glow */}
        <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[100px]" />
        </div>

        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative z-10 flex flex-col items-center gap-6"
          >
            <div className="w-16 h-16 rounded-full border-2 border-white/10 border-t-blue-500 animate-spin" />
            <p className="text-sm text-white/40 tracking-widest uppercase">Locating Talent...</p>
          </motion.div>
        ) : noMoreUsers ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-10 flex flex-col items-center text-center max-w-md px-6"
          >
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
               <Sparkles className="w-8 h-8 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">You're all caught up</h2>
            <p className="text-white/50 mb-8 leading-relaxed">
               You've seen all the profiles in your area for now. <br/> Check back later for new matches.
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={loadUsers}
              className="px-8 py-3 rounded-full bg-white text-black font-medium text-sm hover:bg-blue-50 transition-colors"
            >
              Refresh Feed
            </motion.button>
          </motion.div>
        ) : (
          <div className="relative w-full max-w-[400px] flex flex-col items-center z-10">
            
            {/* Stats Pills (Floating above card) */}
            <div className="flex gap-3 mb-4 opacity-80 hover:opacity-100 transition-opacity">
                 <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 border border-white/10 backdrop-blur-sm text-[10px] font-medium text-white/60">
                    <Zap className="w-3 h-3 text-blue-400" />
                    <span>{swipesRemaining} left</span>
                 </div>
                 <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 border border-white/10 backdrop-blur-sm text-[10px] font-medium text-white/60">
                    <Star className="w-3 h-3 text-yellow-400" />
                    <span>{superLikesRemaining} super</span>
                 </div>
            </div>

            {/* Card Stack */}
            <div className="relative w-full h-[600px]">
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
                        top: index * 10, // Tighter stacking
                      }}
                    />
                  ))}
              </AnimatePresence>

              {/* Feedback Overlay */}
              <AnimatePresence>
                {feedback && (
                  <motion.div
                    key={feedback.id}
                    initial={{ opacity: 0, scale: 0.5, y: 0 }}
                    animate={{ opacity: 1, scale: 1, y: -50 }}
                    exit={{ opacity: 0, scale: 1.2 }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50"
                  >
                     <div className={`px-6 py-2 rounded-xl border-2 text-xl font-black tracking-widest uppercase backdrop-blur-md shadow-2xl
                        ${feedback.type === 'pass' ? 'border-red-500/50 bg-red-500/20 text-red-400' : 
                          feedback.type === 'like' ? 'border-green-500/50 bg-green-500/20 text-green-400' : 
                          'border-blue-400/50 bg-blue-500/20 text-blue-400'}`} // Blue for Super Like now
                     >
                        {feedback.type === 'pass' ? 'NOPE' : feedback.type === 'like' ? 'LIKE' : 'SUPER'}
                     </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Minimal Action Buttons */}
            <div className="mt-8 flex items-center gap-6">
              <ActionButton
                icon={Undo2}
                onClick={handleUndo}
                disabled={swipeHistory.length === 0}
                variant="secondary"
                size="small"
              />
              <ActionButton
                icon={X}
                onClick={() => handleSwipeAction('left')}
                variant="danger"
                size="large"
              />
              <ActionButton
                icon={Star}
                onClick={() => handleSwipeAction('up')}
                disabled={superLikesRemaining === 0}
                variant="super"
                size="medium"
              />
              <ActionButton
                icon={Heart}
                onClick={() => handleSwipeAction('right')}
                variant="primary"
                size="large"
              />
               <ActionButton
                icon={MessageCircle}
                onClick={() => navigate('/chat')}
                variant="secondary"
                size="small"
              />
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
  variant: 'primary' | 'secondary' | 'danger' | 'super';
}

const ActionButton = ({
  icon: Icon,
  onClick,
  disabled = false,
  size = 'medium',
  variant
}: ActionButtonProps) => {
  const sizeClasses = {
    small: 'w-10 h-10',
    medium: 'w-12 h-12',
    large: 'w-14 h-14',
  };

  const iconSizes = {
    small: 18,
    medium: 20,
    large: 24,
  };
  
  const variants = {
      primary: "bg-white/10 hover:bg-green-500/20 text-white hover:text-green-400 border-white/10 hover:border-green-500/30", // Like
      danger: "bg-white/10 hover:bg-red-500/20 text-white hover:text-red-400 border-white/10 hover:border-red-500/30", // Nope
      super: "bg-white/10 hover:bg-blue-500/20 text-white hover:text-blue-400 border-white/10 hover:border-blue-500/30", // Super (Blue)
      secondary: "bg-transparent hover:bg-white/5 text-white/40 hover:text-white border-transparent hover:border-white/10", // Undo/Chat
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.1 }}
      whileTap={{ scale: disabled ? 1 : 0.9 }}
      onClick={onClick}
      disabled={disabled}
      className={`${sizeClasses[size]} ${variants[variant]} flex items-center justify-center rounded-full border backdrop-blur-sm transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed`}
    >
      <Icon size={iconSizes[size]} strokeWidth={2.5} />
    </motion.button>
  );
};
