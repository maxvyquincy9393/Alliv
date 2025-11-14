import { useEffect, useState } from 'react';

export const BlackholeCSS = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {/* Background darkness */}
      <div className="absolute inset-0 bg-black" />
      
      {/* Black hole container - off-center */}
      <div 
        className="absolute"
        style={{
          left: '35%',
          top: '65%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        {/* Accretion disk */}
        <div 
          className={`absolute ${!prefersReducedMotion ? 'animate-spin-slow' : ''}`}
          style={{
            width: '500px',
            height: '150px',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%) rotateX(75deg)',
            background: `
              radial-gradient(
                ellipse at center,
                transparent 30%,
                rgba(75, 0, 130, 0.05) 40%,
                rgba(147, 51, 234, 0.06) 60%,
                rgba(236, 72, 153, 0.04) 80%,
                transparent 100%
              )
            `,
            filter: 'blur(2px)',
          }}
        />

        {/* Cyan relativistic jet */}
        <div 
          className="absolute"
          style={{
            width: '600px',
            height: '200px',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%) rotateX(75deg) rotate(45deg)',
            background: `
              linear-gradient(
                90deg,
                transparent 0%,
                transparent 70%,
                rgba(0, 255, 255, 0.03) 85%,
                rgba(0, 255, 255, 0.05) 90%,
                rgba(0, 200, 255, 0.02) 100%
              )
            `,
            filter: 'blur(3px)',
          }}
        />

        {/* Event horizon (strong black center) */}
        <div 
          className="absolute"
          style={{
            width: '160px',
            height: '160px',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle, black 60%, rgba(0,0,0,0.95) 80%, transparent 100%)',
            boxShadow: 'inset 0 0 50px rgba(0,0,0,1)',
          }}
        />

        {/* Gravitational lensing effect */}
        <div 
          className="absolute"
          style={{
            width: '320px',
            height: '320px',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle, transparent 25%, rgba(0,0,0,0.1) 50%, transparent 100%)',
            filter: 'blur(10px)',
          }}
        />
      </div>

      {/* Stars */}
      <div className="absolute" style={{ left: '45%', top: '35%' }}>
        <div className="w-1 h-1 bg-white rounded-full opacity-70" />
        <div className="absolute w-2 h-2 bg-white/20 rounded-full -top-0.5 -left-0.5 blur-sm" />
      </div>
      <div className="absolute" style={{ left: '20%', top: '45%' }}>
        <div className="w-0.5 h-0.5 bg-white rounded-full opacity-50" />
      </div>
      <div className="absolute" style={{ left: '40%', top: '75%' }}>
        <div className="w-1.5 h-1.5 bg-white rounded-full opacity-90" />
        <div className="absolute w-3 h-3 bg-white/30 rounded-full -top-0.5 -left-0.5 blur-sm" />
      </div>
      <div className="absolute" style={{ left: '15%', top: '70%' }}>
        <div className="w-1 h-1 bg-white rounded-full opacity-60" />
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spin-slow {
            from {
              transform: translate(-50%, -50%) rotateX(75deg) rotate(0deg);
            }
            to {
              transform: translate(-50%, -50%) rotateX(75deg) rotate(360deg);
            }
          }
          
          .animate-spin-slow {
            animation: spin-slow 120s linear infinite;
          }
        `
      }} />
    </div>
  );
};
