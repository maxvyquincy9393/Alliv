import { type CSSProperties, useEffect, useMemo, useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { MapPin, Sparkles, Zap } from 'lucide-react';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { User } from '../types/user';

interface SwipeCardProps {
  user: User;
  onSwipe: (direction: 'left' | 'right' | 'up') => void;
  style?: CSSProperties;
  swipesRemaining: number;
  totalSwipes: number;
}

export const SwipeCard = ({ user, onSwipe, style, swipesRemaining, totalSwipes }: SwipeCardProps) => {
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
  const swipesUsed = Math.min(totalSwipes, totalSwipes - swipesRemaining);
  const progressPct = Math.round((swipesUsed / totalSwipes) * 100);

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
      : user.location?.city || 'Somewhere nearby';
  const distanceDisplay = user.distance ? `${user.distance.toFixed(1)} mi away` : 'within reach';
  const matchScore = user.matchScore ?? 88;
  const responseRate = user.responseRate ?? 'Responds within a day';
  const availability = user.availability ?? 'Availability on request';
  const projectsCompleted = user.projectsCompleted ?? 10;
  const primarySkills = useMemo(() => user.skills.slice(0, 3), [user.skills]);
  const secondarySkills = useMemo(() => user.skills.slice(3, 6), [user.skills]);
  const extraSkills = user.skills.length - (primarySkills.length + secondarySkills.length);

  return (
    <motion.div
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={handleDragEnd}
      style={{ x, y, rotate, opacity, ...style }}
      className={`absolute w-full max-w-[380px] h-[520px] cursor-grab active:cursor-grabbing touch-none ${isMobile ? 'pb-4' : ''}`}
      whileHover={isMobile ? undefined : { scale: 1.02 }}
      dragElastic={isMobile ? 0.2 : 0.15}
      dragMomentum={false}
    >
      <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[32px] border border-white/10 bg-[#0b0b0f]/90 shadow-2xl backdrop-blur-xl">
        <div className="absolute -top-4 left-1/2 z-20 -translate-x-1/2">
          <div className="rounded-full border border-white/10 bg-black/70 px-5 py-1 text-[10px] font-semibold uppercase tracking-[0.45em] text-white/60">
            COLLAB DOSSIER
          </div>
        </div>

        <div className="relative h-[58%] overflow-hidden">
          <motion.img
            key={photos[activePhotoIndex]}
            src={photos[activePhotoIndex]}
            alt={user.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
            draggable={false}
            initial={{ scale: 1.05 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8 }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent" />

          <div className="absolute left-4 right-4 top-4 flex items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {user.badges?.slice(0, 2).map((badge) => (
                <span
                  key={badge}
                  className="rounded-full bg-black/60 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/80 backdrop-blur"
                >
                  {badge}
                </span>
              ))}
            </div>
            {user.quickResponder && (
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80 shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
                ⚡ Quick responder
              </span>
            )}
          </div>

          <div className="absolute bottom-4 left-0 right-0 flex items-center justify-between px-6 text-white">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-white/60">Now Matching</p>
              <p className="text-lg font-semibold">{locationDisplay}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/60 px-4 py-2 text-right shadow-[inset_0_1px_2px_rgba(255,255,255,0.05),0_6px_18px_rgba(0,0,0,0.35)]">
              <p className="text-xs text-white/50">Daily swipes</p>
              <p className="text-sm font-semibold text-white">{swipesRemaining} left</p>
            </div>
          </div>

          {photos.length > 1 && (
            <div className="absolute inset-x-0 bottom-2 flex items-center justify-center gap-2">
              {photos.map((_photo, index) => (
                <button
                  key={_photo}
                  type="button"
                  onClick={() => setActivePhotoIndex(index)}
                  className={`h-2.5 rounded-full transition-all ${index === activePhotoIndex ? 'w-6 bg-white' : 'w-2 bg-white/40'
                    }`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="relative flex flex-1 flex-col gap-4 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-white/50">
                <MapPin className="h-3.5 w-3.5" /> {distanceDisplay}
              </p>
              <h2 className="text-3xl font-semibold">
                {user.name}, {user.age}
              </h2>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2 text-center shadow-[inset_0_1px_2px_rgba(255,255,255,0.05),0_6px_18px_rgba(0,0,0,0.35)]">
              <p className="text-xs text-white/55">Match score</p>
              <p className="text-lg font-semibold text-white">{matchScore}%</p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xl font-semibold text-white">{user.role || 'Collaborator'}</p>
              <p className="text-sm text-white/55">{user.company || 'Independent'}</p>
            </div>
            <div className="flex flex-col items-end">
              <p className="text-xs text-white/60">Progress</p>
              <div className="flex items-center gap-3">
                <div className="relative h-1.5 w-24 rounded-full bg-white/10">
                  <span
                    className="absolute inset-y-0 left-0 rounded-full bg-white"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <span className="text-sm font-semibold">{swipesUsed}/{totalSwipes}</span>
              </div>
            </div>
          </div>

          <div>
            <p className={`text-sm text-white/70 ${expandedBio ? '' : 'line-clamp-2'}`}>{user.bio}</p>
            {user.bio && user.bio.length > 160 && (
              <button
                type="button"
                onClick={() => setExpandedBio((prev) => !prev)}
                className="mt-1 text-xs font-semibold text-white/60 underline decoration-dotted"
              >
                {expandedBio ? 'Show less' : '...read more'}
              </button>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-white/45">Tech Skills</p>
              <div className="flex gap-2 overflow-x-auto pr-4">
                {primarySkills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80 shadow-[0_2px_8px_rgba(0,0,0,0.25)]"
                  >
                    <Zap className="h-3 w-3" /> {skill}
                  </span>
                ))}
              </div>
            </div>
            {secondarySkills.length > 0 && (
              <div>
                <p className="text-[11px] uppercase tracking-[0.35em] text-white/45">Soft Skills</p>
                <div className="flex gap-2 overflow-x-auto pr-4">
                  {secondarySkills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80 shadow-[0_2px_8px_rgba(0,0,0,0.25)]"
                    >
                      <Sparkles className="h-3 w-3" /> {skill}
                    </span>
                  ))}
                  {extraSkills > 0 && (
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80 shadow-[0_2px_8px_rgba(0,0,0,0.25)]">
                      +{extraSkills} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm text-white/75">
            <InfoTile label="Response rate" value={responseRate} />
            <InfoTile label="Availability" value={availability} highlight={availability.includes('🟢')} />
            <InfoTile label="Projects completed" value={`✅ ${projectsCompleted}`} />
            <InfoTile label="Compatibility" value={`${matchScore}% aligned`} />
          </div>
        </div>

        <motion.div
          style={{ opacity: likeOpacity }}
          className="absolute right-6 top-10 rounded-2xl border border-white/10 bg-white px-4 py-2 text-[11px] font-semibold tracking-[0.4em] text-black"
        >
          LIKED
        </motion.div>
        <motion.div
          style={{ opacity: skipOpacity }}
          className="absolute left-6 top-10 rounded-2xl border border-white/10 bg-black/60 px-4 py-2 text-[11px] font-semibold tracking-[0.4em] text-white/70"
        >
          PASS
        </motion.div>
        <motion.div
          style={{ opacity: superOpacity }}
          className="absolute left-1/2 top-16 -translate-x-1/2 rounded-2xl border border-white bg-white px-6 py-2 text-[11px] font-semibold tracking-[0.4em] text-black"
        >
          SUPER LIKE
        </motion.div>
      </div>
    </motion.div>
  );
};

interface InfoTileProps {
  label: string;
  value: string;
  highlight?: boolean;
}

const InfoTile = ({ label, value, highlight = false }: InfoTileProps) => (
  <div
    className={`rounded-2xl border border-white/10 px-3 py-2 shadow-[inset_0_1px_2px_rgba(255,255,255,0.05),0_4px_12px_rgba(0,0,0,0.25)] ${highlight ? 'bg-white/10' : 'bg-white/5'
      }`}
  >
    <p className="text-[11px] uppercase tracking-[0.35em] text-white/45">{label}</p>
    <p className="text-sm font-semibold text-white">{value}</p>
  </div>
);
