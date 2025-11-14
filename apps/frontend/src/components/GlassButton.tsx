import { motion } from 'framer-motion';
import { ReactNode, ButtonHTMLAttributes } from 'react';

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  fullWidth?: boolean;
  loading?: boolean;
}

export const GlassButton = ({
  children,
  variant = 'primary',
  fullWidth = false,
  loading = false,
  disabled,
  className = '',
  ...props
}: GlassButtonProps) => {
  const baseStyles = `
    px-6 py-3 rounded-xl font-medium text-sm
    transition-all duration-200
    disabled:opacity-50 disabled:cursor-not-allowed
    focus:outline-none
    ${fullWidth ? 'w-full' : ''}
  `;

  const variantStyles = {
    primary: `
      glass text-white
      hover:glass-strong hover:shadow-glow
      active:scale-[0.98]
    `,
    secondary: `
      bg-white/10 text-white border border-white/20
      hover:bg-white/15 hover:border-white/30
      active:scale-[0.98]
    `,
    ghost: `
      text-white/70 hover:text-white
      hover:bg-white/5
      active:scale-[0.98]
    `,
  };

  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      disabled={disabled || loading}
      type={props.type || 'button'}
      onClick={props.onClick}
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      ) : (
        children
      )}
    </motion.button>
  );
};
