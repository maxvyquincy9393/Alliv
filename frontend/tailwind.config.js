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
        dark: {
          bg: '#0B0B0B',
          surface: '#121212',
          card: '#1A1A1A',
          border: '#2A2A2A',
        },
        accent: {
          blue: '#A1A1FF',
          'blue-light': '#C1C1FF',
          'blue-dark': '#8181DD',
        },
        glass: {
          white: 'rgba(255, 255, 255, 0.04)',
          border: 'rgba(255, 255, 255, 0.06)',
        }
      },
      fontFamily: {
        sans: ['"SF Pro Display"', 'Inter', '"Neue Montreal"', 'system-ui', 'sans-serif'],
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
        'glow-sm': '0 0 10px rgba(161, 161, 255, 0.3)',
        'glow': '0 0 20px rgba(161, 161, 255, 0.4)',
        'glow-lg': '0 0 30px rgba(161, 161, 255, 0.5)',
        'inner-glow': 'inset 0 0 20px rgba(161, 161, 255, 0.2)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.4)',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
    },
  },
  plugins: [],
}
