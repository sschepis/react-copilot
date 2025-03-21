import {
  StyleApproach,
  StyleGeneratorOptions,
  StyleGenerationResult,
  IStyleGenerator
} from './types';

/**
 * Base abstract class for style generators
 * Provides common functionality for all style generators
 */
export abstract class StyleGeneratorBase implements IStyleGenerator {
  protected approach: StyleApproach;
  
  constructor(approach: StyleApproach) {
    this.approach = approach;
  }
  
  /**
   * Generate styles based on provided options and component props
   * This method must be implemented by specific style generators
   */
  abstract generateStyles(
    options: StyleGeneratorOptions,
    componentProps?: Record<string, any>
  ): StyleGenerationResult;
  
  /**
   * Generate theme file if applicable
   * Default implementation returns null (no theme file)
   */
  generateTheme(options: StyleGeneratorOptions): StyleGenerationResult | null {
    return null;
  }
  
  /**
   * Check if the generator supports a specific feature
   * Override in specific generators for more precise feature support
   */
  supportsFeature(feature: string): boolean {
    switch (feature) {
      case 'darkMode':
        return true;
      case 'animations':
        return true;
      case 'responsive':
        return true;
      case 'accessibility':
        return true;
      default:
        return false;
    }
  }
  
  /**
   * Format color value consistently across generators
   */
  protected formatColor(color: string): string {
    // Common color formatting logic
    if (color.startsWith('#') || color.startsWith('rgb') || color.startsWith('hsl')) {
      return color;
    }
    return `#${color}`;
  }
  
  /**
   * Format spacing value consistently across generators
   */
  protected formatSpacing(value: string | number): string {
    // Common spacing formatting logic
    if (typeof value === 'number') {
      return `${value}px`;
    }
    return value;
  }
  
  /**
   * Generate a CSS comment block
   */
  protected createCommentBlock(text: string): string {
    return `/**\n * ${text.split('\n').join('\n * ')}\n */`;
  }
  
  /**
   * Validate style options and provide defaults
   */
  protected validateOptions(options: StyleGeneratorOptions): StyleGeneratorOptions {
    // Common validation and defaults
    return {
      ...options,
      typography: {
        fontFamily: 'system-ui, sans-serif',
        ...options.typography
      },
      colors: {
        primary: '#3b82f6',
        secondary: '#6b7280',
        background: '#ffffff',
        text: '#1f2937',
        ...options.colors
      },
      spacing: {
        baseUnit: '1rem',
        ...options.spacing
      }
    };
  }
}