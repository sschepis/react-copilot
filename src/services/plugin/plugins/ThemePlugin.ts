import { Plugin, PluginHooks, PluginContext, ModifiableComponent, CodeChangeResult } from '../../../utils/types';

/**
 * Theme configuration
 */
export interface ThemeConfig {
  /** Theme name */
  name: string;
  /** Theme mode ('light' or 'dark') */
  mode: 'light' | 'dark';
  /** Color palette */
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    error: string;
    text: string;
    [key: string]: string;
  };
  /** Typography settings */
  typography: {
    fontFamily: string;
    headingFontFamily?: string;
    fontSize: string;
    fontWeightRegular: number;
    fontWeightMedium: number;
    fontWeightBold: number;
    h1: {
      fontSize: string;
      fontWeight: number;
      lineHeight: number;
    };
    h2: {
      fontSize: string;
      fontWeight: number;
      lineHeight: number;
    };
    h3: {
      fontSize: string;
      fontWeight: number;
      lineHeight: number;
    };
    body1: {
      fontSize: string;
      fontWeight: number;
      lineHeight: number;
    };
    body2: {
      fontSize: string;
      fontWeight: number;
      lineHeight: number;
    };
    button: {
      fontSize: string;
      fontWeight: number;
      lineHeight: number;
    };
    [key: string]: any;
  };
  /** Spacing units */
  spacing: {
    unit: string;
    baseline: number;
    [key: string]: any;
  };
  /** Border styles */
  borders: {
    radius: string;
    width: string;
    [key: string]: any;
  };
  /** Animation settings */
  animation: {
    duration: {
      short: string;
      medium: string;
      long: string;
    };
    easing: {
      easeIn: string;
      easeOut: string;
      easeInOut: string;
    };
  };
  /** Other theme properties */
  [key: string]: any;
}

/**
 * Component styling issue
 */
export interface StylingIssue {
  type: 'color' | 'typography' | 'spacing' | 'borders' | 'hardcoded';
  description: string;
  suggestedFix: string;
  code: string;
  severity: 'error' | 'warning' | 'info';
}

/**
 * Theme plugin options
 */
export interface ThemePluginOptions {
  /** Initial theme configuration */
  initialTheme?: ThemeConfig;
  /** Whether to automatically fix styling issues */
  autoFix?: boolean;
  /** Whether to enforce the design system */
  enforceDesignSystem?: boolean;
  /** Whether to support dark mode */
  supportDarkMode?: boolean;
  /** CSS-in-JS library to use */
  cssLibrary?: 'styled-components' | 'emotion' | 'none';
  /** Array of disallowed style patterns (regex) */
  disallowedPatterns?: string[];
}

/**
 * Plugin for managing theming and design system integration
 */
export class ThemePlugin implements Plugin {
  id = 'theme-plugin';
  name = 'Theme Plugin';
  version = '1.0.0';
  
  private options: ThemePluginOptions;
  private currentTheme: ThemeConfig;
  private themes: Map<string, ThemeConfig> = new Map();
  private context: PluginContext | null = null;
  
  /**
   * Plugin hooks implementation
   */
  hooks: PluginHooks = {
    // Check component styling during registration
    beforeComponentRegistration: (component: ModifiableComponent): ModifiableComponent => {
      if (!component.sourceCode) {
        return component;
      }
      
      // Check for styling issues
      const issues = this.checkStylingIssues(component.sourceCode);
      
      if (issues.length > 0) {
        console.log(`[ThemePlugin] Found ${issues.length} styling issues in component ${component.name}`);
        
        // Apply auto-fixes if enabled
        if (this.options.autoFix) {
          const fixedCode = this.fixStylingIssues(component.sourceCode, issues);
          if (fixedCode !== component.sourceCode) {
            return { ...component, sourceCode: fixedCode };
          }
        }
      }
      
      return component;
    },
    
    // Check code for styling issues before execution
    beforeCodeExecution: (code: string): string => {
      const issues = this.checkStylingIssues(code);
      
      if (issues.length > 0) {
        console.log(`[ThemePlugin] Found ${issues.length} styling issues`);
        
        // If auto-fix is disabled, just add comments
        if (!this.options.autoFix) {
          const issueComments = issues
            .map(issue => `// STYLING ${issue.severity.toUpperCase()}: ${issue.description}\n// Suggested fix: ${issue.suggestedFix}`)
            .join('\n');
            
          return `${issueComments}\n\n${code}`;
        } else {
          // Apply auto-fixes
          return this.fixStylingIssues(code, issues);
        }
      }
      
      return code;
    }
  };
  
  /**
   * Create a new ThemePlugin
   * @param options Theme plugin options
   */
  constructor(options: ThemePluginOptions = {}) {
    this.options = {
      autoFix: false,
      enforceDesignSystem: true,
      supportDarkMode: true,
      cssLibrary: 'styled-components',
      disallowedPatterns: [
        'style="[^"]*"',               // Inline styles
        '#[0-9a-fA-F]{3,6}',           // Hardcoded hex colors
        'rgba?\\([^)]+\\)',            // Hardcoded RGB colors
        'font-size:\\s*\\d+px',        // Hardcoded font sizes
        'margin:\\s*\\d+px',           // Hardcoded margins
        'padding:\\s*\\d+px',          // Hardcoded paddings
      ],
      ...options
    };
    
    // Set up default theme
    this.currentTheme = this.options.initialTheme || this.createDefaultTheme();
    this.themes.set(this.currentTheme.name, this.currentTheme);
    
    // Create dark theme if needed
    if (this.options.supportDarkMode && this.currentTheme.mode === 'light') {
      const darkTheme = this.createDarkTheme(this.currentTheme);
      this.themes.set(darkTheme.name, darkTheme);
    }
  }
  
  /**
   * Initialize the plugin with context
   * @param context The plugin context
   */
  async initialize(context: PluginContext): Promise<void> {
    console.log('[ThemePlugin] Initializing...');
    this.context = context;
    console.log('[ThemePlugin] Initialized successfully');
  }
  
  /**
   * Clean up plugin resources
   */
  async destroy(): Promise<void> {
    console.log('[ThemePlugin] Cleaning up...');
    this.context = null;
    console.log('[ThemePlugin] Clean up complete');
  }
  
  /**
   * Create a default light theme
   * @returns Default theme configuration
   */
  private createDefaultTheme(): ThemeConfig {
    return {
      name: 'default',
      mode: 'light',
      colors: {
        primary: '#1976d2',
        secondary: '#dc004e',
        background: '#ffffff',
        surface: '#f5f5f5',
        error: '#f44336',
        text: '#212121',
      },
      typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        fontSize: '16px',
        fontWeightRegular: 400,
        fontWeightMedium: 500,
        fontWeightBold: 700,
        h1: {
          fontSize: '2.5rem',
          fontWeight: 300,
          lineHeight: 1.2,
        },
        h2: {
          fontSize: '2rem',
          fontWeight: 300,
          lineHeight: 1.2,
        },
        h3: {
          fontSize: '1.75rem',
          fontWeight: 400,
          lineHeight: 1.2,
        },
        body1: {
          fontSize: '1rem',
          fontWeight: 400,
          lineHeight: 1.5,
        },
        body2: {
          fontSize: '0.875rem',
          fontWeight: 400,
          lineHeight: 1.5,
        },
        button: {
          fontSize: '0.875rem',
          fontWeight: 500,
          lineHeight: 1.75,
        },
      },
      spacing: {
        unit: 'px',
        baseline: 8,
      },
      borders: {
        radius: '4px',
        width: '1px',
      },
      animation: {
        duration: {
          short: '250ms',
          medium: '350ms',
          long: '500ms',
        },
        easing: {
          easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
          easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
          easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
        },
      },
    };
  }
  
  /**
   * Create a dark theme variant from a light theme
   * @param lightTheme The light theme to base on
   * @returns Dark theme configuration
   */
  private createDarkTheme(lightTheme: ThemeConfig): ThemeConfig {
    const darkTheme = { ...lightTheme };
    
    darkTheme.name = `${lightTheme.name}-dark`;
    darkTheme.mode = 'dark';
    
    // Invert colors for dark mode
    darkTheme.colors = { ...lightTheme.colors };
    darkTheme.colors.background = '#121212';
    darkTheme.colors.surface = '#1e1e1e';
    darkTheme.colors.text = '#ffffff';
    
    // Lighten primary and secondary colors
    const lightenColor = (color: string): string => {
      // A simple way to lighten hex colors - in real implementation,
      // this would use a proper color manipulation library
      if (color.startsWith('#')) {
        return color; // Placeholder, would convert to HSL and increase lightness
      }
      return color;
    };
    
    darkTheme.colors.primary = lightenColor(lightTheme.colors.primary);
    darkTheme.colors.secondary = lightenColor(lightTheme.colors.secondary);
    
    return darkTheme;
  }
  
  /**
   * Check for styling issues in component code
   * @param code Component source code
   * @returns Array of styling issues
   */
  private checkStylingIssues(code: string): StylingIssue[] {
    const issues: StylingIssue[] = [];
    
    // Only check if design system enforcement is enabled
    if (!this.options.enforceDesignSystem) {
      return issues;
    }
    
    // Check for disallowed patterns
    this.options.disallowedPatterns?.forEach(pattern => {
      const regex = new RegExp(pattern, 'g');
      let match;
      
      while ((match = regex.exec(code)) !== null) {
        const matchedCode = match[0];
        
        let issue: StylingIssue | null = null;
        
        if (matchedCode.includes('#') || matchedCode.includes('rgb')) {
          // Hardcoded color
          issue = {
            type: 'color',
            description: 'Hardcoded color values should use theme colors',
            suggestedFix: `Use theme.colors instead, e.g. \${({ theme }) => theme.colors.primary}`,
            code: matchedCode,
            severity: 'error',
          };
        } else if (matchedCode.includes('font-size')) {
          // Hardcoded font size
          issue = {
            type: 'typography',
            description: 'Hardcoded font sizes should use theme typography',
            suggestedFix: `Use theme.typography instead, e.g. \${({ theme }) => theme.typography.body1.fontSize}`,
            code: matchedCode,
            severity: 'error',
          };
        } else if (matchedCode.includes('margin') || matchedCode.includes('padding')) {
          // Hardcoded spacing
          issue = {
            type: 'spacing',
            description: 'Hardcoded spacing values should use theme spacing',
            suggestedFix: `Use theme.spacing instead, e.g. \${({ theme }) => theme.spacing.baseline * 2}px`,
            code: matchedCode,
            severity: 'warning',
          };
        } else if (matchedCode.includes('style=')) {
          // Inline styles
          issue = {
            type: 'hardcoded',
            description: 'Inline styles should be avoided',
            suggestedFix: `Create a styled component or use className with CSS modules`,
            code: matchedCode,
            severity: 'warning',
          };
        }
        
        if (issue) {
          issues.push(issue);
        }
      }
    });
    
    return issues;
  }
  
  /**
   * Apply fixes for styling issues
   * @param code Original component code
   * @param issues Detected styling issues
   * @returns Fixed code
   */
  private fixStylingIssues(code: string, issues: StylingIssue[]): string {
    let fixedCode = code;
    
    // Apply simple replacements first
    for (const issue of issues) {
      if (issue.type === 'color' && issue.code.startsWith('#')) {
        // Try to match the hex color to a theme color
        const colorName = this.findClosestThemeColor(issue.code);
        if (colorName) {
          // Replace hex color with theme reference
          if (this.options.cssLibrary === 'styled-components') {
            fixedCode = fixedCode.replace(
              new RegExp(issue.code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
              `\${({ theme }) => theme.colors.${colorName}}`
            );
          } else if (this.options.cssLibrary === 'emotion') {
            fixedCode = fixedCode.replace(
              new RegExp(issue.code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
              `\${theme => theme.colors.${colorName}}`
            );
          }
        }
      }
    }
    
    // Add theme provider import if needed
    if (this.options.cssLibrary === 'styled-components' && 
        !fixedCode.includes('ThemeProvider') && 
        fixedCode.includes('${({ theme })')) {
      fixedCode = fixedCode.replace(
        /(import\s+.*\s+from\s+['"]styled-components['"];?)/,
        `$1\nimport { ThemeProvider } from 'styled-components';`
      );
    } else if (this.options.cssLibrary === 'emotion' && 
              !fixedCode.includes('ThemeProvider') && 
              fixedCode.includes('${theme =>')) {
      fixedCode = fixedCode.replace(
        /(import\s+.*\s+from\s+['"]@emotion\/styled['"];?)/,
        `$1\nimport { ThemeProvider } from '@emotion/react';`
      );
    }
    
    // Wrap the component with ThemeProvider if using theme properties
    if ((fixedCode.includes('${({ theme })') || fixedCode.includes('${theme =>')) && 
        !fixedCode.includes('<ThemeProvider')) {
      // Find the component's return statement to add ThemeProvider
      // This is a simplistic approach; a real implementation would use AST parsing
      const returnPattern = /(return\s*\(\s*<)/;
      if (returnPattern.test(fixedCode)) {
        fixedCode = fixedCode.replace(
          returnPattern,
          `return (\n    <ThemeProvider theme={themeContext?.currentTheme || defaultTheme}><`
        );
      }
      
      // Find the closing of the return statement to add closing ThemeProvider
      const closingPattern = /(\s*<\/[^>]+>\s*\)\s*;?\s*})/;
      if (closingPattern.test(fixedCode)) {
        fixedCode = fixedCode.replace(
          closingPattern,
          `</ThemeProvider>$1`
        );
      }
      
      // Add useContext for ThemeContext if needed
      if (!fixedCode.includes('useContext') && !fixedCode.includes('ThemeContext')) {
        // Add useContext to React import
        const reactImportPattern = /(import\s+React(?:,\s*\{([^}]*)\})?\s+from\s+['"]react['"];?)/;
        if (reactImportPattern.test(fixedCode)) {
          fixedCode = fixedCode.replace(
            reactImportPattern,
            (match, p1, p2) => {
              if (p2) {
                if (!p2.includes('useContext')) {
                  return p1.replace('{' + p2 + '}', '{' + p2 + ', useContext}');
                }
                return p1;
              }
              return `import React, { useContext } from 'react';`;
            }
          );
        }
        
        // Add ThemeContext import and usage
        const functionPattern = /function\s+(\w+)\([^)]*\)\s*{/;
        if (functionPattern.test(fixedCode)) {
          fixedCode = fixedCode.replace(
            functionPattern,
            (match, componentName) => {
              return `${match}\n  const themeContext = useContext(ThemeContext);\n  const defaultTheme = ${JSON.stringify(this.currentTheme, null, 2)};\n`;
            }
          );
        }
      }
    }
    
    return fixedCode;
  }
  
  /**
   * Find the closest theme color to a hex color
   * @param hexColor Hex color string
   * @returns Theme color key or null if no close match
   */
  private findClosestThemeColor(hexColor: string): string | null {
    // This is a simplified implementation - a real one would use color difference algorithms
    const colors = this.currentTheme.colors;
    
    // Simple exact match
    for (const [key, value] of Object.entries(colors)) {
      if (value.toLowerCase() === hexColor.toLowerCase()) {
        return key;
      }
    }
    
    // Return the primary color as a fallback
    return 'primary';
  }
  
  /**
   * Register a new theme
   * @param theme Theme configuration to register
   */
  registerTheme(theme: ThemeConfig): void {
    this.themes.set(theme.name, theme);
    console.log(`[ThemePlugin] Registered new theme: ${theme.name}`);
  }
  
  /**
   * Get a registered theme by name
   * @param name Theme name
   * @returns Theme configuration or null if not found
   */
  getTheme(name: string): ThemeConfig | null {
    return this.themes.get(name) || null;
  }
  
  /**
   * Get all registered themes
   * @returns Array of theme configurations
   */
  getAllThemes(): ThemeConfig[] {
    return Array.from(this.themes.values());
  }
  
  /**
   * Set the current active theme
   * @param name Name of the theme to activate
   * @returns Whether the theme was successfully activated
   */
  setTheme(name: string): boolean {
    const theme = this.themes.get(name);
    if (!theme) {
      return false;
    }
    
    this.currentTheme = theme;
    console.log(`[ThemePlugin] Switched to theme: ${name}`);
    return true;
  }
  
  /**
   * Get the current active theme
   * @returns Current theme configuration
   */
  getCurrentTheme(): ThemeConfig {
    return this.currentTheme;
  }
  
  /**
   * Toggle between light and dark mode
   * @returns Whether the toggle was successful
   */
  toggleDarkMode(): boolean {
    if (!this.options.supportDarkMode) {
      return false;
    }
    
    const currentMode = this.currentTheme.mode;
    const targetMode = currentMode === 'light' ? 'dark' : 'light';
    
    // Find a theme with the target mode
    const targetThemes = Array.from(this.themes.values())
      .filter(t => t.mode === targetMode);
      
    if (targetThemes.length === 0) {
      return false;
    }
    
    // Prefer a theme with the same base name
    const baseThemeName = this.currentTheme.name.replace('-dark', '');
    const matchingTheme = targetThemes.find(t => 
      t.name === baseThemeName || 
      t.name === `${baseThemeName}-dark`
    );
    
    if (matchingTheme) {
      this.currentTheme = matchingTheme;
    } else {
      // Fall back to the first theme of the target mode
      this.currentTheme = targetThemes[0];
    }
    
    console.log(`[ThemePlugin] Toggled to ${targetMode} mode: ${this.currentTheme.name}`);
    return true;
  }
  
  /**
   * Enable or disable design system enforcement
   * @param enabled Whether to enforce the design system
   */
  setEnforceDesignSystem(enabled: boolean): void {
    this.options.enforceDesignSystem = enabled;
  }
}

/**
 * Context for accessing theme in components
 */
export interface ThemeContextType {
  currentTheme: ThemeConfig;
  themes: ThemeConfig[];
  setTheme: (name: string) => void;
  toggleDarkMode: () => void;
}