import { useEffect, useState } from 'react';

const DEFAULT_BREAKPOINT = 768;

export const useIsMobile = (breakpoint: number = DEFAULT_BREAKPOINT) => {
  const getInitialValue = () =>
    typeof window === 'undefined' ? false : window.innerWidth < breakpoint;

  const [isMobile, setIsMobile] = useState<boolean>(getInitialValue);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  return isMobile;
};

