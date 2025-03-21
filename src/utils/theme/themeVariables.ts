import { ThemeConfig } from './themeConfig';

export interface ThemeVariables {
  [key: string]: string;
}

/**
 * Transforms a theme configuration into CSS variables
 * @param theme The theme configuration
 * @param prefix Optional prefix for the CSS variables (default: '--theme')
 * @returns An object with CSS variable names as keys and their values
 */
export function createThemeVariables(theme: ThemeConfig, prefix: string = '--theme'): ThemeVariables {
  const variables: ThemeVariables = {};

  // Process nested objects recursively
  const processObject = (obj: Record<string, any>, path: string = '') => {
    Object.entries(obj).forEach(([key, value]) => {
      const varPath = path ? `${path}-${key}` : key;
      
      if (typeof value === 'object' && value !== null) {
        // Recursively process nested objects
        processObject(value, varPath);
      } else {
        // Create CSS variable with safe string conversion
        variables[`${prefix}-${varPath}`] = String(value);
      }
    });
  };

  processObject(theme);
  return variables;
}

/**
 * Applies theme variables to a DOM element
 * @param element The DOM element to apply variables to
 * @param variables The theme variables
 */
export function applyThemeVariables(element: HTMLElement, variables: ThemeVariables): void {
  Object.entries(variables).forEach(([property, value]) => {
    element.style.setProperty(property, value);
  });
}

/**
 * Creates a CSS string from theme variables
 * @param variables The theme variables
 * @returns A CSS string with variable declarations
 */
export function createCSSVariables(variables: ThemeVariables): string {
  return Object.entries(variables)
    .map(([property, value]) => `${property}: ${value};`)
    .join('\n');
}

/**
 * Gets the system color scheme preference (light or dark)
 * @returns 'dark' if the system prefers dark mode, 'light' otherwise
 */
export function getSystemColorScheme(): 'light' | 'dark' {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light'; // Default to light if matchMedia is not available
}

/**
 * Listens for system color scheme changes
 * @param callback Function to call when the color scheme changes
 * @returns A function to remove the listener
 */
export function listenForColorSchemeChanges(callback: (isDark: boolean) => void): () => void {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return () => {}; // No-op if not in browser or matchMedia not supported
  }

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  const handleChange = (e: MediaQueryListEvent) => {
    callback(e.matches);
  };
  
  // Modern browsers use addEventListener
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  } 
  // Older browsers use deprecated addListener
  else {
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }
}