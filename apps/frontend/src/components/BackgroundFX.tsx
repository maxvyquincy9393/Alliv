import { useCallback } from 'react';
import { initParticlesEngine, Particles } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import { useEffect, useState } from 'react';
import type { Engine } from '@tsparticles/engine';

export const BackgroundFX = () => {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine: Engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const particlesLoaded = useCallback(async () => {
    // Particles loaded callback
  }, []);

  if (!init) {
    return null;
  }

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-[radial-gradient(1200px_800px_at_50%_-200px,#0f1322_0%,#0b0b0b_60%)] animate-bgShift" />
      
      {/* Particle field */}
      <Particles
        id="tsparticles"
        particlesLoaded={particlesLoaded}
        options={{
          fullScreen: false,
          style: { position: 'absolute' },
          particles: {
            number: {
              value: 18,
              density: {
                enable: true,
                width: 1920,
                height: 1080,
              },
            },
            color: {
              value: '#6E9EFF',
            },
            shape: {
              type: 'circle',
            },
            opacity: {
              value: 0.25,
            },
            size: {
              value: 1.5,
            },
            move: {
              enable: true,
              speed: 0.3,
              direction: 'none',
              random: true,
              straight: false,
              outModes: {
                default: 'out',
              },
            },
          },
          background: {
            color: 'transparent',
          },
          detectRetina: true,
        }}
      />
    </div>
  );
};
