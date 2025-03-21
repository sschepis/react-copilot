import {
  gray,
  blue,
  red,
  green,
  amber,
  slate,
  violet,
  blackA,
  whiteA,
} from '@radix-ui/colors';

/**
 * Theme tokens for the enhanced debug panel
 * This uses Radix UI colors for consistent theming
 */
export const debugTheme = {
  // Core colors
  colors: {
    // Background colors
    bgBase: gray.gray1,
    bgElevated: gray.gray2,
    bgHighlight: gray.gray3,
    bgActive: blue.blue3,
    bgHover: gray.gray4,
    
    // Text colors
    textPrimary: slate.slate12,
    textSecondary: slate.slate11,
    textTertiary: slate.slate10,
    textInverted: whiteA.whiteA12,
    
    // Border colors
    borderLight: gray.gray6,
    borderMedium: gray.gray8,
    borderDark: gray.gray10,
    
    // Status colors
    success: green.green9,
    error: red.red9,
    warning: amber.amber9,
    info: blue.blue9,
    
    // Brand colors
    primary: violet.violet9,
    primaryLight: violet.violet5,
    primaryDark: violet.violet10,
    
    // Overlay colors
    overlay: blackA.blackA6,
    
    // Component specific colors
    component: blue.blue9,
    props: green.green9,
    state: amber.amber9,
    events: violet.violet9,
  },
  
  // Typography
  typography: {
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      md: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      xxl: '1.5rem',
    },
    fontWeights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeights: {
      tight: 1.2,
      normal: 1.5,
      loose: 1.8,
    },
  },
  
  // Spacing
  space: {
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    5: '1.5rem',
    6: '2rem',
    7: '2.5rem',
    8: '3rem',
  },
  
  // Borders
  borders: {
    radius: {
      sm: '0.125rem',
      md: '0.25rem',
      lg: '0.5rem',
      pill: '9999px',
    },
    width: {
      thin: '1px',
      medium: '2px',
      thick: '3px',
    },
  },
  
  // Shadows
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  },
  
  // Animation
  transitions: {
    fast: '150ms ease',
    normal: '250ms ease',
    slow: '350ms ease',
  },
  
  // Z-index
  zIndices: {
    base: 1,
    overlay: 100,
    modal: 200,
    toast: 300,
    tooltip: 400,
  },
};

/**
 * Dark theme variant
 */
export const darkDebugTheme = {
  ...debugTheme,
  colors: {
    // Background colors
    bgBase: slate.slate1,
    bgElevated: slate.slate2,
    bgHighlight: slate.slate3,
    bgActive: blue.blue3,
    bgHover: slate.slate4,
    
    // Text colors
    textPrimary: whiteA.whiteA12,
    textSecondary: whiteA.whiteA11,
    textTertiary: whiteA.whiteA10,
    textInverted: slate.slate12,
    
    // Border colors
    borderLight: slate.slate6,
    borderMedium: slate.slate8,
    borderDark: slate.slate10,
    
    // Status colors remain the same for consistency
    success: green.green9,
    error: red.red9,
    warning: amber.amber9,
    info: blue.blue9,
    
    // Brand colors
    primary: violet.violet9,
    primaryLight: violet.violet5,
    primaryDark: violet.violet10,
    
    // Overlay colors
    overlay: blackA.blackA8,
    
    // Component specific colors
    component: blue.blue9,
    props: green.green9,
    state: amber.amber9,
    events: violet.violet9,
  },
};

// Define the type for theme variables
export type ThemeVariables = Record<string, string>;

// CSS variable creation helper
export const createThemeVariables = (theme: typeof debugTheme): ThemeVariables => {
  return {
    // Extract colors into CSS variables
    ...Object.entries(theme.colors).reduce((acc, [key, value]) => {
      acc[`--debug-color-${key}`] = value;
      return acc;
    }, {} as Record<string, string>),
    
    // Typography
    ...Object.entries(theme.typography.fontSizes).reduce((acc, [key, value]) => {
      acc[`--debug-font-size-${key}`] = value;
      return acc;
    }, {} as Record<string, string>),
    
    '--debug-font-family': theme.typography.fontFamily,
    
    ...Object.entries(theme.typography.fontWeights).reduce((acc, [key, value]) => {
      acc[`--debug-font-weight-${key}`] = String(value);
      return acc;
    }, {} as Record<string, string>),
    
    ...Object.entries(theme.typography.lineHeights).reduce((acc, [key, value]) => {
      acc[`--debug-line-height-${key}`] = String(value);
      return acc;
    }, {} as Record<string, string>),
    
    // Spacing
    ...Object.entries(theme.space).reduce((acc, [key, value]) => {
      acc[`--debug-space-${key}`] = value;
      return acc;
    }, {} as Record<string, string>),
    
    // Borders
    ...Object.entries(theme.borders.radius).reduce((acc, [key, value]) => {
      acc[`--debug-radius-${key}`] = value;
      return acc;
    }, {} as Record<string, string>),
    
    ...Object.entries(theme.borders.width).reduce((acc, [key, value]) => {
      acc[`--debug-border-width-${key}`] = value;
      return acc;
    }, {} as Record<string, string>),
    
    // Shadows
    ...Object.entries(theme.shadows).reduce((acc, [key, value]) => {
      acc[`--debug-shadow-${key}`] = value;
      return acc;
    }, {} as Record<string, string>),
    
    // Transitions
    ...Object.entries(theme.transitions).reduce((acc, [key, value]) => {
      acc[`--debug-transition-${key}`] = value;
      return acc;
    }, {} as Record<string, string>),
    
    // Z-indices
    ...Object.entries(theme.zIndices).reduce((acc, [key, value]) => {
      acc[`--debug-z-${key}`] = String(value);
      return acc;
    }, {} as Record<string, string>),
  };
};