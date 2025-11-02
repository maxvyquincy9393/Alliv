import { Variants } from 'framer-motion';

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.35, ease: 'easeOut' } },
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 320, damping: 24 },
  },
};

export const popModal: Variants = {
  hidden: { opacity: 0, scale: 0.9, filter: 'blur(6px)' },
  show: {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: { type: 'spring', stiffness: 360, damping: 28 },
  },
  exit: { opacity: 0, scale: 0.98 },
};

export const slideIn: Variants = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

export const stagger = (delay = 0.06) => ({
  show: { transition: { staggerChildren: delay } },
});

export const tiltParallax = {
  onMove: (e: React.MouseEvent) => {
    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(1000px) rotateX(${py * -4}deg) rotateY(${px * 6}deg) translateZ(0)`;
  },
  onLeave: (e: React.MouseEvent) => {
    (e.currentTarget as HTMLElement).style.transform = '';
  },
};

// Page transition variants
export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.3 },
  },
};
