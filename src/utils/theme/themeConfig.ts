/**
 * Theme configuration interface
 */
export interface ThemeConfig {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    surfaceHover: string;
    surfaceActive: string;
    text: string;
    textSecondary: string;
    border: string;
    borderLight: string;
    overlay: string;
    error: string;
    success: string;
    warning: string;
    info: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  fontSizes: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    pill: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
  zIndices: {
    base: number;
    overlay: number;
    modal: number;
    tooltip: number;
  };
  transitions: {
    fast: string;
    medium: string;
    slow: string;
  };
}

/**
 * Light theme configuration
 */
export const lightTheme: ThemeConfig = {
  colors: {
    primary: '#8b5cf6',
    secondary: '#4f46e5',
    background: '#ffffff',
    surface: '#f8f8f8',
    surfaceHover: '#f0f0f0',
    surfaceActive: '#e8e8e8',
    text: '#2a2a2a',
    textSecondary: '#666666',
    border: '#e0e0e0',
    borderLight: 'rgba(0, 0, 0, 0.1)',
    overlay: 'rgba(0, 0, 0, 0.3)',
    error: '#ef4444',
    success: '#22c55e',
    warning: '#f59e0b',
    info: '#3b82f6',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  fontSizes: {
    xs: '12px',
    sm: '14px',
    md: '16px',
    lg: '18px',
    xl: '20px',
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    pill: '9999px',
  },
  shadows: {
    sm: '0 1px 3px rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
  },
  zIndices: {
    base: 1,
    overlay: 1000,
    modal: 1100,
    tooltip: 1200,
  },
  transitions: {
    fast: '0.1s ease',
    medium: '0.2s ease',
    slow: '0.3s ease',
  },
};

/**
 * Dark theme configuration
 */
export const darkTheme: ThemeConfig = {
  colors: {
    primary: '#7c3aed',
    secondary: '#4338ca',
    background: '#1e1e1e',
    surface: '#2a2a2a',
    surfaceHover: '#333333',
    surfaceActive: '#3a3a3a',
    text: '#ffffff',
    textSecondary: '#a0a0a0',
    border: '#444444',
    borderLight: 'rgba(255, 255, 255, 0.1)',
    overlay: 'rgba(0, 0, 0, 0.7)',
    error: '#f87171',
    success: '#4ade80',
    warning: '#fbbf24',
    info: '#60a5fa',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  fontSizes: {
    xs: '12px',
    sm: '14px',
    md: '16px',
    lg: '18px',
    xl: '20px',
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    pill: '9999px',
  },
  shadows: {
    sm: '0 1px 3px rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px rgba(0, 0, 0, 0.3)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.3)',
  },
  zIndices: {
    base: 1,
    overlay: 1000,
    modal: 1100,
    tooltip: 1200,
  },
  transitions: {
    fast: '0.1s ease',
    medium: '0.2s ease',
    slow: '0.3s ease',
  },
};