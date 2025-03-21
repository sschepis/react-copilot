import { StyleApproach, IStyleGenerator } from './types';
import { CssStyleGenerator } from './generators/CssStyleGenerator';
import { StyledComponentsGenerator } from './generators/StyledComponentsGenerator';

/**
 * Factory for creating appropriate style generators
 */
export class StyleGeneratorFactory {
  private static generators: Map<StyleApproach, IStyleGenerator> = new Map();
  
  /**
   * Get a style generator for the specified approach
   */
  static getGenerator(approach: StyleApproach): IStyleGenerator {
    // Return cached generator if it exists
    if (this.generators.has(approach)) {
      return this.generators.get(approach)!;
    }
    
    // Create a new generator based on the approach
    let generator: IStyleGenerator;
    
    switch (approach) {
      case StyleApproach.CSS:
        generator = new CssStyleGenerator();
        break;
      case StyleApproach.STYLED_COMPONENTS:
        generator = new StyledComponentsGenerator();
        break;
      // TODO: Add more generators as they are implemented
      // case StyleApproach.SCSS:
      //   generator = new ScssStyleGenerator();
      //   break;
      // case StyleApproach.TAILWIND:
      //   generator = new TailwindStyleGenerator();
      //   break;
      default:
        // Default to CSS generator if no specific one is available
        console.warn(`No style generator available for approach: ${approach}. Using CSS generator instead.`);
        generator = new CssStyleGenerator();
        break;
    }
    
    // Cache and return the generator
    this.generators.set(approach, generator);
    return generator;
  }
  
  /**
   * Register a custom generator
   */
  static registerGenerator(approach: StyleApproach, generator: IStyleGenerator): void {
    this.generators.set(approach, generator);
  }
  
  /**
   * Clear all registered generators
   */
  static clearGenerators(): void {
    this.generators.clear();
  }
}