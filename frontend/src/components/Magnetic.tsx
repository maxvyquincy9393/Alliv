import { useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface MagneticProps {
    children: React.ReactNode;
    strength?: number; // How strong the magnetic pull is (default: 50)
    active?: boolean; // Whether the effect is active
}

export const Magnetic = ({ children, strength = 50, active = true }: MagneticProps) => {
    const ref = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const handleMouse = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!active || !ref.current) return;

        const { clientX, clientY } = e;
        const { height, width, left, top } = ref.current.getBoundingClientRect();

        const middleX = clientX - (left + width / 2);
        const middleY = clientY - (top + height / 2);

        setPosition({ x: middleX, y: middleY });
    };

    const reset = () => {
        setPosition({ x: 0, y: 0 });
    };

    const { x, y } = position;

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouse}
            onMouseLeave={reset}
            animate={{ x: x / (100 / strength), y: y / (100 / strength) }}
            transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
        >
            {children}
        </motion.div>
    );
};
