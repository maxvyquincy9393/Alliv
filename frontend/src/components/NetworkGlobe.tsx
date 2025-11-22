import { useEffect, useRef } from 'react';

export const NetworkGlobe = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number>(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size to match parent
        const resize = () => {
            const parent = canvas.parentElement;
            if (parent) {
                canvas.width = parent.clientWidth;
                canvas.height = parent.clientHeight;
            }
        };
        resize();
        window.addEventListener('resize', resize);

        // Globe parameters
        const globeRadius = 80;
        const dots: { x: number; y: number; z: number; lat: number; lon: number }[] = [];
        const numDots = 100;
        let rotation = 0;

        // Initialize dots on sphere
        for (let i = 0; i < numDots; i++) {
            const phi = Math.acos(-1 + (2 * i) / numDots);
            const theta = Math.sqrt(numDots * Math.PI) * phi;

            dots.push({
                x: 0, y: 0, z: 0, // Calculated in animate
                lat: phi,
                lon: theta
            });
        }

        const animate = () => {
            if (!ctx || !canvas) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const cx = canvas.width / 2;
            const cy = canvas.height / 2;

            rotation += 0.005;

            // Draw connections first (behind dots)
            ctx.strokeStyle = 'rgba(59, 130, 246, 0.1)';
            ctx.lineWidth = 1;
            ctx.beginPath();

            dots.forEach((dot, i) => {
                // Rotate
                const x = globeRadius * Math.sin(dot.lat) * Math.cos(dot.lon + rotation);
                const y = globeRadius * Math.cos(dot.lat);
                const z = globeRadius * Math.sin(dot.lat) * Math.sin(dot.lon + rotation);

                // Project 3D to 2D
                const scale = 200 / (200 + z);
                const px = cx + x * scale;
                const py = cy + y * scale;

                dot.x = px;
                dot.y = py;
                dot.z = z;

                // Draw connections to nearby dots
                dots.forEach((otherDot, j) => {
                    if (i !== j && otherDot.z > -20 && dot.z > -20) { // Only front-facing
                        const dx = dot.x - otherDot.x;
                        const dy = dot.y - otherDot.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist < 30) {
                            ctx.moveTo(dot.x, dot.y);
                            ctx.lineTo(otherDot.x, otherDot.y);
                        }
                    }
                });
            });
            ctx.stroke();

            // Draw dots
            dots.forEach(dot => {
                const alpha = (dot.z + globeRadius) / (2 * globeRadius); // Fade back dots
                const size = Math.max(0.5, 2 * (dot.z + globeRadius) / (2 * globeRadius));

                ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                ctx.beginPath();
                ctx.arc(dot.x, dot.y, size, 0, Math.PI * 2);
                ctx.fill();

                // Glow for front dots
                if (dot.z > 50) {
                    ctx.shadowBlur = 5;
                    ctx.shadowColor = 'white';
                } else {
                    ctx.shadowBlur = 0;
                }
            });

            rafRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(rafRef.current);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="w-full h-full"
        />
    );
};
