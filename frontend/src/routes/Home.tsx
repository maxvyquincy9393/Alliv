import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { SwipeCard } from '../components/SwipeCard';
import { FloatingButtons } from '../components/FloatingButtons';
import { MatchModal } from '../components/MatchModal';
import { useSwipe } from '../hooks/useSwipe';
import { useAuth } from '../hooks/useAuth';

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
  } = useSwipe();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadUsers();
  }, [isAuthenticated, navigate, loadUsers]);

  const currentUser = users[currentIndex];
  const noMoreUsers = currentIndex >= users.length;

  const handleSwipeAction = (direction: 'left' | 'right' | 'up') => {
    if (currentUser) {
      handleSwipe(direction, currentUser.id);
    }
  };

  const handleSendMessage = () => {
    closeMatchModal();
    navigate('/chat');
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[70vh]">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border-4 border-accent-blue border-t-transparent rounded-full"
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-md mx-auto pt-8">
        {noMoreUsers ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20 glass-card rounded-2xl p-8"
          >
            <h2 className="text-2xl font-bold text-white mb-2">
              You've seen everyone
            </h2>
            <p className="text-white/40 mb-6">
              Check back later for more matches
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={loadUsers}
              className="px-8 py-3 glass hover:glow-blue text-white font-medium rounded-xl transition-all"
            >
              Reload
            </motion.button>
          </motion.div>
        ) : (
          <>
            {/* Card Stack */}
            <div className="relative h-[600px] mb-8">
              <AnimatePresence>
                {users
                  .slice(currentIndex, currentIndex + 3)
                  .reverse()
                  .map((user, index) => (
                    <SwipeCard
                      key={user.id}
                      user={user}
                      onSwipe={handleSwipeAction}
                      style={{
                        zIndex: 3 - index,
                        scale: 1 - index * 0.05,
                        transform: `translateY(${index * 10}px)`,
                      }}
                    />
                  ))}
              </AnimatePresence>
            </div>

            {/* Action Buttons */}
            <FloatingButtons
              onSkip={() => handleSwipeAction('left')}
              onLike={() => handleSwipeAction('right')}
              onSuperLike={() => handleSwipeAction('up')}
              disabled={!currentUser}
            />
          </>
        )}

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
      </div>
    </Layout>
  );
};
