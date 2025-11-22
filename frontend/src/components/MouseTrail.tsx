import { useEffect, useRef } from 'react';
import { useIsMobile } from '../hooks/useIsMobile';

interface Point {
    x: number;
    y: number;
    age: number;
}

export const MouseTrail = () => {
    const isMobile = useIsMobile();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const pointsRef = useRef<Point[]>([]);
    const mouseRef = useRef({ x: 0, y: 0 });
    const rafRef = useRef<number>(0);

    useEffect(() => {
        if (isMobile) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        const handleMouseMove = (e: MouseEvent) => {
            mouseRef.current = { x: e.clientX, y: e.clientY };
            // Add new point
            pointsRef.current.push({
                x: e.clientX,
                y: e.clientY,
                age: 0
            });
        };
        window.addEventListener('mousemove', handleMouseMove);

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Update and draw points
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            if (pointsRef.current.length > 1) {
                ctx.beginPath();
                ctx.moveTo(pointsRef.current[0].x, pointsRef.current[0].y);

                for (let i = 1; i < pointsRef.current.length; i++) {
                    const point = pointsRef.current[i];
                    const prevPoint = pointsRef.current[i - 1];

                    // Quadratic curve for smoothness
                    const cx = (point.x + prevPoint.x) / 2;
                    const cy = (point.y + prevPoint.y) / 2;

                    ctx.quadraticCurveTo(prevPoint.x, prevPoint.y, cx, cy);

                    point.age++;
                }

                // Gradient stroke
                const gradient = ctx.createLinearGradient(
                    pointsRef.current[0].x,
                    pointsRef.current[0].y,
                    pointsRef.current[pointsRef.current.length - 1].x,
                    pointsRef.current[pointsRef.current.length - 1].y
                );
                gradient.addColorStop(0, 'rgba(59, 130, 246, 0)');
                gradient.addColorStop(0.5, 'rgba(147, 51, 234, 0.5)');
                gradient.addColorStop(1, 'rgba(255, 255, 255, 0.8)');

                ctx.strokeStyle = gradient;
                ctx.lineWidth = 2;
                ctx.shadowBlur = 10;
                ctx.shadowColor = 'rgba(147, 51, 234, 0.5)';
                ctx.stroke();
            }

            // Remove old points
            pointsRef.current = pointsRef.current.filter(p => p.age < 50);

            rafRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(rafRef.current);
        };
    }, [isMobile]);

    if (isMobile) return null;

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-50 mix-blend-screen"
        />
    );
};
