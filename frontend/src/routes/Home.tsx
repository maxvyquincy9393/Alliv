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

  return (
    <Layout>
      <div className="shell-content space-y-8 pb-16">
        <section className="panel p-6 sm:p-8 space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">Discover</p>
              <h1 className="text-3xl font-semibold text-white">Keep swiping with intention.</h1>
              <p className="text-white/60 text-sm mt-2">
                We refresh your queue frequently so every profile feels current and purposeful.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm text-white/70">
              <div className="rounded-2xl border border-white/10 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.3em] text-white/40">In queue</p>
                <p className="text-2xl font-semibold text-white">
                  {Math.max(users.length - currentIndex, 0)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.3em] text-white/40">Matches</p>
                <p className="text-2xl font-semibold text-white">{showMatchModal ? 1 : 0}</p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {['Nearby mode', 'Map view', 'Project briefs', 'Events'].map((cta) => (
              <button
                key={cta}
                onClick={() => {
                  if (cta === 'Nearby mode') navigate('/discover?mode=map');
                  if (cta === 'Project briefs') navigate('/projects');
                  if (cta === 'Events') navigate('/events');
                  if (cta === 'Map view') navigate('/discover?mode=map');
                }}
                className="px-4 py-2 rounded-full border border-white/15 text-xs text-white/70 hover:text-white"
              >
                {cta}
              </button>
            ))}
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)]">
          <div className="panel p-4 relative min-h-[560px] overflow-hidden">
            {loading ? (
              <div className="flex h-[520px] items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                  className="w-16 h-16 border-4 border-white/10 border-t-white rounded-full"
                />
              </div>
            ) : noMoreUsers ? (
              <div className="h-[520px] flex flex-col items-center justify-center text-center px-6">
                <h2 className="text-2xl font-semibold text-white mb-2">You caught up 🎉</h2>
                <p className="text-white/60 mb-6">
                  We’ll notify you when new collaborators enter your radius. Refresh to double check.
                </p>
                <button
                  onClick={loadUsers}
                  className="px-6 py-3 rounded-full bg-white text-black font-semibold hover:-translate-y-0.5 transition-transform"
                >
                  Reload queue
                </button>
              </div>
            ) : (
              <>
                <div className="relative h-[520px]">
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
                <div className="mt-6">
                  <FloatingButtons
                    onSkip={() => handleSwipeAction('left')}
                    onLike={() => handleSwipeAction('right')}
                    onSuperLike={() => handleSwipeAction('up')}
                    disabled={!currentUser}
                  />
                </div>
              </>
            )}
          </div>

          <aside className="panel p-6 space-y-6">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/40 mb-2">Tips</p>
              <ul className="space-y-3 text-sm text-white/70">
                <li>- Super-like to jump to the top of someone’s queue.</li>
                <li>- Save promising profiles by swiping up.</li>
                <li>- Refresh when your vibe or availability changes.</li>
              </ul>
            </div>
            <div className="border-t border-white/10 pt-6">
              <p className="text-xs uppercase tracking-[0.3em] text-white/40 mb-2">Quick filters</p>
              <div className="flex flex-wrap gap-3">
                {['Design', 'Engineering', 'Strategy', 'Nearby', 'Online now'].map((filter) => (
                  <button
                    key={filter}
                    className="px-4 py-2 rounded-full border border-white/10 text-white/70 text-sm hover:border-white/40"
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
            <div className="border-t border-white/10 pt-6 space-y-2 text-sm text-white/70">
              <p className="text-white font-semibold">Need a change of scenery?</p>
              <p>Switch to Discover to browse on the map or jump straight into projects.</p>
              <button
                onClick={() => navigate('/discover')}
                className="text-white font-medium underline underline-offset-4"
              >
                Open Discover
              </button>
            </div>
          </aside>
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
