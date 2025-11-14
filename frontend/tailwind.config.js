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
        tinder: {
          primary: withOpacityValue('--color-highlight'),
          secondary: withOpacityValue('--color-accent-secondary'),
          gold: withOpacityValue('--color-warm'),
          heart: withOpacityValue('--color-highlight'),
          pass: '#CCCCCC',
        },
        instagram: {
          purple: '#833AB4',
          pink: '#E1306C',
          orange: '#F56040',
          yellow: '#FCCC63',
        },
        neon: {
          cyan: '#00F5FF',
          purple: '#8B5CF6',
          pink: '#EC4899',
          green: '#10B981',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        glass: 'var(--shadow-glass)',
        'glow-blue': 'var(--shadow-glow-blue)',
        elevated: '0 20px 60px rgba(0,0,0,0.4), 0 0 1px rgba(255,255,255,0.06) inset',
        floating: '0 30px 80px rgba(0,0,0,0.5), 0 0 2px rgba(255,255,255,0.08) inset',
        'card-hover':
          '0 24px 70px rgba(0,0,0,0.45), 0 0 1px rgba(102,126,234,0.2) inset, 0 1px 3px rgba(102,126,234,0.3)',
        'glow-purple': '0 0 40px rgba(102,126,234,0.5), 0 8px 32px rgba(0,0,0,0.3)',
        'glow-pink': '0 0 40px rgba(255,110,199,0.5), 0 8px 32px rgba(0,0,0,0.3)',
        'glow-gold': '0 0 40px rgba(255,215,0,0.5), 0 8px 32px rgba(0,0,0,0.3)',
        'inner-glow': 'inset 0 1px 2px rgba(255,255,255,0.1), 0 2px 8px rgba(0,0,0,0.2)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      backgroundImage: {
        'gradient-dark': 'linear-gradient(145deg, rgba(26,26,26,0.9), rgba(38,38,38,0.85))',
        'gradient-accent': 'linear-gradient(135deg, rgba(34,211,238,0.2), rgba(99,102,241,0.2))',
        'glass': 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
        'card-dark': 'linear-gradient(145deg, rgba(26,26,26,0.85), rgba(38,38,38,0.85))',
      },
    },
  },
  plugins: [],
}
