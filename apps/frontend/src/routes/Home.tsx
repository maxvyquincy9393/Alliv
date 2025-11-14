import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Heart, Star, X } from 'lucide-react';
import { Layout } from '../components/Layout';
import { SwipeCard } from '../components/SwipeCard';
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

  return (
    <Layout>
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),transparent_55%)]" />
        <div className="shell-content relative z-10 flex min-h-[calc(100vh-80px)] flex-col items-center justify-center pb-8">
          <div className="w-full max-w-xl space-y-5">
            {loading ? (
              <div className="flex h-[500px] items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                  className="h-14 w-14 rounded-full border-4 border-white/10 border-t-white"
                />
              </div>
            ) : noMoreUsers ? (
              <div className="flex h-[500px] flex-col items-center justify-center gap-4 text-center">
                <h2 className="text-2xl font-semibold text-white">Queue is clear</h2>
                <p className="text-sm text-white/65">
                  We will ping you once new collaborators enter your radius. Tap reload to check again.
                </p>
                <button
                  onClick={loadUsers}
                  className="rounded-full bg-white px-6 py-3 font-semibold text-black transition-transform hover:-translate-y-0.5"
                >
                  Reload queue
                </button>
              </div>
            ) : (
              <>
                <div className="relative h-[500px]">
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
                            scale: 1 - index * 0.04,
                            transform: `translateY(${index * 12}px)`,
                          }}
                        />
                      ))}
                  </AnimatePresence>
                </div>
                {currentUser && (
                  <div className="flex flex-col items-center gap-3">
                    <div className="text-center text-sm text-white/70">
                      <p className="text-lg font-semibold text-white">{currentUser.name}</p>
                      <p>
                        {currentUser.skills?.slice(0, 2).join(', ') ||
                          currentUser.bio?.slice(0, 64) ||
                          'No bio yet'}
                      </p>
                    </div>
                    <div className="flex gap-4">
                      <button
                        onClick={() => handleSwipeAction('left')}
                        className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white/80 transition hover:text-white"
                      >
                        <X className="h-6 w-6" />
                      </button>
                      <button
                        onClick={() => handleSwipeAction('up')}
                        className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white/80 transition hover:text-white"
                      >
                        <Star className="h-6 w-6" />
                      </button>
                      <button
                        onClick={() => handleSwipeAction('right')}
                        className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-black transition hover:-translate-y-0.5"
                      >
                        <Heart className="h-6 w-6" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showMatchModal && matchedUser && (
          <MatchModal
            user={matchedUser}
            onClose={closeMatchModal}
            onSendMessage={handleSendMessage}
          />
        )}
      </AnimatePresence>
    </Layout>
  );
};
