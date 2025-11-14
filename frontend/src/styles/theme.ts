export const theme = {
  colors: {
    // Primary brand colors
    primary: {
      blue: '#35F5FF',
      purple: '#7F6CFF',
      pink: '#FF8EC7',
      yellow: '#FFEC3D',
    },
    
    // Background colors
    background: {
      dark: '#0A0F1C',
      darker: '#050B18',
      card: 'rgba(15, 20, 35, 0.8)',
      overlay: 'rgba(0, 0, 0, 0.6)',
      glass: 'rgba(255, 255, 255, 0.05)',
    },
    
    // Text colors
    text: {
      primary: '#FFFFFF',
      secondary: 'rgba(255, 255, 255, 0.7)',
      muted: 'rgba(255, 255, 255, 0.4)',
    },
    
    // Status colors
    status: {
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6',
    },
  },
  
  // Gradient presets
  gradients: {
    primary: 'linear-gradient(135deg, #35F5FF 0%, #7F6CFF 50%, #FF8EC7 100%)',
    accent: 'linear-gradient(135deg, #35F5FF 0%, #FFEC3D 100%)',
    dark: 'linear-gradient(135deg, #0A0F1C 0%, #1A1F3A 50%, #0D1117 100%)',
    card: 'linear-gradient(135deg, rgba(15, 20, 35, 0.9) 0%, rgba(25, 30, 50, 0.8) 100%)',
    button: 'linear-gradient(135deg, #35F5FF 0%, #7F6CFF 100%)',
    success: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
    danger: 'linear-gradient(135deg, #EF4444 0%, #F87171 100%)',
  },
  
  // Consistent shadows
  shadows: {
    sm: '0 4px 12px rgba(0, 0, 0, 0.15)',
    md: '0 8px 24px rgba(0, 0, 0, 0.25)',
    lg: '0 15px 35px rgba(0, 0, 0, 0.35)',
    xl: '0 25px 50px rgba(0, 0, 0, 0.45)',
    glow: {
      blue: '0 15px 35px rgba(53, 245, 255, 0.35)',
      purple: '0 15px 35px rgba(127, 108, 255, 0.35)',
      pink: '0 15px 35px rgba(255, 142, 199, 0.35)',
    },
  },
  
  // Border radius presets
  borderRadius: {
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    full: '9999px',
  },
  
  // Transitions
  transitions: {
    fast: '150ms ease',
    base: '300ms ease',
    slow: '500ms ease',
  },
};
