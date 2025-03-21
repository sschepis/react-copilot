import { CodeToDocument, CodeType, IDocumentationGenerator } from './types';

/**
 * Factory for creating appropriate documentation generators
 */
export class DocumentationGeneratorFactory {
  private static generators: Map<string, IDocumentationGenerator> = new Map();
  private static defaultGenerator: IDocumentationGenerator | null = null;
  
  /**
   * Initialize default generators
   * Called automatically when the factory is first used
   */
  private static initialize(): void {
    if (this.generators.size > 0) return; // Already initialized
    
    // Register default generators
    // Will be added when they are implemented
    // this.registerGenerator(new ReactComponentDocumentationGenerator());
    // this.registerGenerator(new FunctionDocumentationGenerator());
    
    // Set default generator
    // Will be set when a default generator is implemented
    // this.defaultGenerator = this.generators.get('FunctionDocumentationGenerator') || null;
  }
  
  /**
   * Register a generator
   */
  static registerGenerator(generator: IDocumentationGenerator): void {
    this.generators.set(generator.name, generator);
  }
  
  /**
   * Set the default generator
   */
  static setDefaultGenerator(generator: IDocumentationGenerator): void {
    this.defaultGenerator = generator;
  }
  
  /**
   * Get a generator that can handle a specific code item
   */
  static getGenerator(code: CodeToDocument): IDocumentationGenerator {
    this.initialize();
    
    // Try to find a generator that can handle this code
    for (const generator of this.generators.values()) {
      if (generator.canDocument(code)) {
        return generator;
      }
    }
    
    // If no specific generator found, use the default
    if (this.defaultGenerator) {
      return this.defaultGenerator;
    }
    
    // If no default generator, throw an error
    throw new Error(`No generator found for code of type ${code.codeType || 'unknown'}`);
  }
  
  /**
   * Get a generator by name
   */
  static getGeneratorByName(name: string): IDocumentationGenerator | null {
    this.initialize();
    return this.generators.get(name) || null;
  }
  
  /**
   * Get a generator for a specific code type
   */
  static getGeneratorForType(codeType: CodeType): IDocumentationGenerator | null {
    this.initialize();
    
    // Find a generator that supports this code type
    for (const generator of this.generators.values()) {
      if (generator.supportedCodeTypes.includes(codeType)) {
        return generator;
      }
    }
    
    return null;
  }
  
  /**
   * Get all registered generators
   */
  static getAllGenerators(): IDocumentationGenerator[] {
    this.initialize();
    return Array.from(this.generators.values());
  }
  
  /**
   * Clear all registered generators
   */
  static clearGenerators(): void {
    this.generators.clear();
    this.defaultGenerator = null;
  }
}