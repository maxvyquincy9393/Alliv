import React, { useRef } from "react";
import { motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion";

interface TiltCardProps {
    children: React.ReactNode;
    className?: string;
}

export const TiltCard = ({ children, className = "" }: TiltCardProps) => {
    const ref = useRef<HTMLDivElement>(null);

    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseX = useSpring(x, { stiffness: 150, damping: 15 });
    const mouseY = useSpring(y, { stiffness: 150, damping: 15 });

    function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
        const { left, top, width, height } = currentTarget.getBoundingClientRect();

        const xPct = (clientX - left) / width - 0.5;
        const yPct = (clientY - top) / height - 0.5;

        x.set(xPct);
        y.set(yPct);
    }

    function handleMouseLeave() {
        x.set(0);
        y.set(0);
    }

    const rotateX = useMotionTemplate`${mouseY.get() * -5}deg`;
    const rotateY = useMotionTemplate`${mouseX.get() * 5}deg`;

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                transformStyle: "preserve-3d",
                rotateX,
                rotateY,
            }}
            className={className}
        >
            <div
                style={{
                    transform: "translateZ(75px)",
                    transformStyle: "preserve-3d",
                }}
                className="h-full"
            >
                {children}
            </div>
        </motion.div>
    );
};
