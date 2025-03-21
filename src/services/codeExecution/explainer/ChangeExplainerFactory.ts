import { ChangeType, CodeChange, IChangeExplainer } from './types';
import { ModificationExplainer } from './explainers/ModificationExplainer';

/**
 * Factory for creating appropriate change explainers
 */
export class ChangeExplainerFactory {
  private static explainers: Map<string, IChangeExplainer> = new Map();
  private static defaultExplainer: IChangeExplainer | null = null;
  
  /**
   * Initialize default explainers
   * Called automatically when the factory is first used
   */
  private static initialize(): void {
    if (this.explainers.size > 0) return; // Already initialized
    
    // Register default explainers
    this.registerExplainer(new ModificationExplainer());
    
    // Set the modification explainer as the default
    this.defaultExplainer = this.explainers.get('ModificationExplainer') || null;
  }
  
  /**
   * Register an explainer
   */
  static registerExplainer(explainer: IChangeExplainer): void {
    this.explainers.set(explainer.name, explainer);
  }
  
  /**
   * Set the default explainer
   */
  static setDefaultExplainer(explainer: IChangeExplainer): void {
    this.defaultExplainer = explainer;
  }
  
  /**
   * Get an explainer that can handle a specific change
   */
  static getExplainer(change: CodeChange): IChangeExplainer {
    this.initialize();
    
    // Try to find an explainer that can handle this change
    for (const explainer of this.explainers.values()) {
      if (explainer.canExplain(change)) {
        return explainer;
      }
    }
    
    // If no specific explainer found, use the default
    if (this.defaultExplainer) {
      return this.defaultExplainer;
    }
    
    // If no default explainer, throw an error
    throw new Error(`No explainer found for change of type ${change.type || 'unknown'}`);
  }
  
  /**
   * Get an explainer by name
   */
  static getExplainerByName(name: string): IChangeExplainer | null {
    this.initialize();
    return this.explainers.get(name) || null;
  }
  
  /**
   * Get an explainer for a specific change type
   */
  static getExplainerForType(changeType: ChangeType): IChangeExplainer | null {
    this.initialize();
    
    // Find an explainer that supports this change type
    for (const explainer of this.explainers.values()) {
      if ((explainer as any).supportedChangeTypes?.includes(changeType)) {
        return explainer;
      }
    }
    
    return null;
  }
  
  /**
   * Get all registered explainers
   */
  static getAllExplainers(): IChangeExplainer[] {
    this.initialize();
    return Array.from(this.explainers.values());
  }
  
  /**
   * Clear all registered explainers
   */
  static clearExplainers(): void {
    this.explainers.clear();
    this.defaultExplainer = null;
  }
}