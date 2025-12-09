import { type CSSProperties, useEffect, useMemo, useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { MapPin } from 'lucide-react';
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

  // const locationDisplay =
  //   typeof user.location === 'string'
  //     ? user.location
  //     : user.location?.city || 'Nearby';
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
      className={`absolute w-full max-w-[380px] h-[600px] cursor-grab active:cursor-grabbing touch-none ${isMobile ? 'pb-4' : ''}`}
      whileHover={isMobile ? undefined : { scale: 1.02 }}
      dragElastic={isMobile ? 0.1 : 0.15}
      dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
      dragMomentum={false}
    >
      <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[32px] bg-[#0b0b0f] shadow-2xl ring-1 ring-white/10">
        
        {/* Image Section (Top Half) */}
        <div className="relative h-[50%] overflow-hidden group">
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
            transition={{ duration: 0.5 }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-[#0b0b0f]" />

          {/* Top Badges */}
          <div className="absolute left-4 right-4 top-4 flex items-center justify-between">
             <div className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/80">{matchScore}% Match</span>
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
                  className={`h-1 rounded-full transition-all duration-300 ${index === activePhotoIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/30 hover:bg-white/50'}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Content Section (Bottom Half) */}
        <div className="relative flex flex-1 flex-col px-6 pb-6 pt-2 text-white">
          
          {/* Header */}
          <div className="mb-4">
            <div className="flex justify-between items-start mb-1">
                 <h2 className="text-2xl font-bold font-display tracking-tight text-white">
                  {user.name}
                  <span className="ml-2 text-lg text-white/40 font-light">{user.age}</span>
                </h2>
                 <div className="flex items-center gap-1 text-[10px] font-medium text-white/40 uppercase tracking-wider border border-white/10 px-2 py-1 rounded-md">
                    <MapPin className="h-3 w-3" /> {distanceDisplay}
                </div>
            </div>
            <p className="text-sm text-white/60 flex items-center gap-2">
                {user.role || 'Collaborator'} @ {user.company || 'Independent'}
            </p>
          </div>

          {/* Stats Row */}
          <div className="flex gap-2 mb-5 overflow-x-auto no-scrollbar">
             <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/5 flex-shrink-0">
                 <div className="text-[10px] text-white/40 uppercase tracking-wide mb-0.5">Response</div>
                 <div className="text-xs font-medium text-white/90">{responseRate}</div>
             </div>
             <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/5 flex-shrink-0">
                 <div className="text-[10px] text-white/40 uppercase tracking-wide mb-0.5">Trust</div>
                 <div className="text-xs font-medium text-white/90">{user.trustScore || 'New'}</div>
             </div>
             <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/5 flex-shrink-0">
                 <div className="text-[10px] text-white/40 uppercase tracking-wide mb-0.5">Availability</div>
                 <div className="text-xs font-medium text-green-400">{availability}</div>
             </div>
          </div>

          {/* Bio */}
          <div className="mb-5 flex-1">
             <p className={`text-sm text-white/70 leading-relaxed ${expandedBio ? '' : 'line-clamp-3'}`}>
                {user.bio}
             </p>
             {user.bio && user.bio.length > 120 && (
                <button onClick={(e) => { e.stopPropagation(); setExpandedBio(!expandedBio)}} className="text-xs text-blue-400 font-medium mt-1 hover:text-blue-300">
                    {expandedBio ? 'Show Less' : 'View More'}
                </button>
             )}
          </div>

          {/* Skills */}
          <div>
            <div className="flex flex-wrap gap-1.5">
              {primarySkills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 rounded-md border border-blue-500/20 bg-blue-500/10 px-2.5 py-1.5 text-[10px] font-semibold text-blue-200"
                >
                  {skill}
                </span>
              ))}
              {secondarySkills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-[10px] font-medium text-white/60"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Swipe Indicators */}
        <motion.div
          style={{ opacity: likeOpacity }}
          className="absolute right-8 top-12 -rotate-12 rounded-xl border-4 border-green-500/50 bg-green-500/20 px-4 py-2 text-2xl font-black tracking-widest text-green-400 backdrop-blur-md shadow-glow-green z-30"
        >
          LIKE
        </motion.div>
        <motion.div
          style={{ opacity: skipOpacity }}
          className="absolute left-8 top-12 rotate-12 rounded-xl border-4 border-red-500/50 bg-red-500/20 px-4 py-2 text-2xl font-black tracking-widest text-red-400 backdrop-blur-md shadow-glow-red z-30"
        >
          NOPE
        </motion.div>
        <motion.div
          style={{ opacity: superOpacity }}
          className="absolute left-1/2 top-20 -translate-x-1/2 -translate-y-1/2 rounded-xl border-4 border-blue-500/50 bg-blue-500/20 px-6 py-2 text-xl font-black tracking-widest text-blue-300 backdrop-blur-md shadow-glow-blue z-30"
        >
          SUPER
        </motion.div>
      </div>
    </motion.div>
  );
};