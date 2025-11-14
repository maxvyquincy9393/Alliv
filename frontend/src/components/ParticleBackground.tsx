import { useCallback } from 'react';
import Particles from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import type { Engine } from '@tsparticles/engine';

export const ParticleBackground = () => {
  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine);
  }, []);

  const particleOptions: Record<string, unknown> = {
        background: {
          color: {
            value: 'transparent',
          },
        },
        fpsLimit: 120,
        interactivity: {
          events: {
            onClick: {
              enable: true,
              mode: 'push',
            },
            onHover: {
              enable: true,
              mode: 'grab',
            },
            resize: {
              enable: true,
            },
          },
          modes: {
            push: {
              quantity: 4,
            },
            grab: {
              distance: 140,
              links: {
                opacity: 0.5,
              },
            },
          },
        },
        particles: {
          color: {
            value: ['#35F5FF', '#FFEC3D', '#8C6FF7'],
          },
          links: {
            color: '#35F5FF',
            distance: 150,
            enable: true,
            opacity: 0.2,
            width: 1,
          },
          move: {
            direction: 'none',
            enable: true,
            outModes: {
              default: 'bounce',
            },
            random: false,
            speed: 1,
            straight: false,
          },
          number: {
            density: {
              enable: true,
              area: 800,
            },
            value: 80,
          },
          opacity: {
            value: 0.3,
            animation: {
              enable: true,
              speed: 1,
            },
          },
          shape: {
            type: ['circle', 'triangle'],
          },
          size: {
            value: { min: 1, max: 3 },
          },
        },
        detectRetina: true,
      };

  return (
    <Particles
      id="tsparticles"
      // @ts-expect-error `init` prop exists at runtime but is missing from the type definition
      init={particlesInit}
      options={particleOptions}
      className="absolute inset-0 pointer-events-none"
    />
  );
};
