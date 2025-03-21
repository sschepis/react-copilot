/**
 * Adapter for maintaining compatibility with the original StyleGenerator API
 * This allows existing code to continue working while transitioning to the new architecture
 */

import * as ts from 'typescript';
import { InferredProp } from './PropTypeInference';
import {
  StyleApproach,
  StyleGeneratorOptions,
  StyleGeneratorResult,
  generateStyles,
  generateTheme,
  supportsFeature,
  StyleUtils
} from './style';

/**
 * @deprecated Use the modular style generation system from the 'style' directory instead
 */
export class StyleGenerator {
  /**
   * Generate styles for a component
   * 
   * @deprecated Use generateStyles from the style module instead
   */
  static generateStyles(
    approach: StyleApproach,
    componentName: string,
    props: Record<string, InferredProp>,
    options: Partial<Omit<StyleGeneratorOptions, 'approach'>> = {}
  ): string {
    console.warn(
      'StyleGenerator.generateStyles is deprecated. ' + 
      'Use generateStyles from the style module instead.'
    );
    
    // Convert old format props to the new format
    const componentProps: Record<string, any> = {};
    Object.entries(props).forEach(([key, value]) => {
      componentProps[key] = value.defaultValue || value.type;
    });
    
    // Merge options with approach
    const generatorOptions: StyleGeneratorOptions = {
      approach,
      ...options,
    };
    
    // Use the new system to generate styles
    const result = generateStyles(generatorOptions, componentProps);
    return result.code;
  }
  
  /**
   * Generate a theme for the specified approach
   * 
   * @deprecated Use generateTheme from the style module instead
   */
  static generateTheme(
    approach: StyleApproach,
    options: Partial<Omit<StyleGeneratorOptions, 'approach'>> = {}
  ): string | null {
    console.warn(
      'StyleGenerator.generateTheme is deprecated. ' + 
      'Use generateTheme from the style module instead.'
    );
    
    // Merge options with approach
    const generatorOptions: StyleGeneratorOptions = {
      approach,
      ...options,
    };
    
    // Use the new system to generate a theme
    const result = generateTheme(generatorOptions);
    return result ? result.code : null;
  }
  
  /**
   * Detect the most appropriate style approach based on project configuration
   * 
   * @deprecated Use StyleUtils.detectStyleApproach from the style module instead
   */
  static detectApproach(ast: ts.SourceFile, dependencies: string[]): StyleApproach {
    console.warn(
      'StyleGenerator.detectApproach is deprecated. ' + 
      'Use StyleUtils.detectStyleApproach from the style module instead.'
    );
    
    return StyleUtils.detectStyleApproach(ast, dependencies);
  }
  
  /**
   * Check if a specific feature is supported by a style approach
   * 
   * @deprecated Use supportsFeature from the style module instead
   */
  static supportsFeature(approach: StyleApproach, feature: string): boolean {
    console.warn(
      'StyleGenerator.supportsFeature is deprecated. ' + 
      'Use supportsFeature from the style module instead.'
    );
    
    return supportsFeature(approach, feature);
  }
  
  /**
   * Extract meaningful property names from component props
   * 
   * @deprecated Use StyleUtils.inferPropertyName from the style module instead
   */
  static inferPropertyNames(props: Record<string, InferredProp>): Record<string, string> {
    console.warn(
      'StyleGenerator.inferPropertyNames is deprecated. ' + 
      'Use StyleUtils.inferPropertyName from the style module instead.'
    );
    
    const result: Record<string, string> = {};
    
    Object.entries(props).forEach(([key, value]) => {
      if (value.defaultValue) {
        result[key] = StyleUtils.inferPropertyName(value.defaultValue, key);
      } else {
        result[key] = key;
      }
    });
    
    return result;
  }
}