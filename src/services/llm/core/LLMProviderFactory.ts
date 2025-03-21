import { ILLMProvider, LLMProviderConfig, LLMProviderType } from './types';
import { LLMProviderBase } from './LLMProviderBase';

/**
 * Type for a provider constructor
 */
type LLMProviderConstructor = new (...args: any[]) => ILLMProvider;

/**
 * Factory for creating LLM provider instances
 */
export class LLMProviderFactory {
  private static providerConstructors: Map<string, LLMProviderConstructor> = new Map();
  private static defaultProvidersByType: Map<LLMProviderType, string> = new Map();
  
  /**
   * Register a provider constructor
   * 
   * @param providerId The unique ID for this provider type
   * @param constructor The constructor function
   * @param isDefault Whether this should be the default for its provider type
   */
  static registerProviderType(
    providerId: string,
    constructor: LLMProviderConstructor,
    isDefault: boolean = false
  ): void {
    this.providerConstructors.set(providerId, constructor);
    
    // If this is marked as default or no default exists for this type
    if (isDefault) {
      // Create a temporary instance to get its type
      const tempInstance = new constructor();
      this.defaultProvidersByType.set(tempInstance.type, providerId);
    }
  }
  
  /**
   * Create a provider instance by its ID
   * 
   * @param providerId The ID of the provider to create
   * @param config Optional configuration to initialize with
   * @returns The provider instance
   */
  static createProvider(providerId: string, config?: LLMProviderConfig): ILLMProvider {
    const Constructor = this.providerConstructors.get(providerId);
    
    if (!Constructor) {
      throw new Error(`Provider type '${providerId}' is not registered`);
    }
    
    const provider = new Constructor();
    
    // If configuration is provided, initialize the provider
    if (config) {
      // We'll initialize asynchronously, but return the provider instance immediately
      // Clients can await the initialization using isAvailable() if needed
      provider.initialize(config).catch(error => {
        console.error(`Failed to initialize provider ${providerId}:`, error);
      });
    }
    
    return provider;
  }
  
  /**
   * Create a provider instance by provider type (using the default provider for that type)
   * 
   * @param type The type of provider to create
   * @param config Optional configuration to initialize with
   * @returns The provider instance
   */
  static createProviderByType(type: LLMProviderType, config?: LLMProviderConfig): ILLMProvider {
    const defaultProviderId = this.defaultProvidersByType.get(type);
    
    if (!defaultProviderId) {
      throw new Error(`No default provider registered for type '${type}'`);
    }
    
    return this.createProvider(defaultProviderId, config);
  }
  
  /**
   * Get all registered provider IDs
   * 
   * @returns Array of provider IDs
   */
  static getAllProviderIds(): string[] {
    return Array.from(this.providerConstructors.keys());
  }
  
  /**
   * Get provider IDs by type
   * 
   * @param type The provider type to filter by
   * @returns Array of provider IDs matching the type
   */
  static getProviderIdsByType(type: LLMProviderType): string[] {
    const result: string[] = [];
    
    // This is inefficient but works for our use case with a limited number of providers
    // For performance-critical applications, we'd maintain a separate map by type
    for (const providerId of this.providerConstructors.keys()) {
      const Constructor = this.providerConstructors.get(providerId)!;
      const tempInstance = new Constructor();
      
      if (tempInstance.type === type) {
        result.push(providerId);
      }
    }
    
    return result;
  }
  
  /**
   * Get the default provider ID for a type
   * 
   * @param type The provider type
   * @returns The default provider ID, or undefined if none
   */
  static getDefaultProviderIdForType(type: LLMProviderType): string | undefined {
    return this.defaultProvidersByType.get(type);
  }
  
  /**
   * Set a provider as the default for its type
   * 
   * @param providerId The provider ID to set as default
   */
  static setDefaultProviderForType(providerId: string): void {
    const Constructor = this.providerConstructors.get(providerId);
    
    if (!Constructor) {
      throw new Error(`Provider type '${providerId}' is not registered`);
    }
    
    const tempInstance = new Constructor();
    this.defaultProvidersByType.set(tempInstance.type, providerId);
  }
  
  /**
   * Check if a provider type is registered
   * 
   * @param providerId The provider ID to check
   * @returns Whether the provider is registered
   */
  static hasProvider(providerId: string): boolean {
    return this.providerConstructors.has(providerId);
  }
  
  /**
   * Unregister a provider type
   * 
   * @param providerId The provider ID to unregister
   * @returns Whether the provider was unregistered
   */
  static unregisterProviderType(providerId: string): boolean {
    const Constructor = this.providerConstructors.get(providerId);
    
    if (!Constructor) {
      return false;
    }
    
    // Check if this is a default provider for its type
    const tempInstance = new Constructor();
    const defaultId = this.defaultProvidersByType.get(tempInstance.type);
    
    if (defaultId === providerId) {
      this.defaultProvidersByType.delete(tempInstance.type);
    }
    
    return this.providerConstructors.delete(providerId);
  }
}