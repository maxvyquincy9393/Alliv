import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  angle: number;
  distance: number;
}

export const SingularityCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationIdRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Setup canvas size
    const resizeCanvas = () => {
      const scale = window.devicePixelRatio > 1 ? 0.5 : 1; // Scale down for performance
      canvas.width = window.innerWidth * scale;
      canvas.height = window.innerHeight * scale;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.scale(scale, scale);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize particles
    const particleCount = 45; // Light particle count
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const distance = 100 + Math.random() * 200;
      
      particlesRef.current.push({
        x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance,
        vx: 0,
        vy: 0,
        size: 1 + Math.random() * 1.5,
        alpha: 0.05 + Math.random() * 0.07,
        angle: angle,
        distance: distance
      });
    }

    // Animation loop with 30 FPS cap
    let lastTime = 0;
    const fps = 30;
    const frameInterval = 1000 / fps;

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;

      if (deltaTime > frameInterval) {
        // Clear canvas with fade effect
        ctx.fillStyle = 'rgba(11, 11, 11, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw singularity center glow
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 150);
        gradient.addColorStop(0, 'rgba(189, 180, 255, 0.03)');
        gradient.addColorStop(0.5, 'rgba(110, 230, 255, 0.02)');
        gradient.addColorStop(1, 'rgba(189, 180, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Update and draw particles
        timeRef.current += 0.003; // Very slow rotation

        particlesRef.current.forEach(particle => {
          // Slow orbital motion
          particle.angle += 0.002;
          particle.x = centerX + Math.cos(particle.angle) * particle.distance;
          particle.y = centerY + Math.sin(particle.angle) * particle.distance;
          
          // Subtle drift
          particle.distance += Math.sin(timeRef.current + particle.angle) * 0.1;

          // Draw particle
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(189, 180, 255, ${particle.alpha})`;
          ctx.fill();
        });

        lastTime = currentTime - (deltaTime % frameInterval);
      }

      animationIdRef.current = requestAnimationFrame(animate);
    };

    // Handle tab visibility
    const handleVisibilityChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(animationIdRef.current);
      } else {
        animationIdRef.current = requestAnimationFrame(animate);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    animationIdRef.current = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationIdRef.current);
      window.removeEventListener('resize', resizeCanvas);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ 
        opacity: 0.8,
        mixBlendMode: 'screen'
      }}
      aria-hidden="true"
    />
  );
};
