/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Instagram-inspired dark theme
        dark: {
          bg: '#000000',      // Pure black like IG dark mode
          surface: '#1A1A1A', // Dark surface
          card: '#262626',    // Card background
          border: '#363636',  // Subtle borders
          text: '#FFFFFF',    // Primary text
          'text-secondary': '#A8A8A8', // Secondary text
        },
        // Tinder-inspired gradients and colors
        tinder: {
          primary: '#FE4458',   // Tinder red/pink
          secondary: '#FF7854', // Orange gradient
          gold: '#FFD700',      // Gold premium
          heart: '#FF4458',     // Heart/like color
          pass: '#CCC',         // Pass/nope color
        },
        // Instagram-style gradients
        instagram: {
          purple: '#833AB4',
          pink: '#E1306C', 
          orange: '#F56040',
          yellow: '#FCCC63',
        },
        // Modern glass morphism
        glass: {
          white: 'rgba(255, 255, 255, 0.05)',
          border: 'rgba(255, 255, 255, 0.1)',
          dark: 'rgba(0, 0, 0, 0.3)',
        },
        // Neon accents
        neon: {
          cyan: '#00F5FF',
          purple: '#8B5CF6',
          pink: '#EC4899',
          green: '#10B981',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"SF Pro Display"', 'Inter', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        DEFAULT: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
        '3xl': '32px',
      },
      boxShadow: {
        // Tinder-style shadows
        'tinder-card': '0 10px 40px rgba(0, 0, 0, 0.4), 0 6px 20px rgba(0, 0, 0, 0.3)',
        'tinder-hover': '0 20px 60px rgba(254, 68, 88, 0.3)',
        
        // Instagram-style glows
        'instagram-glow': '0 0 40px rgba(225, 48, 108, 0.4)',
        'story-ring': '0 0 0 3px rgba(225, 48, 108, 0.3)',
        
        // Glass morphism
        'glass': '0 8px 32px rgba(0, 0, 0, 0.6)',
        'glass-border': 'inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        
        // Modern depth
        'depth-sm': '0 2px 8px rgba(0, 0, 0, 0.8)',
        'depth-md': '0 4px 16px rgba(0, 0, 0, 0.8)',
        'depth-lg': '0 8px 32px rgba(0, 0, 0, 0.8)',
        'depth-xl': '0 16px 64px rgba(0, 0, 0, 0.8)',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.4s ease-out', 
        'scale-in': 'scaleIn 0.3s ease-out',
        'swipe-left': 'swipeLeft 0.3s ease-out',
        'swipe-right': 'swipeRight 0.3s ease-out',
        'heart-beat': 'heartBeat 0.6s ease-in-out',
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-in': 'bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'gradient-shift': 'gradientShift 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        swipeLeft: {
          '0%': { transform: 'translateX(0) rotate(0deg)' },
          '100%': { transform: 'translateX(-150%) rotate(-30deg)', opacity: '0' },
        },
        swipeRight: {
          '0%': { transform: 'translateX(0) rotate(0deg)' },
          '100%': { transform: 'translateX(150%) rotate(30deg)', opacity: '0' },
        },
        heartBeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '25%': { transform: 'scale(1.1)' },
          '50%': { transform: 'scale(1.3)' },
          '75%': { transform: 'scale(1.1)' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
      backgroundImage: {
        'gradient-instagram': 'linear-gradient(45deg, #833AB4, #E1306C, #F56040)',
        'gradient-tinder': 'linear-gradient(135deg, #FE4458, #FF7854)',
        'gradient-dark': 'linear-gradient(145deg, #1A1A1A, #262626)',
        'gradient-purple': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'gradient-pink': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'gradient-gold': 'linear-gradient(135deg, #FFD700, #FFA500)',
        'shimmer': 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
        'glass': 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
        'card-dark': 'linear-gradient(145deg, rgba(26,26,26,0.8), rgba(38,38,38,0.8))',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['Poppins', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }], 
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
      },
    },
  },
  plugins: [],
}
