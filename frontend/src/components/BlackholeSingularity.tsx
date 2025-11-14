import { useEffect, useRef } from 'react';
import { useIsMobile } from '../hooks/useIsMobile';

export const BlackholeSingularity = () => {
  const isMobile = useIsMobile();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationIdRef = useRef<number>(0);
  const rotationRef = useRef(0);

  useEffect(() => {
    if (isMobile) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Setup canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Black hole parameters - off-center (left-bottom quadrant)
    const centerX = window.innerWidth * 0.35; // Off-center to left
    const centerY = window.innerHeight * 0.65; // Off-center to bottom
    const eventHorizonRadius = 80;
    const accretionDiskRadius = 250;

    // Star positions (3-5 tiny specs)
    const stars = [
      { x: centerX + 180, y: centerY - 120, size: 1, brightness: 0.7 },
      { x: centerX - 150, y: centerY - 80, size: 0.5, brightness: 0.5 },
      { x: centerX + 100, y: centerY + 150, size: 1.5, brightness: 0.9 },
      { x: centerX - 200, y: centerY + 100, size: 0.8, brightness: 0.6 },
    ];

    const animate = () => {
      // Clear canvas with black
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Save context for rotation
      ctx.save();
      ctx.translate(centerX, centerY);
      
      if (!prefersReducedMotion) {
        // Very slow rotation (0.3-0.6°/s → ~0.005-0.01 radians per frame at 60fps)
        rotationRef.current += 0.008;
        ctx.rotate(rotationRef.current);
      }

      // Draw accretion disk (thin ellipse with gradient)
      ctx.save();
      ctx.scale(1, 0.3); // Flatten to create disk effect
      
      // Multiple layers for depth
      for (let i = 3; i > 0; i--) {
        const radius = accretionDiskRadius * (1 + i * 0.1);
        const gradient = ctx.createRadialGradient(0, 0, eventHorizonRadius, 0, 0, radius);
        
        // Inner glow indigo→magenta at 4-7% opacity
        gradient.addColorStop(0, 'rgba(0, 0, 0, 1)'); // Black at center
        gradient.addColorStop(0.3, 'rgba(75, 0, 130, 0.05)'); // Indigo 5%
        gradient.addColorStop(0.6, 'rgba(147, 51, 234, 0.06)'); // Purple 6%
        gradient.addColorStop(0.8, 'rgba(236, 72, 153, 0.04)'); // Magenta 4%
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)'); // Fade to transparent
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Cyan relativistic jet/highlight on one side
      const jetGradient = ctx.createLinearGradient(-accretionDiskRadius, 0, accretionDiskRadius * 0.5, 0);
      jetGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      jetGradient.addColorStop(0.7, 'rgba(0, 0, 0, 0)');
      jetGradient.addColorStop(0.85, 'rgba(0, 255, 255, 0.03)'); // Cyan at 3%
      jetGradient.addColorStop(0.95, 'rgba(0, 255, 255, 0.05)'); // Cyan at 5%
      jetGradient.addColorStop(1, 'rgba(0, 200, 255, 0.02)');
      
      ctx.fillStyle = jetGradient;
      ctx.beginPath();
      ctx.arc(0, 0, accretionDiskRadius * 1.1, -Math.PI * 0.3, Math.PI * 0.3);
      ctx.fill();
      
      ctx.restore();

      // Gravitational lensing effect (subtle warping near event horizon)
      const lensGradient = ctx.createRadialGradient(0, 0, eventHorizonRadius, 0, 0, eventHorizonRadius * 2);
      lensGradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
      lensGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.9)');
      lensGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.fillStyle = lensGradient;
      ctx.beginPath();
      ctx.arc(0, 0, eventHorizonRadius * 2, 0, Math.PI * 2);
      ctx.fill();

      // Strong center darkness (event horizon)
      const eventHorizon = ctx.createRadialGradient(0, 0, 0, 0, 0, eventHorizonRadius);
      eventHorizon.addColorStop(0, 'rgba(0, 0, 0, 1)');
      eventHorizon.addColorStop(0.8, 'rgba(0, 0, 0, 1)');
      eventHorizon.addColorStop(1, 'rgba(0, 0, 0, 0.95)');
      
      ctx.fillStyle = eventHorizon;
      ctx.beginPath();
      ctx.arc(0, 0, eventHorizonRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // Draw stars (outside rotation context)
      stars.forEach(star => {
        ctx.save();
        ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Subtle glow
        const glowGradient = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.size * 3);
        glowGradient.addColorStop(0, `rgba(255, 255, 255, ${star.brightness * 0.3})`);
        glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

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
    
    if (!prefersReducedMotion) {
      animationIdRef.current = requestAnimationFrame(animate);
    } else {
      // Draw static frame for reduced motion
      animate();
    }

    // Cleanup
    return () => {
      cancelAnimationFrame(animationIdRef.current);
      window.removeEventListener('resize', resizeCanvas);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isMobile]);

  if (isMobile) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ 
        zIndex: 0
      }}
      aria-hidden="true"
    />
  );
};
