import { CodeToTest, ITestGenerator, TestFramework, TestType } from './types';

/**
 * Factory for creating appropriate test generators
 */
export class TestGeneratorFactory {
  private static generators: Map<string, ITestGenerator> = new Map();
  private static defaultGenerator: ITestGenerator | null = null;
  
  /**
   * Initialize default generators
   * Called automatically when the factory is first used
   */
  private static initialize(): void {
    if (this.generators.size > 0) return; // Already initialized
    
    // Register default generators
    // Will be added when they are implemented
    // this.registerGenerator(new ReactComponentTestGenerator());
    // this.registerGenerator(new FunctionTestGenerator());
    
    // Set default generator
    // Will be set when a default generator is implemented
    // this.defaultGenerator = this.generators.get('ReactComponentTestGenerator') || null;
  }
  
  /**
   * Register a generator
   */
  static registerGenerator(generator: ITestGenerator): void {
    this.generators.set(generator.name, generator);
  }
  
  /**
   * Set the default generator
   */
  static setDefaultGenerator(generator: ITestGenerator): void {
    this.defaultGenerator = generator;
  }
  
  /**
   * Get a generator that can handle a specific code item
   */
  static getGenerator(
    code: CodeToTest, 
    framework: TestFramework = TestFramework.JEST, 
    testType: TestType = TestType.UNIT
  ): ITestGenerator {
    this.initialize();
    
    // Try to find a generator that can handle this code
    for (const generator of this.generators.values()) {
      if (generator.canGenerateTests(code, framework, testType)) {
        return generator;
      }
    }
    
    // If no specific generator found, use the default
    if (this.defaultGenerator) {
      return this.defaultGenerator;
    }
    
    // If no default generator, throw an error
    throw new Error(`No generator found for code with framework ${framework} and test type ${testType}`);
  }
  
  /**
   * Get a generator by name
   */
  static getGeneratorByName(name: string): ITestGenerator | null {
    this.initialize();
    return this.generators.get(name) || null;
  }
  
  /**
   * Get a generator for a specific framework and test type
   */
  static getGeneratorForFrameworkAndType(
    framework: TestFramework, 
    testType: TestType
  ): ITestGenerator | null {
    this.initialize();
    
    // Find a generator that supports this framework and test type
    for (const generator of this.generators.values()) {
      if (generator.supportedFrameworks.includes(framework) && 
          generator.supportedTestTypes.includes(testType)) {
        return generator;
      }
    }
    
    return null;
  }
  
  /**
   * Get all registered generators
   */
  static getAllGenerators(): ITestGenerator[] {
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
  
  /**
   * Get all supported frameworks across all generators
   */
  static getSupportedFrameworks(): TestFramework[] {
    this.initialize();
    
    const frameworks = new Set<TestFramework>();
    
    for (const generator of this.generators.values()) {
      generator.supportedFrameworks.forEach(framework => frameworks.add(framework));
    }
    
    return Array.from(frameworks);
  }
  
  /**
   * Get all supported test types across all generators
   */
  static getSupportedTestTypes(): TestType[] {
    this.initialize();
    
    const testTypes = new Set<TestType>();
    
    for (const generator of this.generators.values()) {
      generator.supportedTestTypes.forEach(testType => testTypes.add(testType));
    }
    
    return Array.from(testTypes);
  }
}