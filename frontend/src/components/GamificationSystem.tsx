import { motion, AnimatePresence } from 'framer-motion';
import { useState, type ReactNode } from 'react';
import { Trophy, Medal, Award, Star, TrendingUp, Crown, Zap } from 'lucide-react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  progress: number;
  total: number;
  unlocked: boolean;
}

const rarityColors: Record<Achievement['rarity'], string> = {
  common: 'from-gray-400 to-gray-600',
  rare: 'from-blue-400 to-blue-600',
  epic: 'from-purple-400 to-purple-600',
  legendary: 'from-yellow-400 to-orange-600',
};

const rarityGlows: Record<Achievement['rarity'], string> = {
  common: 'rgba(156, 163, 175, 0.4)',
  rare: 'rgba(96, 165, 250, 0.4)',
  epic: 'rgba(168, 85, 247, 0.4)',
  legendary: 'rgba(251, 191, 36, 0.4)',
};

export const GamificationSystem = () => {
  const [level] = useState(12);
  const [xp] = useState(2450);
  const [xpToNext] = useState(3000);
  const [streak] = useState(7);
  const [showLevelUp, setShowLevelUp] = useState(false);

  const achievements: Achievement[] = [
    {
      id: '1',
      title: 'First Match',
      description: 'Get your first collaboration match',
      icon: <Star className="text-yellow-300" size={28} />,
      rarity: 'common',
      progress: 1,
      total: 1,
      unlocked: true,
    },
    {
      id: '2',
      title: 'Social Butterfly',
      description: 'Send 100 messages',
      icon: <TrendingUp className="text-neon-cyan" size={28} />,
      rarity: 'rare',
      progress: 67,
      total: 100,
      unlocked: false,
    },
    {
      id: '3',
      title: 'Project Master',
      description: 'Complete 5 collaborative projects',
      icon: <Award className="text-neon-pink" size={28} />,
      rarity: 'epic',
      progress: 3,
      total: 5,
      unlocked: false,
    },
    {
      id: '4',
      title: 'Legend',
      description: 'Reach level 50',
      icon: <Trophy className="text-yellow-400" size={28} />,
      rarity: 'legendary',
      progress: 12,
      total: 50,
      unlocked: false,
    },
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-neon-purple to-neon-pink p-6 shadow-2xl"
      >
        <div className="relative z-10 space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                <Crown className="text-yellow-300" size={32} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">Level {level}</h3>
                <p className="text-sm text-white/80">Expert Collaborator</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-white/80">Current XP</p>
              <p className="text-xl font-bold text-white">{xp.toLocaleString()}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="text-sm text-white/80">
              {(xpToNext - xp).toLocaleString()} XP to reach the next level
            </div>
            <button
              onClick={() => setShowLevelUp(true)}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
            >
              <Medal size={16} />
              Celebrate progress
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm text-white/80">
              <span>Progress to Level {level + 1}</span>
              <span>{Math.round((xp / xpToNext) * 100)}%</span>
            </div>
            <div className="h-4 overflow-hidden rounded-full bg-white/20 backdrop-blur-sm">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(xp / xpToNext) * 100}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-yellow-300 to-yellow-500"
                style={{ boxShadow: '0 0 20px rgba(253, 224, 71, 0.6)' }}
              />
            </div>
          </div>
        </div>

        <div className="absolute inset-y-0 right-0 w-64 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 h-48 rounded-full bg-yellow-300/10 blur-3xl" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 p-4 shadow-lg"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="text-yellow-300" size={32} />
            <div>
              <h4 className="text-lg font-bold text-white">{streak} Day Streak</h4>
              <p className="text-sm text-white/80">Keep checking in to unlock streak boosts.</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-white">{streak} days</div>
        </div>
      </motion.div>

      <div>
        <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-white">
          <Trophy className="text-yellow-400" size={24} />
          Achievements
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {achievements.map((achievement, idx) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`relative overflow-hidden rounded-xl border p-4 ${
                achievement.unlocked
                  ? `bg-gradient-to-br ${rarityColors[achievement.rarity]} border-white/20`
                  : 'border-dark-border bg-dark-card opacity-70'
              }`}
              style={
                achievement.unlocked
                  ? { boxShadow: `0 10px 30px ${rarityGlows[achievement.rarity]}` }
                  : undefined
              }
            >
              <div className="flex items-start gap-3">
                <div className="text-4xl">{achievement.icon}</div>
                <div className="flex-1">
                  <h4 className="font-bold text-white">{achievement.title}</h4>
                  <p className="mt-1 text-sm text-white/80">{achievement.description}</p>

                  {!achievement.unlocked && (
                    <div className="mt-3">
                      <div className="mb-1 flex justify-between text-xs text-white/60">
                        <span>Progress</span>
                        <span>
                          {achievement.progress}/{achievement.total}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-white/20">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width: `${(achievement.progress / achievement.total) * 100}%`,
                          }}
                          className="h-full rounded-full bg-white/80"
                        />
                      </div>
                    </div>
                  )}

                  {achievement.unlocked && (
                    <div className="mt-2 flex items-center gap-1 text-sm text-white">
                      <Award size={16} />
                      <span>Unlocked</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="absolute right-2 top-2">
                <span className="rounded-full bg-black/30 px-2 py-1 text-xs font-bold uppercase text-white backdrop-blur-sm">
                  {achievement.rarity}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {showLevelUp && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setShowLevelUp(false)}
          >
            <motion.div
              initial={{ y: 40 }}
              animate={{ y: 0 }}
              className="rounded-3xl bg-gradient-to-br from-yellow-400 to-orange-500 p-12 text-center text-white shadow-2xl"
              style={{ boxShadow: '0 0 80px rgba(251, 191, 36, 0.8)' }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <Crown className="mx-auto mb-4 text-white" size={80} />
              </motion.div>
              <h2 className="mb-2 text-5xl font-bold">Level Up!</h2>
              <p className="mb-6 text-2xl">You reached Level {level + 1}</p>
              <div className="flex items-center justify-center gap-2 text-xl">
                <Star className="text-yellow-200" size={24} />
                <span>+500 XP Bonus</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
