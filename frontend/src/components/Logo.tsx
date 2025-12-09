import { motion } from 'framer-motion';

interface LogoProps {
    className?: string;
    size?: 'small' | 'medium' | 'large' | 'xl';
}

export const Logo = ({ className = '', size = 'medium' }: LogoProps) => {
    const sizeMap = {
        small: { width: 24, height: 24 },
        medium: { width: 32, height: 32 },
        large: { width: 48, height: 48 },
        xl: { width: 64, height: 64 },
    };

    const { width, height } = sizeMap[size];

    return (
        <motion.div
            className={`relative flex items-center justify-center ${className}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
        >
            <img 
                src="/logo_alivv.png" 
                alt="ALLIV Logo" 
                style={{ width, height, objectFit: 'contain' }}
            />
        </motion.div>
    );
};