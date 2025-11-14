import { useEffect, useState } from 'react';

const BREAKPOINTS = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
};

type BreakpointKey = keyof typeof BREAKPOINTS;

const getBreakpoint = (width: number): BreakpointKey => {
  if (width >= BREAKPOINTS.xl) return 'xl';
  if (width >= BREAKPOINTS.lg) return 'lg';
  if (width >= BREAKPOINTS.md) return 'md';
  if (width >= BREAKPOINTS.sm) return 'sm';
  return 'xs';
};

export const useBreakpoint = () => {
  const [width, setWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : BREAKPOINTS.xs,
  );

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const breakpoint = getBreakpoint(width);

  return {
    width,
    breakpoint,
    isMobile: width < BREAKPOINTS.md,
    isTablet: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
    isDesktop: width >= BREAKPOINTS.lg,
  };
};

