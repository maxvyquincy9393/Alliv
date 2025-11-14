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
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.radius = Math.random() * 2 + 0.5;
        this.maxLife = Math.random() * 100 + 100;
        this.life = this.maxLife;
        
        const colors = ['#35F5FF', '#7F6CFF', '#FF8EC7', '#FFEC3D'];
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
        const opacity = this.life / this.maxLife;
        ctx.globalAlpha = opacity * 0.5;
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    // Create particles
    const particles: Particle[] = [];
    for (let i = 0; i < 100; i++) {
      particles.push(new Particle());
    }

    // Connection lines
    const drawConnections = () => {
      particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach(p2 => {
          const distance = Math.sqrt(
            Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)
          );
          
          if (distance < 100) {
            const opacity = (1 - distance / 100) * 0.2;
            if (ctx) {
              ctx.globalAlpha = opacity;
              ctx.strokeStyle = '#35F5FF';
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
      ctx.fillStyle = 'rgba(10, 15, 28, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
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
      
      {/* Animated gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(53, 245, 255, 0.3) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
          animate={{
            x: ['-20%', '120%', '-20%'],
            y: ['-20%', '120%', '-20%'],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
        
        <motion.div
          className="absolute w-[800px] h-[800px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(127, 108, 255, 0.3) 0%, transparent 70%)',
            filter: 'blur(80px)',
            right: 0,
          }}
          animate={{
            x: ['20%', '-120%', '20%'],
            y: ['120%', '-20%', '120%'],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
        
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(255, 142, 199, 0.3) 0%, transparent 70%)',
            filter: 'blur(70px)',
            bottom: 0,
            left: '50%',
          }}
          animate={{
            x: ['-50%', '50%', '-50%'],
            y: ['50%', '-50%', '50%'],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </div>
    </>
  );
};
