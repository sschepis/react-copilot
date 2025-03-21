import {
  StyleApproach,
  StyleGeneratorOptions,
  StyleGenerationResult,
  TypographyOptions,
  ColorScheme,
  SpacingOptions
} from '../types';
import { StyleGeneratorBase } from '../StyleGeneratorBase';

/**
 * Generates plain CSS styles
 */
export class CssStyleGenerator extends StyleGeneratorBase {
  constructor() {
    super(StyleApproach.CSS);
  }
  
  /**
   * Generate CSS styles based on the provided options
   */
  generateStyles(
    options: StyleGeneratorOptions,
    componentProps?: Record<string, any>
  ): StyleGenerationResult {
    const validatedOptions = this.validateOptions(options);
    
    // Build CSS code
    let cssCode = this.generateCssVariables(validatedOptions);
    cssCode += this.generateBaseStyles(validatedOptions);
    
    if (componentProps) {
      cssCode += this.generateComponentStyles(validatedOptions, componentProps);
    }
    
    if (validatedOptions.includeDarkMode) {
      cssCode += this.generateDarkModeStyles(validatedOptions);
    }
    
    if (validatedOptions.includeResponsive) {
      cssCode += this.generateResponsiveStyles(validatedOptions);
    }
    
    if (validatedOptions.includeAnimations) {
      cssCode += this.generateAnimationStyles(validatedOptions);
    }
    
    if (validatedOptions.customStyles) {
      cssCode += this.generateCustomStyles(validatedOptions.customStyles);
    }
    
    return {
      styleContent: cssCode,
      styleImports: '',
      styleFilePath: `src/styles/${validatedOptions.approach}.css`,
      componentModifications: '',
      approach: StyleApproach.CSS
    };
  }
  
  /**
   * Generate CSS variables from options
   */
  private generateCssVariables(options: StyleGeneratorOptions): string {
    let variables = ':root {\n';
    
    // Add color variables
    if (options.colors) {
      const colors = options.colors;
      Object.entries(colors).forEach(([name, value]) => {
        if (typeof value === 'string') {
          variables += `  --color-${name}: ${this.formatColor(value)};\n`;
        }
      });
      
      // Add custom color variables if they exist
      if (colors.custom) {
        Object.entries(colors.custom).forEach(([colorName, value]) => {
          variables += `  --color-${colorName}: ${this.formatColor(value)};\n`;
        });
      }
    }
    
    // Add typography variables
    if (options.typography) {
      const typography = options.typography;
      
      if (typography.fontFamily) {
        const fontFamily = Array.isArray(typography.fontFamily)
          ? typography.fontFamily.join(', ')
          : typography.fontFamily;
        variables += `  --font-family: ${fontFamily};\n`;
      }
      
      if (typography.fontSizes) {
        Object.entries(typography.fontSizes).forEach(([name, value]) => {
          variables += `  --font-size-${name}: ${value};\n`;
        });
      }
      
      if (typography.fontWeights) {
        Object.entries(typography.fontWeights).forEach(([name, value]) => {
          variables += `  --font-weight-${name}: ${value};\n`;
        });
      }
    }
    
    // Add spacing variables
    if (options.spacing && options.spacing.scale) {
      Object.entries(options.spacing.scale).forEach(([name, value]) => {
        variables += `  --spacing-${name}: ${this.formatSpacing(value)};\n`;
      });
    }
    
    // Add breakpoint variables
    if (options.breakpoints) {
      Object.entries(options.breakpoints).forEach(([name, value]) => {
        variables += `  --breakpoint-${name}: ${value};\n`;
      });
    }
    
    // Add custom token variables
    if (options.customTokens) {
      Object.entries(options.customTokens).forEach(([name, value]) => {
        if (typeof value === 'string' || typeof value === 'number') {
          variables += `  --${name}: ${value};\n`;
        }
      });
    }
    
    variables += '}\n\n';
    return variables;
  }
  
  /**
   * Generate base styles from options
   */
  private generateBaseStyles(options: StyleGeneratorOptions): string {
    let styles = '/* Base styles */\n';
    
    styles += 'body {\n';
    if (options.colors?.background) {
      styles += `  background-color: var(--color-background);\n`;
    }
    if (options.colors?.text) {
      styles += `  color: var(--color-text);\n`;
    }
    if (options.typography?.fontFamily) {
      styles += `  font-family: var(--font-family);\n`;
    }
    styles += '}\n\n';
    
    // Add more base styles as needed
    
    return styles;
  }
  
  /**
   * Generate component-specific styles based on component props
   */
  private generateComponentStyles(
    options: StyleGeneratorOptions,
    componentProps: Record<string, any>
  ): string {
    let styles = '/* Component styles */\n';
    
    // Generate class for component
    styles += `.component {\n`;
    
    // Add component-specific styles based on props
    if (componentProps.padding) {
      styles += `  padding: ${this.formatSpacing(componentProps.padding)};\n`;
    }
    
    if (componentProps.margin) {
      styles += `  margin: ${this.formatSpacing(componentProps.margin)};\n`;
    }
    
    if (componentProps.width) {
      styles += `  width: ${componentProps.width};\n`;
    }
    
    if (componentProps.height) {
      styles += `  height: ${componentProps.height};\n`;
    }
    
    styles += '}\n\n';
    
    return styles;
  }
  
  /**
   * Generate dark mode styles
   */
  private generateDarkModeStyles(options: StyleGeneratorOptions): string {
    let styles = '/* Dark mode styles */\n';
    
    styles += '@media (prefers-color-scheme: dark) {\n';
    styles += '  :root {\n';
    
    // Add dark mode color overrides
    styles += '    --color-background: #121212;\n';
    styles += '    --color-text: #f8f8f8;\n';
    
    // Additional dark mode variables would go here
    
    styles += '  }\n';
    styles += '}\n\n';
    
    return styles;
  }
  
  /**
   * Generate responsive styles
   */
  private generateResponsiveStyles(options: StyleGeneratorOptions): string {
    let styles = '';
    
    if (options.breakpoints) {
      styles += '/* Responsive styles */\n';
      
      // Generate media queries for each breakpoint
      Object.entries(options.breakpoints).forEach(([name, value]) => {
        styles += `@media (min-width: ${value}) {\n`;
        styles += `  /* Styles for ${name} breakpoint */\n`;
        styles += `}\n\n`;
      });
    }
    
    return styles;
  }
  
  /**
   * Generate animation styles
   */
  private generateAnimationStyles(options: StyleGeneratorOptions): string {
    let styles = '/* Animation styles */\n';
    
    // Define some common animations
    styles += '@keyframes fadeIn {\n';
    styles += '  from { opacity: 0; }\n';
    styles += '  to { opacity: 1; }\n';
    styles += '}\n\n';
    
    styles += '@keyframes slideIn {\n';
    styles += '  from { transform: translateY(20px); opacity: 0; }\n';
    styles += '  to { transform: translateY(0); opacity: 1; }\n';
    styles += '}\n\n';
    
    // Animation utility classes
    styles += '.fade-in {\n';
    styles += '  animation: fadeIn 0.3s ease-in-out;\n';
    styles += '}\n\n';
    
    styles += '.slide-in {\n';
    styles += '  animation: slideIn 0.3s ease-in-out;\n';
    styles += '}\n\n';
    
    return styles;
  }
  
  /**
   * Generate custom styles from custom style blocks
   */
  private generateCustomStyles(customStyles: Record<string, string>): string {
    let styles = '/* Custom styles */\n';
    
    Object.entries(customStyles).forEach(([selector, styleBlock]) => {
      styles += `${selector} {\n${styleBlock}\n}\n\n`;
    });
    
    return styles;
  }
}