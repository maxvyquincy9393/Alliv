import { type CSSProperties, useEffect, useMemo, useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { MapPin, Sparkles, Zap, Briefcase, Clock } from 'lucide-react';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { User } from '../types/user';

interface SwipeCardProps {
  user: User;
  onSwipe: (direction: 'left' | 'right' | 'up') => void;
  style?: CSSProperties;
  swipesRemaining: number;
  totalSwipes: number;
}

export const SwipeCard = ({ user, onSwipe, style }: SwipeCardProps) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const baseTilt = -2;
  const rotate = useTransform(x, [-200, 200], [-30 + baseTilt, 30 + baseTilt]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  const likeOpacity = useTransform(x, [0, 120], [0, 1], { clamp: true });
  const skipOpacity = useTransform(x, [-120, 0], [1, 0], { clamp: true });
  const superOpacity = useTransform(y, [-150, -80], [1, 0], { clamp: true });
  const { isMobile } = useBreakpoint();
  const horizontalThreshold = isMobile ? 80 : 100;
  const verticalThreshold = isMobile ? 80 : 100;
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [expandedBio, setExpandedBio] = useState(false);
  const photos = user.photos?.length ? user.photos : [user.avatar];

  useEffect(() => {
    setActivePhotoIndex(0);
    setExpandedBio(false);
  }, [user.id]);

  const handleDragEnd = (_event: unknown, info: { offset: { x: number; y: number } }) => {
    if (info.offset.x > horizontalThreshold) {
      onSwipe('right');
    } else if (info.offset.x < -horizontalThreshold) {
      onSwipe('left');
    } else if (info.offset.y < -verticalThreshold) {
      onSwipe('up');
    }
  };

  const locationDisplay =
    typeof user.location === 'string'
      ? user.location
      : user.location?.city || 'Nearby';
  const distanceDisplay = user.distance ? `${user.distance.toFixed(1)} mi` : 'Local';
  const matchScore = user.matchScore ?? 88;
  const responseRate = user.responseRate ?? 'Fast responder';
  const availability = user.availability ?? 'Open to work';
  const primarySkills = useMemo(() => user.skills.slice(0, 3), [user.skills]);
  const secondarySkills = useMemo(() => user.skills.slice(3, 6), [user.skills]);

  return (
    <motion.div
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={handleDragEnd}
      style={{ x, y, rotate, opacity, ...style }}
      className={`absolute w-full max-w-[380px] h-[68vh] min-h-[520px] max-h-[640px] cursor-grab active:cursor-grabbing touch-none ${isMobile ? 'pb-4' : ''}`}
      whileHover={isMobile ? undefined : { scale: 1.02 }}
      dragElastic={isMobile ? 0.1 : 0.15}
      dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
      dragMomentum={false}
    >
      <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[32px] border border-white/10 bg-[#0b0b0f]/95 shadow-2xl backdrop-blur-xl ring-1 ring-white/5">
        {/* Header Badge */}
        <div className="absolute -top-4 left-1/2 z-20 -translate-x-1/2">
          <div className="rounded-full border border-white/10 bg-black/80 px-5 py-1.5 text-[10px] font-bold uppercase tracking-[0.3em] text-white/60 shadow-lg backdrop-blur-md">
            DOSSIER
          </div>
        </div>

        {/* Image Section */}
        <div className="relative h-[55%] overflow-hidden group">
          <motion.img
            key={photos[activePhotoIndex]}
            src={photos[activePhotoIndex]}
            alt={user.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            draggable={false}
            initial={{ scale: 1.05 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8 }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0f] via-transparent to-transparent opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />

          {/* Top Badges */}
          <div className="absolute left-4 right-4 top-4 flex items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {user.badges?.slice(0, 2).map((badge) => (
                <span
                  key={badge}
                  className="rounded-full bg-black/40 border border-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white/90 backdrop-blur-md shadow-sm"
                >
                  {badge}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {user.trustScore !== undefined && (
                <span className="rounded-full bg-black/50 border border-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white/90 backdrop-blur-md shadow-sm flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse" />
                  Trust: {user.trustScore}
                </span>
              )}
              {user.quickResponder && (
                <span className="rounded-full bg-cosmic-500/20 border border-cosmic-500/30 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-cosmic-100 backdrop-blur-md shadow-glow-blue">
                  ⚡ Active
                </span>
              )}
            </div>
          </div>

          {/* Photo Navigation */}
          {photos.length > 1 && (
            <div className="absolute inset-x-0 bottom-4 flex items-center justify-center gap-1.5 z-20">
              {photos.map((_photo, index) => (
                <button
                  key={_photo}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setActivePhotoIndex(index); }}
                  className={`h-1 rounded-full transition-all duration-300 ${index === activePhotoIndex ? 'w-6 bg-white shadow-glow-white' : 'w-1.5 bg-white/30 hover:bg-white/50'
                    }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="relative flex flex-1 flex-col px-6 pb-6 pt-2 text-white -mt-12 z-10">
          {/* Name & Match Score */}
          <div className="flex items-end justify-between mb-4">
            <div>
              <h2 className="text-3xl font-bold font-display tracking-tight leading-none mb-1">
                {user.name}, <span className="text-white/40 font-light">{user.age}</span>
              </h2>
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-white/50">
                <MapPin className="h-3 w-3" /> {locationDisplay} • {distanceDisplay}
              </div>
            </div>
            <div className="flex flex-col items-end">
              <div className="relative flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-cosmic-500 to-cosmic-600 shadow-glow-blue">
                <span className="text-sm font-bold">{matchScore}%</span>
              </div>
              <span className="text-[9px] uppercase tracking-widest text-white/40 mt-1">Match</span>
            </div>
          </div>

          {/* Role & Company */}
          <div className="mb-5 p-3 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-1.5 rounded-lg bg-cosmic-500/10 text-cosmic-400">
                <Briefcase className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">{user.role || 'Collaborator'}</p>
                <p className="text-xs text-white/50">{user.company || 'Independent Creator'}</p>
              </div>
            </div>
            <div className="h-px w-full bg-white/5 my-2" />
            <div className="flex items-center justify-between text-xs text-white/60">
              <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {responseRate}</span>
              <span className="text-cosmic-300 font-medium">{availability}</span>
            </div>
          </div>

          {/* Bio */}
          <div className="mb-5">
            <p className={`text-sm text-white/70 leading-relaxed ${expandedBio ? '' : 'line-clamp-2'}`}>{user.bio}</p>
            {user.bio && user.bio.length > 100 && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setExpandedBio((prev) => !prev); }}
                className="mt-1 text-[10px] font-bold uppercase tracking-widest text-cosmic-400 hover:text-cosmic-300 transition-colors"
              >
                {expandedBio ? 'Show less' : 'Read more'}
              </button>
            )}
          </div>

          {/* Skills */}
          <div className="mt-auto space-y-3">
            <div>
              <p className="text-[9px] uppercase tracking-[0.2em] text-white/30 mb-2 font-bold">Tech Stack</p>
              <div className="flex flex-wrap gap-1.5">
                {primarySkills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-medium text-white/80"
                  >
                    <Zap className="h-2.5 w-2.5 text-cosmic-400" /> {skill}
                  </span>
                ))}
                {secondarySkills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-medium text-white/80"
                  >
                    <Sparkles className="h-2.5 w-2.5 text-cosmic-300" /> {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Swipe Indicators */}
        <motion.div
          style={{ opacity: likeOpacity }}
          className="absolute right-8 top-12 -rotate-12 rounded-xl border-4 border-green-500/50 bg-green-500/20 px-4 py-2 text-2xl font-black tracking-widest text-green-400 backdrop-blur-md shadow-glow-green"
        >
          LIKE
        </motion.div>
        <motion.div
          style={{ opacity: skipOpacity }}
          className="absolute left-8 top-12 rotate-12 rounded-xl border-4 border-red-500/50 bg-red-500/20 px-4 py-2 text-2xl font-black tracking-widest text-red-400 backdrop-blur-md shadow-glow-red"
        >
          NOPE
        </motion.div>
        <motion.div
          style={{ opacity: superOpacity }}
          className="absolute left-1/2 top-20 -translate-x-1/2 -translate-y-1/2 rounded-xl border-4 border-cosmic-400/50 bg-cosmic-500/20 px-6 py-2 text-xl font-black tracking-widest text-cosmic-300 backdrop-blur-md shadow-glow-blue"
        >
          SUPER
        </motion.div>
      </div>
    </motion.div>
  );
};
