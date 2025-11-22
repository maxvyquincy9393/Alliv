const withOpacityValue = (variable) => {
  return ({ opacityValue }) => {
    if (opacityValue !== undefined) {
      return `rgb(var(${variable}) / ${opacityValue})`
    }
    return `rgb(var(${variable}))`
  }
}

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cosmic: {
          950: '#020204', // Void
          900: '#050508', // Deepest
          800: '#0B0D13', // Surface
          700: '#161923', // Surface light
          600: '#1E293B', // Slate
          500: '#3B82F6', // Primary Blue
          400: '#60A5FA', // Light Blue
          300: '#A78BFA', // Soft Purple
          100: '#E2E8F0', // Text
          50: '#F8FAFC', // Whiteish
        },
        dark: {
          bg: withOpacityValue('--color-bg'),
          surface: withOpacityValue('--color-bg-soft'),
          card: withOpacityValue('--color-card'),
          'card-strong': withOpacityValue('--color-card-strong'),
          border: withOpacityValue('--color-border'),
          text: withOpacityValue('--color-text'),
          'text-secondary': withOpacityValue('--color-text-muted'),
        },
        accent: {
          primary: withOpacityValue('--color-accent'),
          secondary: withOpacityValue('--color-accent-secondary'),
          highlight: withOpacityValue('--color-highlight'),
          warm: withOpacityValue('--color-warm'),
        },
        glass: {
          white: 'rgba(255, 255, 255, 0.05)',
          border: 'rgba(255, 255, 255, 0.1)',
          dark: 'rgba(0, 0, 0, 0.3)',
        },
      },
      fontFamily: {
        sans: ['SF Pro Display', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['SF Pro Display', 'Space Grotesk', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glow-blue': '0 0 30px rgba(59, 130, 246, 0.4)',
        'glow-purple': '0 0 30px rgba(139, 92, 246, 0.4)',
        'glow-white': '0 0 30px rgba(255, 255, 255, 0.15)',
        elevated: '0 20px 60px rgba(0,0,0,0.6), 0 0 1px rgba(255,255,255,0.1) inset',
        floating: '0 30px 80px rgba(0,0,0,0.6), 0 0 2px rgba(255,255,255,0.1) inset',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 8s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
        'spotlight': 'spotlight 2s ease .75s 1 forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-15px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        spotlight: {
          '0%': { opacity: 0, transform: 'translate(-72%, -62%) scale(0.5)' },
          '100%': { opacity: 1, transform: 'translate(-50%,-40%) scale(1)' },
        },
      },
      backgroundImage: {
        'gradient-cosmic': 'linear-gradient(to bottom right, #020204, #0B0D13)',
        'gradient-glow': 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(139, 92, 246, 0.15))',
        'glass': 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
      },
    },
  },
  plugins: [],
}
