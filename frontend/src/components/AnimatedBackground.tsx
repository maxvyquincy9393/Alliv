import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export const AnimatedBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Particle system
    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
      life: number;
      maxLife: number;

      constructor() {
        this.x = Math.random() * (canvas?.width || window.innerWidth);
        this.y = Math.random() * (canvas?.height || window.innerHeight);
        // Slower velocity for smoother feel
        this.vx = (Math.random() - 0.5) * 0.2;
        this.vy = (Math.random() - 0.5) * 0.2;
        this.radius = Math.random() * 1.5 + 0.5;
        this.maxLife = Math.random() * 100 + 200; // Longer life
        this.life = this.maxLife;

        // Deep space colors (blue/violet/cyan)
        const colors = ['#3B82F6', '#8B5CF6', '#06B6D4', '#FFFFFF'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;

        // Wrap around edges
        if (this.x < 0) this.x = canvas?.width || window.innerWidth;
        if (this.x > (canvas?.width || window.innerWidth)) this.x = 0;
        if (this.y < 0) this.y = canvas?.height || window.innerHeight;
        if (this.y > (canvas?.height || window.innerHeight)) this.y = 0;

        // Reset particle when life ends
        if (this.life <= 0) {
          this.life = this.maxLife;
          this.x = Math.random() * (canvas?.width || window.innerWidth);
          this.y = Math.random() * (canvas?.height || window.innerHeight);
        }
      }

      draw() {
        if (!ctx) return;
        const opacity = (this.life / this.maxLife) * 0.3; // Lower opacity
        ctx.globalAlpha = opacity;
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 5; // Reduced glow
        ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    // Create particles (reduced count for simplicity)
    const particles: Particle[] = [];
    for (let i = 0; i < 60; i++) {
      particles.push(new Particle());
    }

    // Connection lines
    const drawConnections = () => {
      particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach(p2 => {
          const distance = Math.sqrt(
            Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)
          );

          if (distance < 120) {
            const opacity = (1 - distance / 120) * 0.1; // Very subtle lines
            if (ctx) {
              ctx.globalAlpha = opacity;
              ctx.strokeStyle = '#FFFFFF';
              ctx.lineWidth = 0.5;
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            }
          }
        });
      });
    };

    // Animation loop
    const animate = () => {
      if (!ctx || !canvas) return;
      // Clear with slight trail or full clear? Full clear for now to keep it clean.
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });

      drawConnections();
      requestAnimationFrame(animate);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 1 }}
      />

      {/* Animated gradient orbs - Monochrome & Subtle */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
        <motion.div
          className="absolute w-[800px] h-[800px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
            filter: 'blur(80px)',
            top: '-20%',
            left: '-10%',
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)',
            filter: 'blur(60px)',
            bottom: '-10%',
            right: '-10%',
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2,
          }}
        />
      </div>
    </>
  );
};
