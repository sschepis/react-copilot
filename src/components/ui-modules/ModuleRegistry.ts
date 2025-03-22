import { UIModule } from './types';

/**
 * Registry for UI modules.
 * Provides functionality to register, retrieve, and manage UI modules.
 */
export class ModuleRegistry {
  private static instance: ModuleRegistry;
  private modules: Map<string, UIModule> = new Map();

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {}

  /**
   * Get the singleton instance of the ModuleRegistry
   */
  public static getInstance(): ModuleRegistry {
    if (!ModuleRegistry.instance) {
      ModuleRegistry.instance = new ModuleRegistry();
    }
    return ModuleRegistry.instance;
  }

  /**
   * Register a new UI module
   * @param module The module to register
   * @throws Error if a module with the same ID already exists
   */
  public register(module: UIModule): void {
    if (this.modules.has(module.id)) {
      throw new Error(`Module with ID ${module.id} already exists`);
    }
    this.modules.set(module.id, module);
  }

  /**
   * Register multiple modules at once
   * @param modules Array of modules to register
   */
  public registerMany(modules: UIModule[]): void {
    modules.forEach(module => this.register(module));
  }

  /**
   * Get a module by ID
   * @param id Module ID
   * @returns The module or undefined if not found
   */
  public getModule(id: string): UIModule | undefined {
    return this.modules.get(id);
  }

  /**
   * Get all registered modules
   * @returns Array of all registered modules
   */
  public getAllModules(): UIModule[] {
    return Array.from(this.modules.values());
  }

  /**
   * Get modules filtered by a predicate function
   * @param predicate Function to filter modules
   * @returns Array of modules that match the predicate
   */
  public getFilteredModules(predicate: (module: UIModule) => boolean): UIModule[] {
    return this.getAllModules().filter(predicate);
  }

  /**
   * Get modules by category
   * @param category Category to filter by
   * @returns Array of modules in the specified category
   */
  public getModulesByCategory(category: string): UIModule[] {
    return this.getFilteredModules(module => module.category === category);
  }

  /**
   * Check if a module exists
   * @param id Module ID
   * @returns True if the module exists
   */
  public hasModule(id: string): boolean {
    return this.modules.has(id);
  }

  /**
   * Unregister a module
   * @param id Module ID
   * @returns True if the module was unregistered
   */
  public unregister(id: string): boolean {
    return this.modules.delete(id);
  }

  /**
   * Clear all registered modules
   */
  public clear(): void {
    this.modules.clear();
  }

  /**
   * Filter modules based on include/exclude lists
   * @param include Optional array of module IDs to include
   * @param exclude Optional array of module IDs to exclude
   * @returns Array of filtered modules
   */
  public filterModules(include?: string[], exclude?: string[]): UIModule[] {
    let filteredModules = this.getAllModules();

    // Apply include filter if specified
    if (include && include.length > 0) {
      filteredModules = filteredModules.filter(module => include.includes(module.id));
    }

    // Apply exclude filter if specified
    if (exclude && exclude.length > 0) {
      filteredModules = filteredModules.filter(module => !exclude.includes(module.id));
    }

    return filteredModules;
  }

  /**
   * Check if all dependencies for a module are available
   * @param moduleId Module ID to check dependencies for
   * @returns True if all dependencies are available
   */
  public areDependenciesSatisfied(moduleId: string): boolean {
    const module = this.getModule(moduleId);
    if (!module || !module.dependencies || module.dependencies.length === 0) {
      return true;
    }

    return module.dependencies.every(depId => this.hasModule(depId));
  }

  /**
   * Get all modules that depend on a specific module
   * @param moduleId Module ID to find dependents for
   * @returns Array of modules that depend on the specified module
   */
  public getDependents(moduleId: string): UIModule[] {
    return this.getFilteredModules(
      module => module.dependencies !== undefined && module.dependencies.includes(moduleId)
    );
  }
}

/**
 * Singleton instance of the ModuleRegistry
 */
export const moduleRegistry = ModuleRegistry.getInstance();

/**
 * Helper function to register a module
 * @param module The module to register
 */
export function registerModule(module: UIModule): void {
  moduleRegistry.register(module);
}

/**
 * Helper function to register multiple modules
 * @param modules Array of modules to register
 */
export function registerModules(modules: UIModule[]): void {
  moduleRegistry.registerMany(modules);
}