import { CodeSource, IPropTypeInferencer } from './types';
import { ReactPropTypeInferencer } from './inferencers/ReactPropTypeInferencer';

/**
 * Factory for creating appropriate prop type inferencers
 */
export class PropTypeInferencerFactory {
  private static inferencers: Map<string, IPropTypeInferencer> = new Map();
  private static defaultInferencer: IPropTypeInferencer | null = null;
  
  /**
   * Initialize default inferencers
   * Called automatically when the factory is first used
   */
  private static initialize(): void {
    if (this.inferencers.size > 0) return; // Already initialized
    
    // Register default inferencers
    this.registerInferencer(new ReactPropTypeInferencer());
    
    // Set default inferencer
    this.defaultInferencer = this.inferencers.get('ReactPropTypeInferencer') || null;
  }
  
  /**
   * Register an inferencer
   */
  static registerInferencer(inferencer: IPropTypeInferencer): void {
    this.inferencers.set(inferencer.name, inferencer);
  }
  
  /**
   * Set the default inferencer
   */
  static setDefaultInferencer(inferencer: IPropTypeInferencer): void {
    this.defaultInferencer = inferencer;
  }
  
  /**
   * Get an inferencer that can handle a specific code source
   */
  static getInferencer(code: CodeSource, componentType: string = 'react-component'): IPropTypeInferencer {
    this.initialize();
    
    // Try to find an inferencer that can handle this code
    for (const inferencer of this.inferencers.values()) {
      if (inferencer.canInferPropTypes(code, componentType)) {
        return inferencer;
      }
    }
    
    // If no specific inferencer found, use the default
    if (this.defaultInferencer) {
      return this.defaultInferencer;
    }
    
    // If no default inferencer, throw an error
    throw new Error(`No inferencer found for component type ${componentType}`);
  }
  
  /**
   * Get an inferencer by name
   */
  static getInferencerByName(name: string): IPropTypeInferencer | null {
    this.initialize();
    return this.inferencers.get(name) || null;
  }
  
  /**
   * Get an inferencer for a specific component type
   */
  static getInferencerForComponentType(componentType: string): IPropTypeInferencer | null {
    this.initialize();
    
    // Find an inferencer that supports this component type
    for (const inferencer of this.inferencers.values()) {
      if (inferencer.supportedComponentTypes.includes(componentType)) {
        return inferencer;
      }
    }
    
    return null;
  }
  
  /**
   * Get all registered inferencers
   */
  static getAllInferencers(): IPropTypeInferencer[] {
    this.initialize();
    return Array.from(this.inferencers.values());
  }
  
  /**
   * Clear all registered inferencers
   */
  static clearInferencers(): void {
    this.inferencers.clear();
    this.defaultInferencer = null;
  }
}