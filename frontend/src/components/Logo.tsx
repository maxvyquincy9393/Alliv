import { motion } from 'framer-motion';

interface LogoProps {
    className?: string;
    size?: 'small' | 'medium' | 'large' | 'xl';
}

export const Logo = ({ className = '', size = 'medium' }: LogoProps) => {
    const sizeMap = {
        small: { width: 20, height: 20 },
        medium: { width: 28, height: 28 },
        large: { width: 40, height: 40 },
        xl: { width: 56, height: 56 },
    };

    const { width, height } = sizeMap[size];

    return (
        <motion.div
            className={`relative flex items-center justify-center ${className}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
        >
            <motion.svg
                width={width}
                height={height}
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"
            >
                {/* Elegant Left Leg */}
                <motion.path
                    d="M 50 10 L 20 90"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    className="text-white"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                />

                {/* Elegant Right Leg */}
                <motion.path
                    d="M 50 10 L 80 90"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    className="text-white"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                />

                {/* Minimalist Crossbar */}
                <motion.path
                    d="M 35 60 L 65 60"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    className="text-white/80"
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
                />

                {/* Polaris Star at Apex */}
                <motion.circle
                    cx="50"
                    cy="10"
                    r="3"
                    fill="white"
                    animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.8, 1, 0.8],
                        boxShadow: "0 0 20px white"
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
            </motion.svg>

            <div className="absolute inset-0 bg-white/30 blur-xl rounded-full opacity-0 hover:opacity-50 transition-opacity duration-500" />
        </motion.div>
    );
};
