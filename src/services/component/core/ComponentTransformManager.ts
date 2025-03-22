import { ModifiableComponent } from '../../../utils/types';
import { logger, LogCategory } from '../../../utils/LoggingSystem';

/**
 * Component transform - processes component before/after registration
 */
export interface ComponentTransform {
  name: string;                      // Transform name
  priority: number;                  // Processing priority (higher = earlier)
  beforeRegister?: (component: ModifiableComponent) => Promise<ModifiableComponent>; // Run before registration
  afterRegister?: (component: ModifiableComponent) => Promise<void>; // Run after registration
  beforeUpdate?: (component: ModifiableComponent, updates: Partial<ModifiableComponent>) => Promise<Partial<ModifiableComponent>>; // Run before update
  afterUpdate?: (component: ModifiableComponent) => Promise<void>; // Run after update
  beforeUnregister?: (component: ModifiableComponent) => Promise<boolean>; // Run before unregister, return false to prevent
}

/**
 * Manages component transforms that process components before/after registration and updates
 */
export class ComponentTransformManager {
  private transforms: ComponentTransform[] = [];
  private log = logger.getChildLogger(LogCategory.COMPONENT);
  
  /**
   * Register a component transform
   * @param transform The transform to register
   */
  registerTransform(transform: ComponentTransform): void {
    // Remove any existing transform with the same name
    this.transforms = this.transforms.filter(t => t.name !== transform.name);
    
    // Add the new transform
    this.transforms.push(transform);
    
    // Sort transforms by priority
    this.transforms.sort((a, b) => b.priority - a.priority);
    
    this.log.debug(`Registered component transform: ${transform.name} (priority: ${transform.priority})`);
  }
  
  /**
   * Unregister a component transform
   * @param name The name of the transform to unregister
   */
  unregisterTransform(name: string): boolean {
    const initialLength = this.transforms.length;
    this.transforms = this.transforms.filter(t => t.name !== name);
    return this.transforms.length < initialLength;
  }
  
  /**
   * Get all registered transforms
   */
  getTransforms(): ComponentTransform[] {
    return [...this.transforms];
  }
  
  /**
   * Get transforms sorted by priority
   */
  getSortedTransforms(): ComponentTransform[] {
    return [...this.transforms].sort((a, b) => b.priority - a.priority);
  }
  
  /**
   * Apply transforms before component registration
   * @param component The component to transform
   */
  async applyBeforeRegisterTransforms(component: ModifiableComponent): Promise<ModifiableComponent> {
    let processedComponent = component;
    
    for (const transform of this.getSortedTransforms()) {
      if (transform.beforeRegister) {
        try {
          processedComponent = await transform.beforeRegister(processedComponent);
        } catch (error) {
          this.log.error(`Error in beforeRegister transform ${transform.name}`, error);
          throw error;
        }
      }
    }
    
    return processedComponent;
  }
  
  /**
   * Apply transforms after component registration
   * @param component The registered component
   */
  async applyAfterRegisterTransforms(component: ModifiableComponent): Promise<void> {
    for (const transform of this.getSortedTransforms()) {
      if (transform.afterRegister) {
        try {
          await transform.afterRegister(component);
        } catch (error) {
          this.log.error(`Error in afterRegister transform ${transform.name}`, error);
          throw error;
        }
      }
    }
  }
  
  /**
   * Apply transforms before component update
   * @param component The original component
   * @param updates The updates to apply
   */
  async applyBeforeUpdateTransforms(
    component: ModifiableComponent, 
    updates: Partial<ModifiableComponent>
  ): Promise<Partial<ModifiableComponent>> {
    let processedUpdates = { ...updates };
    
    for (const transform of this.getSortedTransforms()) {
      if (transform.beforeUpdate) {
        try {
          processedUpdates = await transform.beforeUpdate(component, processedUpdates);
        } catch (error) {
          this.log.error(`Error in beforeUpdate transform ${transform.name}`, error);
          throw error;
        }
      }
    }
    
    return processedUpdates;
  }
  
  /**
   * Apply transforms after component update
   * @param component The updated component
   */
  async applyAfterUpdateTransforms(component: ModifiableComponent): Promise<void> {
    for (const transform of this.getSortedTransforms()) {
      if (transform.afterUpdate) {
        try {
          await transform.afterUpdate(component);
        } catch (error) {
          this.log.error(`Error in afterUpdate transform ${transform.name}`, error);
          throw error;
        }
      }
    }
  }
  
  /**
   * Apply transforms before component unregistration
   * @param component The component to unregister
   * @returns False if any transform prevents unregistration, true otherwise
   */
  async applyBeforeUnregisterTransforms(component: ModifiableComponent): Promise<boolean> {
    for (const transform of this.getSortedTransforms()) {
      if (transform.beforeUnregister) {
        try {
          const shouldContinue = await transform.beforeUnregister(component);
          if (shouldContinue === false) {
            this.log.info(`Unregistration of component ${component.id} was cancelled by transform: ${transform.name}`);
            return false;
          }
        } catch (error) {
          this.log.error(`Error in beforeUnregister transform ${transform.name}`, error);
          throw error;
        }
      }
    }
    
    return true;
  }
}

export default ComponentTransformManager;