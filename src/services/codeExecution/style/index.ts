/**
 * Style Generation Module
 * 
 * A modular approach to generating styles for different styling paradigms
 * and frameworks.
 */

// Export types for external use
export * from './types';

// Export base functionality
export * from './StyleGeneratorBase';
export * from './StyleGeneratorFactory';
export * from './StyleUtils';

// Export concrete generators
export * from './generators/CssStyleGenerator';
export * from './generators/StyledComponentsGenerator';

// Additional generators will be exported here as they are implemented
// export * from './generators/ScssStyleGenerator';
// export * from './generators/TailwindStyleGenerator';
// export * from './generators/MaterialUIStyleGenerator';
// ...

/**
 * Main function to generate styles based on approach
 */
import { StyleGeneratorFactory } from './StyleGeneratorFactory';
import { StyleGeneratorOptions, StyleGeneratorResult, StyleApproach } from './types';

/**
 * Generate styles using the appropriate style generator
 * 
 * @param options Style generation options
 * @param componentProps Optional component props to influence style generation
 * @returns Generated style code and related metadata
 */
export function generateStyles(
  options: StyleGeneratorOptions,
  componentProps?: Record<string, any>
): StyleGeneratorResult {
  const generator = StyleGeneratorFactory.getGenerator(options.approach);
  return generator.generateStyles(options, componentProps);
}

/**
 * Generate a theme file for the specified styling approach
 * 
 * @param options Style generation options
 * @returns Generated theme code and related metadata, or null if not supported
 */
export function generateTheme(options: StyleGeneratorOptions): StyleGeneratorResult | null {
  const generator = StyleGeneratorFactory.getGenerator(options.approach);
  if (typeof generator.generateTheme === 'function') {
    return generator.generateTheme(options);
  }
  return null;
}

/**
 * Check if a specific feature is supported by a style approach
 * 
 * @param approach The styling approach to check
 * @param feature The feature name to check support for
 * @returns True if the feature is supported, false otherwise
 */
export function supportsFeature(approach: StyleApproach, feature: string): boolean {
  const generator = StyleGeneratorFactory.getGenerator(approach);
  return generator.supportsFeature(feature);
}

/**
 * Register a custom style generator
 * 
 * @param approach The styling approach to register
 * @param generator The generator implementation
 */
export function registerCustomGenerator(approach: StyleApproach, generator: any): void {
  StyleGeneratorFactory.registerGenerator(approach, generator);
}