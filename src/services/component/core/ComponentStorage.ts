import { IComponentStorage } from './types';
import { ModifiableComponent } from '../../../utils/types';

/**
 * Provides storage and retrieval of component instances
 */
export class ComponentStorage implements IComponentStorage {
  private components: Map<string, ModifiableComponent> = new Map();

  /**
   * Store a component
   *
   * @param component The component to store
   */
  storeComponent(component: ModifiableComponent): void {
    if (!component.id) {
      throw new Error('Cannot store component without an ID');
    }
    
    // Ensure component has all required fields
    const enhancedComponent: ModifiableComponent = {
      ...component,
      versions: component.versions || [],
      relationships: component.relationships || {
        childrenIds: [],
        siblingIds: [],
        dependsOn: [],
        dependedOnBy: [],
        sharedStateKeys: [],
      }
    };
    
    this.components.set(component.id, enhancedComponent);
  }

  /**
   * Get a component by ID
   *
   * @param componentId The ID of the component to retrieve
   * @returns The component or null if not found
   */
  getComponent(componentId: string): ModifiableComponent | null {
    return this.components.get(componentId) || null;
  }

  /**
   * Remove a component
   *
   * @param componentId The ID of the component to remove
   * @returns True if the component was removed, false if it didn't exist
   */
  removeComponent(componentId: string): boolean {
    return this.components.delete(componentId);
  }

  /**
   * Update a component
   *
   * @param componentId The ID of the component to update
   * @param updates Partial component updates to apply
   * @returns True if the component was updated, false if it didn't exist
   */
  updateComponent(componentId: string, updates: Partial<ModifiableComponent>): boolean {
    const currentComponent = this.components.get(componentId);
    if (!currentComponent) {
      return false;
    }

    // Create updated component
    const updatedComponent = {
      ...currentComponent,
      ...updates,
    };

    // Update in components map
    this.components.set(componentId, updatedComponent);
    return true;
  }

  /**
   * Get all components
   *
   * @returns A record of all components by ID
   */
  getAllComponents(): Record<string, ModifiableComponent> {
    return Object.fromEntries(this.components.entries());
  }

  /**
   * Check if a component exists
   *
   * @param componentId The ID of the component to check
   * @returns True if the component exists
   */
  hasComponent(componentId: string): boolean {
    return this.components.has(componentId);
  }

  /**
   * Get the count of stored components
   *
   * @returns The number of stored components
   */
  getComponentCount(): number {
    return this.components.size;
  }

  /**
   * Find components by a predicate function
   *
   * @param predicate Function that returns true for matching components
   * @returns Array of matching components
   */
  findComponents(predicate: (component: ModifiableComponent) => boolean): ModifiableComponent[] {
    return Array.from(this.components.values()).filter(predicate);
  }

  /**
   * Clear all stored components
   */
  clearAll(): void {
    this.components.clear();
  }
}

export default ComponentStorage;